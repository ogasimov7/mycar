import "server-only";
import { desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/db";
import { toListing } from "./listings";

/** Public listing for metadata / JSON-LD — cached, invalidated by tag on edit */
export async function cachedListing(id: string) {
  "use cache";
  cacheTag(`listing-${id}`, "listings");
  cacheLife("hours");
  if (!process.env.DATABASE_URL) return null;
  const [row] = await getDb().select().from(schema.listings).where(eq(schema.listings.id, id)).limit(1);
  return row ? toListing(row) : null;
}

export async function cachedSitemapListings() {
  "use cache";
  cacheTag("listings");
  cacheLife("hours");
  if (!process.env.DATABASE_URL) return [];
  return getDb()
    .select({ id: schema.listings.id, updatedAt: schema.listings.updatedAt })
    .from(schema.listings)
    .where(eq(schema.listings.status, "active"))
    .orderBy(desc(schema.listings.createdAt))
    .limit(5000);
}
