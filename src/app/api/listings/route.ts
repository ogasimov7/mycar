import { connection } from "next/server";
import { revalidateTag } from "next/cache";
import { getDb, schema } from "@/db";
import { uid } from "@/lib/format";
import { currentUserId, handleError, json, readJson, unauthorized } from "@/lib/server/auth";
import { allListings, parseListingInput, toListing } from "@/lib/server/listings";

export async function GET() {
  // per-request data; must stay outside try/catch so prerendering can bail out cleanly
  await connection();
  try {
    return json({ listings: await allListings(await currentUserId()) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await currentUserId();
    if (!userId) return unauthorized();
    const input = parseListingInput(await readJson(req));
    const now = new Date();
    const [row] = await getDb()
      .insert(schema.listings)
      .values({ ...input, id: uid(), ownerId: userId, createdAt: now, updatedAt: now, priceHistory: [{ date: now.toISOString(), price: input.price }] })
      .returning();
    revalidateTag("listings", "max");
    return json({ listing: toListing(row, userId) }, 201);
  } catch (e) {
    return handleError(e);
  }
}
