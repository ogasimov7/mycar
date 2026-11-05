import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { currentUserId, handleError, json, readJson, unauthorized } from "@/lib/server/auth";
import { InputError } from "@/lib/server/listings";
import type { GarageCar } from "@/lib/types";

const MAX_BYTES = 2_000_000; // documents may carry a photo or two

/** Upsert one garage car (the client keeps the full document and syncs it here) */
export async function PUT(req: Request, ctx: RouteContext<"/api/garage/[id]">) {
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();
    const { id } = await ctx.params;
    const body = await readJson(req);
    const car = body.car as GarageCar | undefined;
    if (!car || car.id !== id || typeof car.modelId !== "string" || !Array.isArray(car.repairs)) throw new InputError("Maşın məlumatı yanlışdır");
    if (JSON.stringify(car).length > MAX_BYTES) throw new InputError("Maşın məlumatı çox böyükdür — sənəd şəkillərini azalt");

    const db = getDb();
    const [existing] = await db.select({ userId: schema.garageCars.userId }).from(schema.garageCars).where(eq(schema.garageCars.id, id)).limit(1);
    if (existing && existing.userId !== userId) return json({ error: "Bu maşın sizin deyil" }, 403);
    await db
      .insert(schema.garageCars)
      .values({ id, userId, data: car, updatedAt: new Date() })
      .onConflictDoUpdate({ target: schema.garageCars.id, set: { data: car, updatedAt: new Date() } });
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/garage/[id]">) {
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();
    const { id } = await ctx.params;
    await getDb()
      .delete(schema.garageCars)
      .where(and(eq(schema.garageCars.id, id), eq(schema.garageCars.userId, userId)));
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
