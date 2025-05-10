"use client";

import { useState, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import dynamic from "next/dynamic";

// RSS item type
interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  enclosure?: { url: string };
  contentSnippet?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const AdUnit = dynamic(() => import("@/components/AdUnit"), { ssr: false });

export default function NewsDashboard() {
  const [activeTab, setActiveTab] = useState<"top" | "latest">("top");
  const endpoint = activeTab === "top" ? "/api/rss/top" : "/api/rss/latest";

  const getKey = (pageIndex: number, prev: any) =>
    prev && !prev.hasMore ? null : `${endpoint}?page=${pageIndex + 1}&limit=10`;

  const { data, size, setSize } = useSWRInfinite(getKey, fetcher);

  // reset pagination on tab change
  useEffect(() => {
    setSize(1);
  }, [endpoint, setSize]);

  const pages = data || [];
  const items = pages.flatMap((p) => p.items as RssItem[]);
  const hasMore = data ? data[data.length - 1].hasMore : false;
  const isLoadingMore =
    !data || (size > 0 && typeof data[size - 1] === "undefined");

  // infinite scroll
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
      <header className="mb-4 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
          📰 India–Pakistan Tension News
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-400">
          Everything you need to know
        </p>
      </header>

      {/* Tab selector */}
      <div className="sticky top-0 bg-gray-900 z-10 flex justify-center space-x-4 py-2">
        {["top", "latest"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg ${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            {tab === "top" ? "🔥 Trending" : "🆕 Latest"}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4 items-stretch">
        {items.map((item, idx) => {
          const domain = item.link
            ? new URL(item.link).hostname.replace(/^www\./, "")
            : "";

          // Only render valid HTTP(S) images
          const hasValidImage =
            typeof item.enclosure?.url === "string" &&
            (item.enclosure.url.startsWith("http://") ||
              item.enclosure.url.startsWith("https://"));

          return (
            <article
              key={item.link || idx}
              className="bg-gray-800 p-4 rounded-xl shadow flex flex-col h-full"
            >
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-lg hover:underline text-gray-100"
              >
                {item.title}
              </a>

              <p className="text-sm text-gray-400 mt-1">
                {new Date(item.pubDate).toLocaleString()}
              </p>

              {hasValidImage && (
                <img
                  src={item.enclosure!.url}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded-lg mt-2"
                />
              )}

              <p className="mt-2 text-gray-300 line-clamp-3 flex-1">
                {item.contentSnippet}
              </p>

              {/* Ad after every 5th card */}
              {idx > 0 && idx % 5 === 0 && (
                <div className="my-4">
                  <AdUnit slot="9758479058" />
                </div>
              )}

              <p className="text-sm text-gray-400 mt-2">Source: {domain}</p>
            </article>
          );
        })}
      </div>
    </main>
  );
}
