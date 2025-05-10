"use client";

import { useState, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import dynamic from "next/dynamic";

// RSS item type
export type RssItem = {
  title: string;
  link: string;
  pubDate: string;
  enclosure?: { url: string };
  contentSnippet?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const AdUnit = dynamic(() => import("@/components/AdUnit"), { ssr: false });

// Individual news card extracted to top-level component
function NewsItemCard({ item, idx }: { item: RssItem; idx: number }) {
  const [imgError, setImgError] = useState(false);
  const domain = item.link
    ? new URL(item.link).hostname.replace(/^www\./, "")
    : "";
  const hasValidImage =
    typeof item.enclosure?.url === "string" &&
    (item.enclosure.url.startsWith("http://") ||
      item.enclosure.url.startsWith("https://"));

  return (
    <article className="bg-gray-800 p-5 rounded-2xl shadow-xl flex flex-col h-full">
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-lg hover:underline text-gray-100"
      >
        {item.title}
      </a>

      <p className="text-xs text-gray-400 mt-1">
        {new Date(item.pubDate).toLocaleString()}
      </p>

      {hasValidImage && !imgError ? (
        <img
          src={item.enclosure!.url}
          alt={item.title}
          className="w-full h-48 object-cover rounded-lg mt-3"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-48 bg-gray-700 rounded-lg mt-3 flex items-center justify-center">
          <span className="text-gray-500">No image available</span>
        </div>
      )}

      <p className="mt-3 text-gray-300 line-clamp-3 flex-1">
        {item.contentSnippet}
      </p>

      <button
        onClick={() =>
          window.open(
            `https://www.youtube.com/results?search_query=${encodeURIComponent(
              item.title
            )}`,
            "_blank"
          )
        }
        className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 rounded-full shadow-xl transform transition-transform duration-200 hover:scale-105"
      >
        Check on YouTube
      </button>

      {idx > 0 && idx % 5 === 0 && (
        <div className="my-5">
          <AdUnit slot="9758479058" />
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">Source: {domain}</p>
    </article>
  );
}

export default function NewsDashboard() {
  const [activeTab, setActiveTab] = useState<"top" | "latest">("top");
  const endpoint = activeTab === "top" ? "/api/rss/top" : "/api/rss/latest";

  const getKey = (pageIndex: number, prev: any) =>
    prev && !prev.hasMore ? null : `${endpoint}?page=${pageIndex + 1}&limit=10`;

  const { data, size, setSize } = useSWRInfinite(getKey, fetcher);

  useEffect(() => {
    setSize(1);
  }, [endpoint, setSize]);

  const pages = data || [];
  const items = pages.flatMap((p) => p.items as RssItem[]);
  const hasMore = !!data && data[data.length - 1].hasMore;
  const isLoadingMore =
    !data || (size > 0 && typeof data[size - 1] === "undefined");

  useEffect(() => {
    function onScroll() {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 100 &&
        hasMore &&
        !isLoadingMore
      ) {
        setSize(size + 1);
      }
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMore, isLoadingMore, size, setSize]);

  return (
    <main className="min-h-screen p-4 bg-gray-900 text-gray-100">
      <header className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold">
          📰 India–Pakistan Tension News
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-400">
          Everything you need to know!!
        </p>
      </header>

      <div className="sticky top-0 bg-gray-900 z-10 flex justify-center space-x-4 py-3">
        {(["top", "latest"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full transition-all duration-200 flex items-center space-x-2 ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-400"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <span>{tab === "top" ? "🔥 Trending" : "🆕 Latest"}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6 items-stretch">
        {items.map((item, idx) => (
          <NewsItemCard key={item.link || idx} item={item} idx={idx} />
        ))}
      </div>
    </main>
  );
}
