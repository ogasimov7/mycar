import { getDb, schema } from "@/db";
import { currentUserId, handleError, json, readJson } from "@/lib/server/auth";
import { InputError } from "@/lib/server/listings";

export async function POST(req: Request) {
  try {
    const body = await readJson(req);
    const listingId = typeof body.listingId === "string" ? body.listingId.slice(0, 40) : "";
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 120) : "";
    if (!listingId || !reason) throw new InputError("Səbəb seçilməyib");
    const note = typeof body.note === "string" ? body.note.slice(0, 1000) : null;
    await getDb().insert(schema.reports).values({ listingId, reason, note, userId: await currentUserId() });
    return json({ ok: true }, 201);
  } catch (e) {
    return handleError(e);
  }
}
