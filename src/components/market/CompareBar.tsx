"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitCompareArrows, X } from "lucide-react";
import { getModel } from "@/lib/data/models";
import { useHydrated, useStore } from "@/lib/store";

/** Floating tray with the cars picked for comparison */
export function CompareBar() {
  const path = usePathname();
  const hydrated = useHydrated();
  const ids = useStore((s) => s.compare);
  const listings = useStore((s) => s.listings);
  const { toggleCompare, clearCompare } = useStore.getState();
  if (!hydrated || !ids.length || path.startsWith("/muqayise") || path.startsWith("/qaraj")) return null;
  const cars = ids.map((id) => listings.find((l) => l.id === id)).filter((l) => !!l);
  const onListing = path.startsWith("/elan/");

  return (
    <div className={`fixed inset-x-3 z-40 mx-auto max-w-xl lg:bottom-6 lg:left-24 ${onListing ? "bottom-4" : "bottom-[96px]"}`}>
      <div className="flex items-center gap-2 rounded-[22px] bg-white p-2 pl-3 shadow-[0_14px_40px_-12px_rgb(0_0_0/0.35)] ring-1 ring-line">
        <GitCompareArrows size={18} className="shrink-0" />
        <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
          {cars.map((l) => {
            const m = getModel(l.modelId);
            return (
              <span key={l.id} className="flex shrink-0 items-center gap-1 rounded-full bg-surface-2 py-1 pl-2.5 pr-1 text-[12px] font-semibold">
                {m?.model} {l.year}
                <button onClick={() => toggleCompare(l.id)} aria-label="Çıxar" className="grid h-5 w-5 place-items-center rounded-full hover:bg-line">
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
        <button onClick={clearCompare} className="shrink-0 px-1 text-[12px] text-muted hover:text-text max-sm:hidden">
          Təmizlə
        </button>
        <Link
          href="/muqayise"
          aria-disabled={cars.length < 2}
          className={`shrink-0 rounded-2xl px-4 py-2.5 text-[13px] font-semibold ${cars.length < 2 ? "pointer-events-none bg-surface-2 text-muted" : "bg-accent text-accent-ink"}`}
        >
          Müqayisə{cars.length < 2 ? ` (${cars.length}/2)` : ""}
        </Link>
      </div>
    </div>
  );
}
