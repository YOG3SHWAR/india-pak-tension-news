// app/api/rss/latest/route.ts
import Parser from "rss-parser";
import { NextResponse } from "next/server";
import { FEEDS } from "@/lib/feeds";

// this tells Next to run on the Node.js runtime (not Edge)
// and to cache at the CDN for 300s
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

export async function GET(req: Request) {
  try {
    const urlObj = new URL(req.url);
    const page = Math.max(1, parseInt(urlObj.searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(urlObj.searchParams.get("limit") || "10"));

    // 1) fetch each feed but never throw
    const results = await Promise.all(
      FEEDS.map(async (feedUrl) => {
        try {
          const feed = await parser.parseURL(feedUrl);
          return feed.items;
        } catch (err) {
          console.error(`[rss/latest] failed to fetch ${feedUrl}:`, err);
          return []; // swallow errors
        }
      })
    );

    // 2) flatten + dedupe
    const allItems = results.flat();
    const seen = new Set<string>();
    const deduped = allItems.filter((item) => {
      if (!item.link || seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    });

    // 3) sort by pubDate, filter “india” & “pakistan”
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

    // 4) paginate
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
  } catch (err) {
    console.error("[rss/latest] unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
