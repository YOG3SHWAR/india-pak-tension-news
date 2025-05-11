# India–Pakistan Tension News

A lightweight news dashboard aggregating RSS articles on India–Pakistan tensions, built with Next.js 13 (App Router), React, and Tailwind CSS. Deployed on Vercel.

**Live Website:** [India-Pakistan Tension News](https://india-pak-tension-news.vercel.app)

---

## Key Features

- **Trending & Latest Tabs:** Toggle between top and newest articles.
- **Infinite Scroll:** Loads more content as you browse.
- **Article Cards:** Title (clickable), date, image (RSS or fallback), snippet, and source.
- **Action Buttons:** One-click YouTube search and share via Web Share API or WhatsApp.
- **Responsive & Themed:** Mobile-first design with light/dark modes.
- **Ads & Analytics:** Google AdSense slots and Vercel Analytics integrated.

## Tech Stack

- **Framework:** Next.js 13 (App Router)
- **UI:** React, Tailwind CSS
- **Data Fetching:** SWR Infinite
- **Sharing:** Web Share API, html2canvas
- **Hosting & Analytics:** Vercel

## Quick Start

1. **Clone & Install**

   ```bash
   git clone https://github.com/your-username/india-pak-tension-news.git
   cd india-pak-tension-news
   npm install
   ```

2. **Configure**
   Create `.env.local`:

   ```ini
   NEXT_PUBLIC_ADSENSE_PUB_ID=ca-pub-xxxxxxxxxxxxxxxx
   ```

3. **Run Locally**

   ```bash
   npm run dev
   # visit http://localhost:3000
   ```

4. **Build & Deploy**

   ```bash
   npm run build
   npm run start
   ```

Navigate to Vercel and connect your GitHub repo for automated deployments.
