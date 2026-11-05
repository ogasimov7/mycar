import "server-only";
import { auth } from "@clerk/nextjs/server";
import { InputError } from "./listings";

/** Clerk user id of the caller, or null when signed out */
export async function currentUserId() {
  const { userId } = await auth();
  return userId ?? null;
}

export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const unauthorized = () => json({ error: "Daxil olmaq lazımdır" }, 401);

/** Shared error mapping for route handlers */
export function handleError(e: unknown) {
  if (e instanceof InputError) return json({ error: e.message }, 400);
  console.error(e);
  return json({ error: "Server xətası" }, 500);
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    throw new InputError("JSON yanlışdır");
  }
}
