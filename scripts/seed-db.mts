/**
 * Inserts the demo listings into Postgres (idempotent).
 *   npx dotenv -e .env.local -- npx tsx scripts/seed-db.mts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { seedListings } from "../src/lib/data/seed";
import { listings } from "../src/db/schema";

const db = drizzle(neon(process.env.DATABASE_URL!));

const rows = seedListings().map((l) => ({
  id: l.id,
  ownerId: null,
  modelId: l.modelId,
  year: l.year,
  price: l.price,
  mileage: l.mileage,
  color: l.color,
  colorName: l.colorName,
  fuel: l.fuel,
  gearbox: l.gearbox,
  engine: l.engine,
  city: l.city,
  phone: l.phone,
  sellerName: l.sellerName,
  description: l.description,
  photos: l.photos,
  photoCredit: l.photoCredit ?? null,
  priceHistory: l.priceHistory ?? [],
  status: l.status,
  createdAt: new Date(l.createdAt),
}));

const res = await db.insert(listings).values(rows).onConflictDoNothing({ target: listings.id }).returning({ id: listings.id });
console.log(`seeded ${res.length} of ${rows.length} demo listings`);
