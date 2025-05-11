// app/layout.tsx
import ClientThemeProvider from "./ClientThemeProvider";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "India–Pakistan Tension News",
  icons: {
    icon: "/logo.svg", // your SVG favicon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* ← This tells Next.js where to inject your metadata */}
      <head />
      <body>
        {/* 1. Load AdSense after the page is interactive */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}`}
          crossOrigin="anonymous"
        />
        <Analytics />
        <ClientThemeProvider>{children}</ClientThemeProvider>
      </body>
    </html>
  );
}
