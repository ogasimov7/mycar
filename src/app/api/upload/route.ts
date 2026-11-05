import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { currentUserId, json } from "@/lib/server/auth";

/** Issues short-lived client-upload tokens for listing photos (signed-in users only) */
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const userId = await currentUserId();
        if (!userId) throw new Error("Daxil olmaq lazımdır");
        if (!pathname.startsWith("listings/")) throw new Error("Yanlış yol");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 6 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async () => {},
    });
    return json(result);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
}
