import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { getDb, schema } from "@/db";
import { currentUserId, handleError, json, readJson, unauthorized } from "@/lib/server/auth";
import { listingById, parseListingPatch, toListing } from "@/lib/server/listings";

export async function GET(_req: Request, ctx: RouteContext<"/api/listings/[id]">) {
  try {
    const { id } = await ctx.params;
    const row = await listingById(id);
    if (!row) return json({ error: "Elan tapılmadı" }, 404);
    return json({ listing: toListing(row, await currentUserId()) });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/listings/[id]">) {
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();
    const { id } = await ctx.params;
    const row = await listingById(id);
    if (!row) return json({ error: "Elan tapılmadı" }, 404);
    if (row.ownerId !== userId) return json({ error: "Bu elan sizin deyil" }, 403);
    const patch = parseListingPatch(await readJson(req));
    const now = new Date();
    const priceHistory =
      patch.price !== undefined && patch.price !== row.price ? [...row.priceHistory, { date: now.toISOString(), price: patch.price }] : row.priceHistory;
    const [updated] = await getDb()
      .update(schema.listings)
      .set({ ...patch, priceHistory, updatedAt: now })
      .where(eq(schema.listings.id, id))
      .returning();
    revalidateTag("listings", "max");
    revalidateTag(`listing-${id}`, "max");
    return json({ listing: toListing(updated, userId) });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/listings/[id]">) {
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();
    const { id } = await ctx.params;
    const row = await listingById(id);
    if (!row) return json({ ok: true });
    if (row.ownerId !== userId) return json({ error: "Bu elan sizin deyil" }, 403);
    await getDb().delete(schema.listings).where(eq(schema.listings.id, id));
    revalidateTag("listings", "max");
    revalidateTag(`listing-${id}`, "max");
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
