"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Photo frame with prev/next controls that works inside a link (cards):
 * arrows appear on hover, phones can swipe or tap the left/right edge, and
 * none of these interactions trigger the surrounding link.
 */
export function PhotoSwitcher({ photos, className = "", eager = false }: { photos: string[]; className?: string; eager?: boolean }) {
  const [i, setI] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const n = photos.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={`group/photo relative overflow-hidden ${className}`}
      onPointerDown={(e: PointerEvent) => {
        start.current = { x: e.clientX, y: e.clientY };
        swiped.current = false;
      }}
      onPointerUp={(e: PointerEvent) => {
        const s = start.current;
        start.current = null;
        if (!s || n < 2) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
          swiped.current = true;
          go(dx < 0 ? 1 : -1);
        }
      }}
      onClickCapture={(e) => {
        // a swipe must not open the listing
        if (swiped.current) {
          stop(e);
          swiped.current = false;
        }
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photos[i]} alt="" loading={eager ? "eager" : "lazy"} draggable={false} className="h-full w-full select-none object-cover" />

      {n > 1 && (
        <>
          {/* tap zones (phones) */}
          <button aria-label="Əvvəlki şəkil" onClick={(e) => (stop(e), go(-1))} className="absolute inset-y-0 left-0 w-1/4 sm:hidden" />
          <button aria-label="Növbəti şəkil" onClick={(e) => (stop(e), go(1))} className="absolute inset-y-0 right-0 w-1/4 sm:hidden" />
          {/* arrows (hover) */}
          <button
            aria-label="Əvvəlki şəkil"
            onClick={(e) => (stop(e), go(-1))}
            className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-text opacity-0 shadow transition group-hover/photo:opacity-100 sm:grid"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Növbəti şəkil"
            onClick={(e) => (stop(e), go(1))}
            className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-text opacity-0 shadow transition group-hover/photo:opacity-100 sm:grid"
          >
            <ChevronRight size={18} />
          </button>
          {/* dots */}
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {photos.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full bg-white shadow transition-all ${k === i ? "w-4" : "w-1.5 opacity-60"}`} />
            ))}
          </div>
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white">
            {i + 1}/{n}
          </span>
        </>
      )}
    </div>
  );
}
