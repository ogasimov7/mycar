"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight, Hand, Plus, RotateCcw, Tag } from "lucide-react";
import { generationInfo, getModel } from "@/lib/data/models";
import { get3D } from "@/lib/data/models3d";
import { azn, km } from "@/lib/format";
import { healthScore, maintenanceState } from "@/lib/maintenance";
import { saleAdvice } from "@/lib/pricing";
import { useHydrated, useStore } from "@/lib/store";
import type { CarouselCar } from "../garage/GarageCarousel3D";

const GarageCarousel3D = dynamic(() => import("../garage/GarageCarousel3D"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-xs font-semibold uppercase tracking-[0.3em] text-muted">Qaraj yüklənir…</div>,
});

export function GarageListView() {
  const hydrated = useHydrated();
  const garage = useStore((s) => s.garage);
  const reset = useStore((s) => s.reset);
  const [index, setIndex] = useState(0);
  const drag = useRef<{ x: number; y: number } | null>(null);

  if (!hydrated) return <div className="mx-4 mt-4 h-[62dvh] animate-pulse rounded-3xl bg-surface" />;

  const total = garage.length + 1; // + empty bay
  const i = Math.min(index, total - 1);
  const go = (d: number) => setIndex(Math.max(0, Math.min(total - 1, i + d)));
  const car = garage[i];

  const cars: CarouselCar[] = garage.map((c) => ({
    id: c.id,
    color: c.color,
    body: getModel(c.modelId)?.bodyType ?? "sedan",
    model: get3D(c.modelId, c.year),
  }));

  return (
    <div className="px-4 pt-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-2">Virtual qaraj</div>
          <h1 className="font-display text-2xl font-bold">Maşınlarım</h1>
        </div>
        <Link href="/qaraj/elave-et" className="btn btn-ghost !py-2 !text-sm">
          <Plus size={16} /> Əlavə et
        </Link>
      </div>

      {/* ── 3D garage carousel ── */}
      <div
        className="relative mt-4 h-[62dvh] min-h-[380px] touch-pan-y select-none overflow-hidden rounded-3xl border border-line bg-[#eef0f2] shadow-[var(--shadow-md)] outline-none lg:h-[560px]"
        onPointerDown={(e) => (drag.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - d.y)) go(dx < 0 ? 1 : -1);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        tabIndex={0}
        aria-label="Qaraj — maşınlar arasında sürüşdürün"
      >
        <GarageCarousel3D cars={cars} index={i} />

        {/* top overlay: car identity */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-white/85 via-white/40 to-transparent p-4 pb-10">
          {car ? (
            <CarTitle carId={car.id} />
          ) : (
            <div>
              <div className="font-display text-xl font-bold">Boş park yeri</div>
              <div className="text-xs text-muted">Yeni maşın üçün yer hazırdır</div>
            </div>
          )}
          {car && (
            <div className="shrink-0 rounded-full bg-white shadow-md">
              <HealthRing value={healthScore(car)} size={48} />
            </div>
          )}
        </div>

        {/* arrows */}
        <button
          onClick={() => go(-1)}
          disabled={i === 0}
          aria-label="Əvvəlki maşın"
          className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md transition disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => go(1)}
          disabled={i === total - 1}
          aria-label="Növbəti maşın"
          className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md transition disabled:pointer-events-none disabled:opacity-0"
        >
          <ChevronRight size={22} />
        </button>

        {/* bottom overlay: dots + CTA */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/90 via-white/60 to-transparent p-4 pt-12">
          <div className="mb-3 flex items-center justify-center gap-1.5">
            {Array.from({ length: total }).map((_, k) => (
              <button
                key={k}
                onClick={() => setIndex(k)}
                aria-label={k < garage.length ? `Maşın ${k + 1}` : "Boş park yeri"}
                className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-accent" : "w-2 bg-black/20"}`}
              />
            ))}
          </div>
          {car ? (
            <Link href={`/qaraj/${car.id}`} className="btn btn-primary w-full">
              Qaraja gir <ArrowRight size={18} />
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link href="/elanlar" className="btn btn-ghost">
                Elanlara bax
              </Link>
              <Link href="/qaraj/elave-et" className="btn btn-primary">
                <Plus size={18} /> Maşın əlavə et
              </Link>
            </div>
          )}
          {garage.length > 0 && i === 0 && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <Hand size={12} /> Sağa-sola sürüşdürərək digər maşınlara bax
            </div>
          )}
        </div>
      </div>

      {/* ── details of the car in focus ── */}
      {car && <CarSummary carId={car.id} />}

      <button onClick={reset} className="mx-auto mt-8 flex items-center gap-1.5 text-xs text-muted">
        <RotateCcw size={12} /> Demo məlumatları bərpa et
      </button>
    </div>
  );
}

function CarTitle({ carId }: { carId: string }) {
  const car = useStore((s) => s.garage.find((c) => c.id === carId))!;
  const m = getModel(car.modelId)!;
  return (
    <div className="min-w-0">
      <div className="truncate font-display text-xl font-bold leading-tight">
        {m.make} <span className="text-accent">{m.model}</span>
      </div>
      <div className="truncate text-xs text-muted">
        {car.year} · {generationInfo(car.modelId, car.year).name} · {km(car.mileage)}
        {car.plate ? ` · ${car.plate}` : ""}
      </div>
      {car.listingId && (
        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-ink">
          <Tag size={10} /> Satışda
        </span>
      )}
    </div>
  );
}

function CarSummary({ carId }: { carId: string }) {
  const car = useStore((s) => s.garage.find((c) => c.id === carId))!;
  const listings = useStore((s) => s.listings);
  const advice = saleAdvice(car, listings);
  const urgent = maintenanceState(car).filter((s) => s.status === "overdue" || s.status === "soon");
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 [&>*]:min-w-0">
      <div className="card p-4">
        <div className="text-xs text-muted">Məsləhət görülən satış qiyməti</div>
        <div className="font-display text-2xl font-bold">{azn(advice.suggested)}</div>
        <div className="text-[11px] text-muted">Bazar: {azn(advice.market)}</div>
      </div>
      <div className="card p-4">
        <div className="text-xs text-muted">Təmir və servis xərcləri</div>
        <div className="font-display text-2xl font-bold">{azn(advice.repairsTotal)}</div>
        <div className="text-[11px] text-muted">{car.repairs.length} qeyd</div>
      </div>
      <Link href={`/qaraj/${car.id}`} className={`card card-hover p-4 ${urgent.length ? "!border-warn/40 !bg-orange-50/70" : ""}`}>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <AlertCircle size={14} className={urgent.length ? "text-warn" : "text-ok"} /> Baxış
        </div>
        {urgent.length ? (
          <>
            <div className="font-display text-2xl font-bold text-warn">{urgent.length} diqqət</div>
            <div className="truncate text-[11px] text-muted">{urgent.map((u) => u.item.name).join(", ")}</div>
          </>
        ) : (
          <>
            <div className="font-display text-2xl font-bold text-ok">Qaydasında</div>
            <div className="text-[11px] text-muted">Bütün baxışlar vaxtındadır</div>
          </>
        )}
      </Link>
    </div>
  );
}

export function HealthRing({ value, size = 52 }: { value: number; size?: number }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const color = value >= 80 ? "var(--ok)" : value >= 55 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} aria-label={`Baxış balı ${value}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth="4" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span className="absolute font-display text-sm font-bold">{value}</span>
    </div>
  );
}
