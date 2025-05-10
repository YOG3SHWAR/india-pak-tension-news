// app/page.tsx
import NewsDashboard from "./NewsDashboard";

// Optional: page-level metadata
export const metadata = {
  title: "India–Pakistan Tension News",
  description: "Latest & top India–Pakistan tension headlines from RSS feeds",
};

export default function Page() {
  return <NewsDashboard />;
}
