import type { MetadataRoute } from "next";
import { cachedSitemapListings } from "@/lib/server/cached";

const base = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await cachedSitemapListings();
  return [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/elanlar`, changeFrequency: "hourly", priority: 0.9 },
    ...listings.map((l) => ({ url: `${base}/elan/${l.id}`, lastModified: l.updatedAt, changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
