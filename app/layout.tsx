// app/layout.tsx
import ClientThemeProvider from "./ClientThemeProvider";
import "./globals.css";
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* 1. Load AdSense after the page is interactive */}
        <Script
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUB_ID}`}
          crossOrigin="anonymous"
        />

        <ClientThemeProvider>{children}</ClientThemeProvider>
      </body>
    </html>
  );
}
