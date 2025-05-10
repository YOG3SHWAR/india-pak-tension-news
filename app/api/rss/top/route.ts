// app/api/rss/top/route.ts
import Parser from "rss-parser";
import { NextResponse } from "next/server";
import { FEEDS } from "@/lib/feeds";

const parser = new Parser();
function stripHtml(html: string = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));

  // weights defined in parallel with FEEDS order
  const weights = [1, 1, 1, 1, 1, 2, 1, 2];

  const lists = await Promise.all(
    FEEDS.map((url, idx) =>
      parser.parseURL(url).then((feed) =>
        feed.items.map((item) => ({
          ...item,
          _weight: weights[idx],
          contentSnippet: stripHtml(item.contentSnippet || item.content || ""),
        }))
      )
    )
  );

  // build count/weight maps
  const countMap = new Map<string, number>();
  const weightMap = new Map<string, number>();
  const itemMap = new Map<string, any>();
  for (const pageItems of lists) {
    for (const item of pageItems) {
      if (!item.link) continue;
      countMap.set(item.link, (countMap.get(item.link) || 0) + 1);
      weightMap.set(
        item.link,
        Math.max(weightMap.get(item.link) || 0, item._weight)
      );
      if (!itemMap.has(item.link)) itemMap.set(item.link, item);
    }
  }

  // filter & sort
  const filtered = Array.from(itemMap.values())
    .filter((item) => {
      const txt = (item.title + " " + item.contentSnippet).toLowerCase();
      return txt.includes("india") && txt.includes("pakistan");
    })
    .sort((a, b) => {
      const c = (countMap.get(b.link) || 0) - (countMap.get(a.link) || 0);
      if (c) return c;
      const w = (weightMap.get(b.link) || 0) - (weightMap.get(a.link) || 0);
      if (w) return w;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

  // paginate
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
