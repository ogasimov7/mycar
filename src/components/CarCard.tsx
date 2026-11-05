"use client";

import Link from "next/link";
import { GitCompareArrows, Heart, Settings2, ShieldCheck, Star, TrendingDown, Zap } from "lucide-react";
import { getModel } from "@/lib/data/models";
import { num } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { CarVisual } from "./CarVisual";
import { PhotoSwitcher } from "./PhotoSwitcher";
import { toast } from "./Toast";

/** Listing photo(s); without photos the illustrated car is shown */
export function ListingPhoto({ listing, className = "" }: { listing: Listing; className?: string }) {
  if (listing.photos.length) return <PhotoSwitcher photos={listing.photos} className={`h-full w-full ${className}`} />;
  return (
    <div className={`grid h-full w-full place-items-center bg-surface-2 ${className}`}>
      <CarVisual modelId={listing.modelId} year={listing.year} color={listing.color} colorName={listing.colorName} className="w-[88%]" width={600} />
    </div>
  );
}

/** Price with the currency set lighter, like "$130/day" */
export function Price({ value, className = "", sign = "₼" }: { value: number; className?: string; sign?: string }) {
  return (
    <span className={`whitespace-nowrap ${className}`}>
      <b className="font-bold">{num(value)}</b>
      <span className="ml-0.5 text-[0.8em] font-normal text-muted">{sign}</span>
    </span>
  );
}

/** First → current price; negative = the seller lowered it */
export function priceDrop(l: Listing) {
  const h = l.priceHistory;
  if (!h || h.length < 2 || h[0].price <= l.price) return null;
  return { from: h[0].price, pct: (h[0].price - l.price) / h[0].price, times: h.length - 1 };
}

export function CompareButton({ id, className = "" }: { id: string; className?: string }) {
  const on = useStore((s) => s.compare.includes(id));
  const n = useStore((s) => s.compare.length);
  const toggle = useStore((s) => s.toggleCompare);
  return (
    <button
      aria-label={on ? "Müqayisədən çıxar" : "Müqayisəyə əlavə et"}
      aria-pressed={on}
      title={on ? "Müqayisədən çıxar" : "Müqayisəyə əlavə et"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!toggle(id)) toast("Ən çox 3 maşını müqayisə etmək olar");
        else if (!on && n === 0) toast("Müqayisəyə əlavə olundu — daha bir maşın seç");
      }}
      className={`grid shrink-0 place-items-center rounded-full transition ${on ? "bg-dark text-white" : "text-text hover:bg-surface-2"} ${className}`}
    >
      <GitCompareArrows size={18} strokeWidth={1.8} />
    </button>
  );
}

export function CarCard({ listing }: { listing: Listing }) {
  const m = getModel(listing.modelId);
  const fav = useStore((s) => s.favorites.includes(listing.id));
  const toggle = useStore((s) => s.toggleFavorite);
  const drop = priceDrop(listing);
  return (
    <Link
      href={`/elan/${listing.id}`}
      className="group block min-w-0 rounded-[22px] bg-surface px-[18px] pb-4 pt-4 transition hover:bg-white"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[15px] font-semibold leading-tight">
            {m?.make} {m?.model}
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[13px]">
            <Star size={15} className="fill-accent text-accent" />
            <b className="font-semibold">{listing.year}</b>
            <span className="text-muted">({num(listing.mileage)} km)</span>
          </div>
        </div>
        <CompareButton id={listing.id} className="-mt-0.5 h-8 w-8" />
        <button
          aria-label="Seçilmişlərə əlavə et"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(listing.id);
          }}
          className="-mr-1 -mt-0.5 grid h-8 w-8 shrink-0 place-items-center"
        >
          <Heart size={22} strokeWidth={1.7} className={fav ? "fill-bad text-bad" : "text-text"} />
        </button>
      </div>

      <div className="relative mt-3 aspect-[16/10] overflow-hidden rounded-2xl">
        <ListingPhoto listing={listing} />
        {listing.garageCarId && (
          <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold shadow">
            <ShieldCheck size={12} className="text-ok" /> Servis tarixçəsi
          </span>
        )}
        {listing.status === "sold" && (
          <span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/50 font-display text-sm font-semibold text-white">SATILIB</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-4 overflow-hidden whitespace-nowrap text-[13px] text-text/80">
          <span className="flex items-center gap-1.5">
            <Zap size={15} strokeWidth={1.7} /> {listing.engine}
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <Settings2 size={15} strokeWidth={1.7} className="shrink-0" /> <span className="truncate">{listing.gearbox}</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {drop && (
            <span className="flex items-center gap-0.5 rounded-full bg-ok/12 px-1.5 py-0.5 text-[11px] font-bold text-ok" title={`Əvvəl ${num(drop.from)} ₼ idi`}>
              <TrendingDown size={12} /> {Math.round(drop.pct * 100)}%
            </span>
          )}
          <Price value={listing.price} className="text-[17px]" />
        </div>
      </div>
    </Link>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-[22px] bg-surface p-4">
      <div className="h-4 w-36 animate-pulse rounded bg-surface-2" />
      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 aspect-[16/10] animate-pulse rounded-2xl bg-surface-2" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-surface-2" />
    </div>
  );
}
