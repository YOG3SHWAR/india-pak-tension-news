// app/api/rss/latest/route.ts
import Parser from "rss-parser";
import { NextResponse } from "next/server";
import { FEEDS } from "@/lib/feeds";

const parser = new Parser();
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));

  // 1) fetch & flatten
  const allItems = (
    await Promise.all(
      FEEDS.map((url) => parser.parseURL(url).then((feed) => feed.items))
    )
  ).flat();

  // 2) dedupe
  const seen = new Set<string>();
  const deduped = allItems.filter((item) => {
    if (!item.link || seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  // 3) sort & filter for India–Pakistan
  const filtered = deduped
    .sort(
      (a, b) =>
        new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
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
}
