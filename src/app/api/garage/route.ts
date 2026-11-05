import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { currentUserId, handleError, json, unauthorized } from "@/lib/server/auth";

export async function GET() {
  // per-request data; must stay outside try/catch so prerendering can bail out cleanly
  await connection();
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();
    const rows = await getDb().select().from(schema.garageCars).where(eq(schema.garageCars.userId, userId));
    return json({ cars: rows.map((r) => r.data) });
  } catch (e) {
    return handleError(e);
  }
}
