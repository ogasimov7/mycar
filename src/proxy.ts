import { clerkMiddleware } from "@clerk/nextjs/server";

// Only API routes read the session on the server. Pages are public and client-rendered, so they skip
// Clerk's handshake redirect entirely — crawlers and first-time visitors get a plain 200.
export default clerkMiddleware();

export const config = {
  matcher: ["/(api|trpc)(.*)"],
};
