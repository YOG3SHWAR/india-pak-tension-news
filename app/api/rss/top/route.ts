// app/api/rss/top/route.ts
import Parser from "rss-parser";
import { NextResponse } from "next/server";

// assign weights per source
// app/api/rss/top/route.ts
const FEEDS: { url: string; weight: number }[] = [
  // 5 Indian outlets at weight 1
  {
    url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
    weight: 1,
  },
  {
    url: "https://www.hindustantimes.com/feeds/rss/top-news/rssfeed.xml",
    weight: 1,
  },
  { url: "https://www.thehindu.com/feeder/default.rss", weight: 1 },
  { url: "https://indianexpress.com/section/india/feed/", weight: 1 },
  { url: "https://feeds.feedburner.com/ndtvnews-top-stories", weight: 1 },

  // ABC International at weight 2
  { url: "http://feeds.abcnews.com/abcnews/internationalheadlines", weight: 2 },

  // Al Jazeera “All News” at weight 2
  { url: "https://www.aljazeera.com/xml/rss/all.xml", weight: 2 },
];
const parser = new Parser();

function stripHtml(html: string = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  // 1) fetch & tag with weight + sanitize snippet
  const lists = await Promise.all(
    FEEDS.map(({ url, weight }) =>
      parser.parseURL(url).then((feed) =>
        feed.items.map((item) => ({
          ...item,
          _weight: weight,
          contentSnippet: stripHtml(item.contentSnippet || item.content || ""),
        }))
      )
    )
  );

  // 2) flatten & dedupe
  const countMap = new Map<string, number>();
  const weightMap = new Map<string, number>();
  const itemMap = new Map<string, any>();

  for (const items of lists) {
    for (const item of items) {
      if (!item.link) continue;
      // count appearances
      countMap.set(item.link, (countMap.get(item.link) || 0) + 1);
      // track highest weight seen
      weightMap.set(
        item.link,
        Math.max(weightMap.get(item.link) || 0, item._weight)
      );
      // store first copy of the item
      if (!itemMap.has(item.link)) {
        itemMap.set(item.link, item);
      }
    }
  }

  // 3) build array with _count and _maxWeight
  const deduped = Array.from(itemMap.entries()).map(([link, item]) => ({
    ...item,
    _count: countMap.get(link)!,
    _maxWeight: weightMap.get(link)!,
  }));

  // 4) filter to only India + Pakistan stories
  const filtered = deduped.filter((item) => {
    const txt = (item.title + " " + item.contentSnippet).toLowerCase();
    return txt.includes("india") && txt.includes("pakistan");
  });

  // 5) sort by count, then by weight, then by recency
  filtered.sort((a, b) => {
    const c = b._count - a._count;
    if (c) return c;
    const w = b._maxWeight - a._maxWeight;
    if (w) return w;
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });

  // 6) return the top 10
  const top10 = filtered.slice(0, 100);
  return NextResponse.json(top10, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
    },
  });
}
