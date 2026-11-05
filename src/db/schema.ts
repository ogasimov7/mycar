import { index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { GarageCar, Listing } from "@/lib/types";

/** Public car listings. owner_id = Clerk user id (null for the demo seed listings) */
export const listings = pgTable(
  "listings",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id"),
    modelId: text("model_id").notNull(),
    year: integer("year").notNull(),
    price: integer("price").notNull(),
    mileage: integer("mileage").notNull(),
    color: text("color").notNull(),
    colorName: text("color_name").notNull(),
    fuel: text("fuel").$type<Listing["fuel"]>().notNull(),
    gearbox: text("gearbox").$type<Listing["gearbox"]>().notNull(),
    engine: text("engine").notNull(),
    city: text("city").notNull(),
    phone: text("phone").notNull(),
    sellerName: text("seller_name").notNull(),
    description: text("description").notNull().default(""),
    photos: jsonb("photos").$type<string[]>().notNull().default([]),
    photoCredit: jsonb("photo_credit").$type<Listing["photoCredit"]>(),
    priceHistory: jsonb("price_history").$type<NonNullable<Listing["priceHistory"]>>().notNull().default([]),
    status: text("status").$type<Listing["status"]>().notNull().default("active"),
    garageCarId: text("garage_car_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("listings_owner_idx").on(t.ownerId), index("listings_status_created_idx").on(t.status, t.createdAt)],
);

/** Each user's virtual garage; the whole car (repairs, documents, fuel log…) is one JSON document */
export const garageCars = pgTable(
  "garage_cars",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    data: jsonb("data").$type<GarageCar>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("garage_user_idx").on(t.userId)],
);

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  userId: text("user_id"),
  reason: text("reason").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
