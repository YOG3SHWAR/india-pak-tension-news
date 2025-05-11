// app/api/rss/top/route.ts
import Parser from "rss-parser";
import { NextResponse } from "next/server";
import { FEEDS } from "@/lib/feeds";

export const runtime = "nodejs";
export const revalidate = 300;

const parser = new Parser({
  headers: {
    // pretend to be a modern browser
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

export async function GET(req: Request) {
  try {
    const urlObj = new URL(req.url);
    const page = Math.max(1, parseInt(urlObj.searchParams.get("page") || "1"));
    const limit = Math.max(
      1,
      parseInt(urlObj.searchParams.get("limit") || "10")
    );

    // editorial weights in same order as FEEDS
    const weights = [1, 1, 1, 1, 1, 2, 1, 2];

    // 1) fetch & sanitize each feed (never reject)
    const lists: Array<
      Array<{
        title: string;
        link?: string;
        pubDate?: string;
        contentSnippet: string;
        enclosure?: { url: string };
      }>
    > = await Promise.all(
      FEEDS.map(async (feedUrl) => {
        try {
          const feed = await parser.parseURL(feedUrl);
          return feed.items.map((item) => ({
            title: item.title || "",
            link: item.link,
            pubDate: item.pubDate,
            enclosure: item.enclosure,
            contentSnippet: stripHtml(
              item.contentSnippet || item.content || ""
            ),
          }));
        } catch (err) {
          console.error(`[rss/top] failed to fetch ${feedUrl}:`, err);
          return [];
        }
      })
    );

    // 2) compute score for each item
    const decay = 1.2;
    const now = Date.now();

    const scored = lists.flatMap((feedItems, feedIdx) => {
      const w = weights[feedIdx] ?? 1;
      return feedItems.map((item, idx) => {
        // recency in hours
        const pubTime = item.pubDate ? new Date(item.pubDate).getTime() : now;
        const ageHours = (now - pubTime) / (1000 * 60 * 60);

        // position factor (top of feed => 1, bottom => ~0)
        const posFactor = feedItems.length
          ? (feedItems.length - idx) / feedItems.length
          : 0;

        // keyword boost for “india” & “pakistan”
        const txt = (item.title + " " + item.contentSnippet).toLowerCase();
        const indiaHits = (txt.match(/india/g) || []).length;
        const pakistanHits = (txt.match(/pakistan/g) || []).length;
        const kwBoost = 1 + indiaHits + pakistanHits;

        const score = (w * posFactor * kwBoost) / Math.pow(ageHours + 1, decay);
        return { ...item, score };
      });
    });

    // 3) filter for both keywords, sort by descending score
    const filtered = scored
      .filter((item) => {
        const txt = (item.title + " " + item.contentSnippet).toLowerCase();
        return txt.includes("india") && txt.includes("pakistan");
      })
      .sort((a, b) => b.score - a.score);

    // 4) paginate
    const start = (page - 1) * limit;
    const pageItems = filtered.slice(start, start + limit);
    const hasMore = start + limit < filtered.length;

    return NextResponse.json(
      { items: pageItems, hasMore },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[rss/top] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
