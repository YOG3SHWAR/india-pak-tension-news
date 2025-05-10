// app/NewsDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useTheme } from "next-themes";
import AdUnit from "@/components/AdUnit";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NewsDashboard() {
  // fetch data
  const { data: latest, error: err1 } = useSWR("/api/rss/latest", fetcher, {
    refreshInterval: 300_000,
  });
  const { data: top10, error: err2 } = useSWR("/api/rss/top", fetcher, {
    refreshInterval: 300_000,
  });

  // UI state
  const [activeTab, setActiveTab] = useState<"trending" | "latest">("trending");

  // theme toggle (commented out if unused)
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (err1 || err2)
    return <p className="p-4 text-red-500">Failed to load news.</p>;
  if (!latest || !top10) return <p className="p-4">Loading…</p>;

  const items = activeTab === "trending" ? top10 : latest;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold mb-2 sm:mb-0">
          📰 India–Pakistan Tension News
        </h1>
        {/*
        {mounted && (
          <button
            onClick={() => {
              const current = theme === "system" ? resolvedTheme : theme;
              setTheme(current === "dark" ? "light" : "dark");
            }}
            className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition"
          >
            {theme === "dark" || (theme === "system" && resolvedTheme === "dark")
              ? "☀️ Light"
              : "🌙 Dark"}
          </button>
        )}
        */}
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("trending")}
          className={`flex-1 py-2 text-center font-medium transition ${
            activeTab === "trending"
              ? "border-b-4 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          🔥 Trending
        </button>
        <button
          onClick={() => setActiveTab("latest")}
          className={`flex-1 py-2 text-center font-medium transition ${
            activeTab === "latest"
              ? "border-b-4 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          🆕 Latest
        </button>
      </div>

      {/* Content grid + ads */}
      <section className="p-4 grid gap-6 grid-cols-1 md:grid-cols-2">
        {items.map((item: any, i: number) => {
          const domain = item.link
            ? new URL(item.link).hostname.replace(/^www\./, "")
            : "";

          return (
            <div key={item.link}>
              <article className="flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow hover:shadow-lg transition">
                {/* Title */}
                <div className="p-4 flex-1 flex flex-col">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl font-semibold hover:underline mb-2"
                  >
                    {item.title}
                  </a>

                  {/* Image or snippet */}
                  {item.enclosure?.url ? (
                    <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
                      <img
                        src={item.enclosure.url}
                        alt={item.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="aspect-w-16 aspect-h-9 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <p className="text-sm line-clamp-4 text-gray-800 dark:text-gray-200">
                        {item.contentSnippet ||
                          item.content ||
                          "No description available."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer: time & source */}
                <div className="flex items-center justify-between px-4 pb-4 pt-2">
                  <time className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.pubDate).toLocaleString()}
                  </time>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {domain}
                  </span>
                </div>
              </article>

              {/* Ad every 5th item */}
              {i > 0 && i % 5 === 0 && (
                <div className="my-8 flex justify-center">
                  <AdUnit slot="YOUR_AD_SLOT_ID" />
                </div>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
