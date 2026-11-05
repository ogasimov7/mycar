import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk reads the session for API routes; pages stay public (the store shows a sign-in prompt where needed)
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|glb)).*)",
    "/(api|trpc)(.*)",
  ],
};
