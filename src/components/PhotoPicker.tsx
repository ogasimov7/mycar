"use client";

import { Camera, X } from "lucide-react";
import { compressImage } from "@/lib/image";

export function PhotoPicker({ photos, onChange, max = 6 }: { photos: string[]; onChange: (p: string[]) => void; max?: number }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {photos.length < max && (
        <label className="grid h-24 w-24 shrink-0 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-line text-muted">
          <span className="flex flex-col items-center gap-1 text-[11px] font-semibold">
            <Camera size={22} /> Şəkil əlavə et
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []).slice(0, max - photos.length);
              const out = await Promise.all(files.map((f) => compressImage(f)));
              onChange([...photos, ...out]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {photos.map((p, i) => (
        <div key={i} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
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
