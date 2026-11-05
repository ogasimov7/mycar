import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getModel } from "@/lib/data/models";
import type { Fuel, Gearbox, Listing } from "@/lib/types";

type Row = typeof schema.listings.$inferSelect;

/** DB row → client Listing (`mine` is filled in for the signed-in owner) */
export function toListing(r: Row, userId?: string | null): Listing {
  return {
    id: r.id,
    modelId: r.modelId,
    year: r.year,
    price: r.price,
    mileage: r.mileage,
    color: r.color,
    colorName: r.colorName,
    fuel: r.fuel,
    gearbox: r.gearbox,
    engine: r.engine,
    city: r.city,
    phone: r.phone,
    sellerName: r.sellerName,
    description: r.description,
    photos: r.photos,
    ...(r.photoCredit ? { photoCredit: r.photoCredit } : {}),
    priceHistory: r.priceHistory,
    status: r.status,
    ...(r.garageCarId ? { garageCarId: r.garageCarId } : {}),
    createdAt: r.createdAt.toISOString(),
    ...(userId && r.ownerId === userId ? { mine: true } : {}),
  };
}

export async function allListings(userId?: string | null) {
  const rows = await getDb().select().from(schema.listings).orderBy(desc(schema.listings.createdAt)).limit(1000);
  return rows.map((r) => toListing(r, userId));
}

export async function listingById(id: string) {
  const [row] = await getDb().select().from(schema.listings).where(eq(schema.listings.id, id)).limit(1);
  return row ?? null;
}

/* ---------- input validation (never trust the client) ---------- */

const FUELS: Fuel[] = ["Benzin", "Dizel", "Hibrid", "Elektrik", "Qaz"];
const GEARBOXES: Gearbox[] = ["Avtomat", "Mexaniki", "Robot", "Variator"];


export class InputError extends Error {}

const str = (v: unknown, max: number, field: string, required = true) => {
  if (v === undefined || v === null || v === "") {
    if (required) throw new InputError(`${field} tələb olunur`);
    return "";
  }
  if (typeof v !== "string") throw new InputError(`${field} yanlışdır`);
  return v.trim().slice(0, max);
};
const int = (v: unknown, min: number, max: number, field: string) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) throw new InputError(`${field} yanlışdır`);
  return Math.round(n);
};

/** Only our own Blob store or the bundled demo photos are allowed as photo URLs */
function photoList(v: unknown) {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > 10) throw new InputError("Şəkillər yanlışdır");
  return v.map((p) => {
    if (typeof p !== "string") throw new InputError("Şəkil yanlışdır");
    const ok = p.startsWith("/listings/") || /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(p);
    if (!ok) throw new InputError("Şəkil ünvanı qəbul olunmur");
    return p;
  });
}

export type ListingInput = Omit<typeof schema.listings.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt" | "priceHistory" | "photoCredit">;

export function parseListingInput(body: Record<string, unknown>): ListingInput {
  const modelId = str(body.modelId, 60, "Model");
  if (!getModel(modelId)) throw new InputError("Model tapılmadı");
  const fuel = str(body.fuel, 20, "Yanacaq") as Fuel;
  const gearbox = str(body.gearbox, 20, "Sürətlər qutusu") as Gearbox;
  if (!FUELS.includes(fuel)) throw new InputError("Yanacaq yanlışdır");
  if (!GEARBOXES.includes(gearbox)) throw new InputError("Sürətlər qutusu yanlışdır");
  return {
    modelId,
    year: int(body.year, 1960, new Date().getFullYear() + 1, "İl"),
    price: int(body.price, 100, 5_000_000, "Qiymət"),
    mileage: int(body.mileage, 0, 2_000_000, "Yürüş"),
    color: str(body.color, 9, "Rəng"),
    colorName: str(body.colorName, 30, "Rəng"),
    fuel,
    gearbox,
    engine: str(body.engine, 40, "Mühərrik", false) || "—",
    city: str(body.city, 40, "Şəhər"),
    phone: str(body.phone, 24, "Telefon"),
    sellerName: str(body.sellerName, 60, "Ad", false) || "Satıcı",
    description: str(body.description, 3000, "Təsvir", false),
    photos: photoList(body.photos),
    status: body.status === "sold" ? "sold" : "active",
    garageCarId: body.garageCarId ? str(body.garageCarId, 40, "Qaraj") : null,
  };
}

/** Fields an owner may change later */
export function parseListingPatch(body: Record<string, unknown>) {
  const out: Partial<ListingInput> = {};
  if (body.price !== undefined) out.price = int(body.price, 100, 5_000_000, "Qiymət");
  if (body.mileage !== undefined) out.mileage = int(body.mileage, 0, 2_000_000, "Yürüş");
  if (body.city !== undefined) out.city = str(body.city, 40, "Şəhər");
  if (body.phone !== undefined) out.phone = str(body.phone, 24, "Telefon");
  if (body.sellerName !== undefined) out.sellerName = str(body.sellerName, 60, "Ad", false) || "Satıcı";
  if (body.description !== undefined) out.description = str(body.description, 3000, "Təsvir", false);
  if (body.photos !== undefined) out.photos = photoList(body.photos);
  if (body.status !== undefined) out.status = body.status === "sold" ? "sold" : "active";
  return out;
}
