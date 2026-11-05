"use client";

import { useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { dataUrlToBlob, uploadPhoto } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { toast } from "./Toast";

/** Picks photos, compresses them in the browser and uploads them to Vercel Blob */
export function PhotoPicker({ photos, onChange, max = 8 }: { photos: string[]; onChange: (p: string[]) => void; max?: number }) {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const [pending, setPending] = useState(0);

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {photos.length + pending < max && (
        <label
          className="grid h-24 w-24 shrink-0 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-line text-muted"
          onClick={(e) => {
            if (isSignedIn) return;
            e.preventDefault();
            toast("Şəkil yükləmək üçün daxil ol");
            clerk.openSignIn();
          }}
        >
          <span className="flex flex-col items-center gap-1 text-[11px] font-semibold">
            <Camera size={22} /> Şəkil əlavə et
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []).slice(0, max - photos.length - pending);
              e.target.value = "";
              if (!files.length) return;
              setPending((n) => n + files.length);
              const urls: string[] = [];
              await Promise.all(
                files.map(async (f) => {
                  try {
                    const blob = await dataUrlToBlob(await compressImage(f, 1600, 0.8));
                    urls.push(await uploadPhoto(blob));
                  } catch {
                    toast("Şəkil yüklənmədi — yenidən cəhd et");
                  } finally {
                    setPending((n) => n - 1);
                  }
                }),
              );
              if (urls.length) onChange([...photos, ...urls]);
            }}
          />
        </label>
      )}
      {Array.from({ length: pending }).map((_, i) => (
        <div key={`p${i}`} className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-surface-2 text-muted">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ))}
      {photos.map((p, i) => (
        <div key={p} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Sil"
            onClick={() => onChange(photos.filter((_, j) => j !== i))}
            className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"
          >
            <X size={14} />
          </button>
          {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-accent px-1.5 text-[10px] font-bold text-accent-ink">Əsas</span>}
        </div>
      ))}
    </div>
  );
}
