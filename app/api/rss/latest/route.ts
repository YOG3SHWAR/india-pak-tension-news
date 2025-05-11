// app/api/rss/latest/route.ts
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));

    const results = await Promise.all(
      FEEDS.map(async (feedUrl) => {
        try {
          const feed = await parser.parseURL(feedUrl);
          return feed.items;
        } catch {
          return [];
        }
      })
    );

    const allItems = results.flat();
    const seen = new Set<string>();
    const deduped = allItems.filter(
      (itm) => itm.link && !seen.has(itm.link!) && seen.add(itm.link!)
    );

    const filtered = deduped
      .sort(
        (a, b) =>
          new Date(b.pubDate || 0).getTime() -
          new Date(a.pubDate || 0).getTime()
      )
      .filter((item) => {
        const txt = (
          item.title +
          " " +
          (item.contentSnippet || item.content || "")
        ).toLowerCase();
        return txt.includes("india") && txt.includes("pakistan");
      });

    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);
    const hasMore = start + limit < filtered.length;

    return NextResponse.json(
      { items, hasMore },
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
