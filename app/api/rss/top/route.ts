import Parser from "rss-parser";
import { NextResponse } from "next/server";
import { FEEDS } from "@/lib/feeds";

const parser = new Parser();
function stripHtml(html = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));

  // editorial weights in same order as FEEDS
  const weights = [1, 1, 1, 1, 1, 2, 1, 2];

  // 1) fetch & attach weight + sanitize
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

  // 2) build maps for consensus and max weight
  const countMap = new Map<string, number>();
  const weightMap = new Map<string, number>();
  const itemMap = new Map<string, any>();

  for (const items of lists) {
    for (const it of items) {
      if (!it.link) continue;
      // increment how many feeds mentioned this link
      countMap.set(it.link, (countMap.get(it.link) || 0) + 1);
      // track highest editorial weight
      weightMap.set(it.link, Math.max(weightMap.get(it.link) || 0, it._weight));
      // preserve the first copy
      if (!itemMap.has(it.link)) itemMap.set(it.link, it);
    }
  }

  // 3) compute a time-decayed score for each unique item
  const now = Date.now();
  const decayPower = 1.2;
  const scored = Array.from(itemMap.values()).map((item) => {
    const count = countMap.get(item.link) || 0;
    const maxWeight = weightMap.get(item.link) || 0;
    const ageMs = now - new Date(item.pubDate).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    // score = (count * editorial weight) / (ageHours + 1)^decayPower
    const score = (count * maxWeight) / Math.pow(ageHours + 1, decayPower);
    return { ...item, score };
  });

  // 4) filter to just India/Pakistan
  const filtered = scored.filter((item) => {
    const txt = (item.title + " " + item.contentSnippet).toLowerCase();
    return txt.includes("india") && txt.includes("pakistan");
  });

  // 5) sort by descending score
  filtered.sort((a, b) => b.score - a.score);

  // 6) paginate
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
