// app/api/rss/top/route.ts
import Parser from "rss-parser";
import { NextResponse, type NextRequest } from "next/server";
import { FEEDS } from "@/lib/feeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/114.0.0.0 Safari/537.36",
  },
});

function stripHtml(html = ""): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));

    const weights = [1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1];

    const rawLists = await Promise.all(
      FEEDS.map(async (feedUrl, idx) => {
        const w = weights[idx] ?? 1;
        try {
          const feed = await parser.parseURL(feedUrl);
          return feed.items.map((itm) => ({
            title: itm.title || "",
            link: itm.link,
            pubDate: itm.pubDate,
            enclosure: itm.enclosure,
            contentSnippet: stripHtml(itm.contentSnippet || itm.content || ""),
            weight: w,
          }));
        } catch {
          return [];
        }
      })
    );

    const allItems = rawLists.flat();
    const keywordFiltered = allItems.filter((item) => {
      const txt = (item.title + " " + item.contentSnippet).toLowerCase();
      return txt.includes("india") && txt.includes("pakistan");
    });
    if (!keywordFiltered.length) {
      return NextResponse.json({ items: [], hasMore: false });
    }

    const dfMap = new Map<string, number>();
    const docsTokens: string[][] = [];
    for (const item of keywordFiltered) {
      const tokens = tokenize(item.title + " " + item.contentSnippet);
      docsTokens.push(tokens);
      const unique = new Set(tokens);
      unique.forEach((t) => dfMap.set(t, (dfMap.get(t) || 0) + 1));
    }
    const N = keywordFiltered.length;
    const idfMap = new Map<string, number>();
    dfMap.forEach((df, term) => {
      idfMap.set(term, Math.log((N + 1) / (df + 1)) + 1);
    });

    const decay = 0.8;
    const now = Date.now();
    const scored = keywordFiltered.map((item, idx) => {
      const tokens = docsTokens[idx];
      const termCounts = tokens.reduce(
        (m, t) => m.set(t, (m.get(t) || 0) + 1),
        new Map<string, number>()
      );
      const len = tokens.length || 1;
      let tfidf = 0;
      termCounts.forEach((cnt, term) => {
        const tf = cnt / len;
        const idf = idfMap.get(term) || 0;
        tfidf += tf * idf;
      });
      const pubTime = item.pubDate ? new Date(item.pubDate).getTime() : now;
      const ageHrs = (now - pubTime) / (1000 * 60 * 60);
      const recencyFactor = 1 / Math.pow(ageHrs + 1, decay);
      return { ...item, score: tfidf * item.weight * recencyFactor };
    });

    scored.sort((a, b) => b.score - a.score);
    const start = (page - 1) * limit;
    const pageItems = scored.slice(start, start + limit);
    const hasMore = start + limit < scored.length;

    return NextResponse.json(
      { items: pageItems, hasMore },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
