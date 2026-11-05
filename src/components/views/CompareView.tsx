"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, Plus, ShieldCheck, X } from "lucide-react";
import { generationInfo, getModel } from "@/lib/data/models";
import { km, num } from "@/lib/format";
import { marketEstimate } from "@/lib/pricing";
import { BODIES } from "@/lib/search";
import { useHydrated, useStore } from "@/lib/store";
import type { Listing } from "@/lib/types";
import { ListingPhoto, Price } from "../CarCard";
import { monthlyPayment } from "../market/OverviewCard";

interface Row {
  label: string;
  value: (l: Listing) => ReactNode;
  /** Lower/higher is better → that column gets highlighted */
  score?: (l: Listing) => number;
  best?: "min" | "max";
}

export function CompareView() {
  const hydrated = useHydrated();
  const ids = useStore((s) => s.compare);
  const listings = useStore((s) => s.listings);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const loaded = useStore((s) => s.listingsLoaded);
  if (!hydrated || !loaded) return <div className="mx-4 mt-6 h-96 animate-pulse rounded-[22px] bg-surface" />;
  const cars = ids.map((id) => listings.find((l) => l.id === id)).filter((l): l is Listing => !!l);

  const info = new Map(
    cars.map((l) => {
      const est = marketEstimate(l.modelId, l.year, l.mileage, listings, l.id);
      const gen = generationInfo(l.modelId, l.year);
      return [l.id, { diff: (l.price - est.value) / est.value, gen, high: gen.problems.filter((p) => p.severity === "yüksək").length }];
    }),
  );
  const I = (l: Listing) => info.get(l.id)!;

  const rows: Row[] = [
    { label: "Qiymət", value: (l) => <Price value={l.price} />, score: (l) => l.price, best: "min" },
    {
      label: "Bazara nisbətən",
      value: (l) => {
        const d = I(l).diff;
        return <span className={d <= -0.03 ? "text-ok" : d >= 0.05 ? "text-bad" : ""}>{Math.abs(d) < 0.03 ? "Bazar qiyməti" : `${d < 0 ? "−" : "+"}${Math.round(Math.abs(d) * 100)}%`}</span>;
      },
      score: (l) => I(l).diff,
      best: "min",
    },
    { label: "Kredit, ayda", value: (l) => `${num(monthlyPayment(l.price))} ₼`, score: (l) => l.price, best: "min" },
    { label: "Buraxılış ili", value: (l) => l.year, score: (l) => l.year, best: "max" },
    { label: "Nəsil", value: (l) => I(l).gen.name },
    { label: "Yürüş", value: (l) => km(l.mileage), score: (l) => l.mileage, best: "min" },
    { label: "Mühərrik", value: (l) => l.engine },
    { label: "Yanacaq", value: (l) => l.fuel },
    { label: "Sürətlər qutusu", value: (l) => l.gearbox },
    { label: "Kuzov", value: (l) => BODIES.find((b) => b.id === getModel(l.modelId)?.bodyType)?.label ?? "—" },
    { label: "Rəng", value: (l) => l.colorName },
    { label: "Şəhər", value: (l) => l.city },
    {
      label: "Xroniki problemlər",
      value: (l) => (
        <span>
          {I(l).gen.problems.length}
          {I(l).high > 0 && <span className="text-bad"> · {I(l).high} ciddi</span>}
        </span>
      ),
      score: (l) => I(l).high * 10 + I(l).gen.problems.length,
      best: "min",
    },
    {
      label: "Servis tarixçəsi",
      value: (l) =>
        l.garageCarId ? (
          <span className="flex items-center gap-1 text-ok">
            <ShieldCheck size={14} /> Var
          </span>
        ) : (
          <span className="text-muted">Yoxdur</span>
        ),
    },
  ];

  const bestOf = (r: Row) => {
    if (!r.score || cars.length < 2) return null;
    const vals = cars.map(r.score);
    const target = r.best === "min" ? Math.min(...vals) : Math.max(...vals);
    if (vals.every((v) => v === target)) return null;
    return new Set(cars.filter((_, i) => vals[i] === target).map((l) => l.id));
  };

  const ncols = Math.max(cars.length, 1) + (cars.length < 3 ? 1 : 0);
  const cols = `112px repeat(${ncols}, minmax(0, 1fr))`;

  return (
    <div className="px-4 pb-10 pt-2 lg:px-0 lg:pt-6">
      <div className="flex items-center gap-2">
        <Link href="/elanlar" className="-ml-2 grid h-10 w-10 place-items-center" aria-label="Geri">
          <ChevronLeft size={24} strokeWidth={1.8} />
        </Link>
        <h1 className="headline-star font-display text-[26px] font-semibold tracking-tight sm:text-[34px]">Müqayisə</h1>
      </div>

      {!cars.length ? (
        <div className="mt-6 rounded-[22px] bg-surface p-8 text-center text-sm text-muted">
          Elan kartındakı ⇄ işarəsinə toxunaraq 3 maşına qədər seç.
          <Link href="/elanlar" className="btn btn-dark mx-auto mt-4 flex w-fit">
            Elanlara bax
          </Link>
        </div>
      ) : (
        <div className="no-scrollbar -mx-4 mt-5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <div className="grid gap-x-3 rounded-[22px] bg-surface p-3" style={{ gridTemplateColumns: cols, minWidth: 112 + ncols * 170 }}>
            {/* header: photos */}
            <div className="sticky left-0 z-10 bg-surface" />
            {cars.map((l) => {
              const m = getModel(l.modelId);
              return (
                <div key={l.id} className="pb-3">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
                    <ListingPhoto listing={l} />
                    <button onClick={() => toggleCompare(l.id)} aria-label="Müqayisədən çıxar" className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow">
                      <X size={14} />
                    </button>
                  </div>
                  <Link href={`/elan/${l.id}`} className="mt-2 block truncate font-display text-[14px] font-semibold hover:underline">
                    {m?.make} {m?.model}
                  </Link>
                </div>
              );
            })}
            {cars.length < 3 && (
              <Link href="/elanlar" className="mb-3 grid aspect-[16/10] place-items-center rounded-2xl border-2 border-dashed border-line text-[12px] font-semibold text-muted hover:border-text hover:text-text">
                <span className="flex flex-col items-center gap-1">
                  <Plus size={20} /> Maşın əlavə et
                </span>
              </Link>
            )}

            {rows.map((r) => {
              const best = bestOf(r);
              return (
                <div key={r.label} className="contents">
                  <div className="sticky left-0 z-10 flex items-center border-t border-line bg-surface py-3 pr-2 text-[12px] text-muted">{r.label}</div>
                  {cars.map((l) => (
                    <div key={l.id} className="flex items-center border-t border-line py-3 text-[14px] font-semibold">
                      <span className={best?.has(l.id) ? "rounded-lg bg-accent/25 px-2 py-0.5" : ""}>{r.value(l)}</span>
                    </div>
                  ))}
                  {cars.length < 3 && <div className="border-t border-line" />}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted">
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-accent/40 align-middle" /> ən yaxşı göstərici. Bazar qiyməti və kredit təxminidir.
          </p>
        </div>
      )}
    </div>
  );
}
