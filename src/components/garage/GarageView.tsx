"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowLeft, Box, Layers, List, Pause, Play, ScanLine, Shapes } from "lucide-react";
import { generationInfo, getModel } from "@/lib/data/models";
import { GENERIC_3D, get3D } from "@/lib/data/models3d";
import { partName, PARTS } from "@/lib/data/parts";
import { km } from "@/lib/format";
import { healthScore } from "@/lib/maintenance";
import { useHydrated, useStore } from "@/lib/store";
import type { PartId } from "@/lib/types";
import { Sheet } from "../Sheet";
import { HealthRing } from "../views/GarageListView";
import { PartSheet } from "./PartSheet";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { ExpensesTab } from "./tabs/ExpensesTab";
import { MaintenanceTab } from "./tabs/MaintenanceTab";
import { ProblemsTab } from "./tabs/ProblemsTab";
import { RepairsTab } from "./tabs/RepairsTab";
import { SellTab } from "./tabs/SellTab";
import { ValueTab } from "./tabs/ValueTab";

const Garage3D = dynamic(() => import("./Garage3D"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-[#eef0f2] text-xs font-semibold uppercase tracking-[0.3em] text-muted">
      Qaraj yüklənir…
    </div>
  ),
});

const TABS = [
  { id: "maint", label: "Baxış" },
  { id: "repairs", label: "Təmirlər" },
  { id: "costs", label: "Xərclər" },
  { id: "docs", label: "Sənədlər" },
  { id: "value", label: "Dəyər" },
  { id: "problems", label: "Problemlər" },
  { id: "sell", label: "Sat" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function GarageView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const car = useStore((s) => s.garage.find((c) => c.id === id));
  // ?tab=docs etc. — reminders link straight to the right panel
  const [tab, setTab] = useState<Tab>(() => {
    const t = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("tab");
    return TABS.some((x) => x.id === t) ? (t as Tab) : "maint";
  });
  const [selected, setSelected] = useState<PartId | null>(null);
  const [hovered, setHovered] = useState<PartId | null>(null);
  const [xray, setXray] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [partsOpen, setPartsOpen] = useState(false);
  const [sheetPart, setSheetPart] = useState<PartId | null>(null);
  const [real, setReal] = useState(true);
  const [modelFailed, setModelFailed] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const onSelect = useCallback((p: PartId | null) => {
    setSelected(p);
    if (p) {
      setAutoRotate(false);
      // let the camera glide first, then open the sheet
      window.setTimeout(() => setSheetPart(p), 350);
    }
  }, []);
  const onInteract = useCallback(() => setAutoRotate(false), []);

  const marked = useMemo(() => Array.from(new Set(car?.repairs.map((r) => r.partId) ?? [])), [car?.repairs]);

  if (!hydrated) return <div className="h-dvh bg-[#eef0f2]" />;
  if (!car)
    return (
      <div className="p-8 text-center">
        <p className="text-muted">Maşın qarajda tapılmadı.</p>
        <Link href="/qaraj" className="btn btn-primary mt-4">Qaraja qayıt</Link>
      </div>
    );

  const m = getModel(car.modelId)!;
  const model3d = get3D(car.modelId, car.year);
  const showReal = real && !modelFailed;
  const focusPart = (p: PartId) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const needsXray = PARTS.find((x) => x.id === p)?.internal ?? false;
    setXray(needsXray);
    onSelect(p);
  };

  return (
    <div className="immersive min-h-dvh bg-bg lg:grid lg:h-dvh lg:grid-cols-[1.4fr_1fr] lg:overflow-hidden">
      {/* ---------- 3D stage ---------- */}
      <div className="relative h-[58dvh] min-h-[360px] bg-[#eef0f2] lg:h-full">
        <Garage3D
          color={car.color}
          body={m.bodyType}
          xray={xray}
          selected={selected}
          hovered={hovered}
          setHovered={setHovered}
          onSelect={onSelect}
          marked={marked}
          autoRotate={autoRotate && !selected}
          onInteract={onInteract}
          model={showReal ? model3d : null}
          onModelError={() => setModelFailed(true)}
        />

        {/* top HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start gap-3 bg-gradient-to-b from-white/85 via-white/40 to-transparent p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <Link href="/qaraj" className="pointer-events-auto grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-md" aria-label="Qaraja qayıt">
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-xl font-bold uppercase leading-tight tracking-wide">
              {m.make} <span className="text-accent-2">{m.model}</span>
            </div>
            <div className="truncate text-xs text-muted">
              {car.year} · {generationInfo(car.modelId, car.year).name} · {km(car.mileage)}
              {car.plate ? ` · ${car.plate}` : ""}
            </div>
          </div>
          <div className="pointer-events-auto rounded-full bg-white shadow-md">
            <HealthRing value={healthScore(car)} size={48} />
          </div>
        </div>

        {/* hovered label (desktop) */}
        {hovered && (
          <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-bold text-accent-2 shadow-md">
            {partName(hovered)}
          </div>
        )}

        {/* bottom HUD */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t [&>div:first-child]:min-w-0 [&>div:first-child]:flex-1 from-white/90 via-white/50 to-transparent p-4 pt-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {xray ? "Daxili hissəyə toxun" : "Detala toxun"}
            <span className="mt-1 flex items-center gap-1.5 normal-case tracking-normal text-muted">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" /> təmir olunub
            </span>
            {showReal && (
              <a
                href={model3d.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate normal-case tracking-normal text-[10px] text-muted/80 underline-offset-2 hover:underline"
              >
                {model3d === GENERIC_3D
                  ? "Ümumi 3D model (bu maşının öz faylı hələ yoxdur) · "
                  : `3D${model3d.generation ? ` ${model3d.generation}` : ""}: `}
                {model3d.title} · {model3d.author} · {model3d.license}
              </a>
            )}
            {modelFailed && <span className="mt-1 block normal-case tracking-normal text-[10px] text-warn">Real model yüklənmədi — sxem göstərilir</span>}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <HudBtn onClick={() => setReal((r) => !r)} label={showReal ? "Sxem görünüşü" : "Real model"}>
              {showReal ? <Shapes size={18} /> : <Box size={18} />}
            </HudBtn>
            <HudBtn active={xray} onClick={() => setXray((x) => !x)} label="Daxili görünüş">
              <ScanLine size={18} />
            </HudBtn>
            <HudBtn onClick={() => setPartsOpen(true)} label="Hissələr siyahısı">
              <List size={18} />
            </HudBtn>
            <HudBtn onClick={() => setAutoRotate((a) => !a)} label={autoRotate ? "Fırlanmanı dayandır" : "Fırlat"}>
              {autoRotate ? <Pause size={18} /> : <Play size={18} />}
            </HudBtn>
          </div>
        </div>
      </div>

      {/* ---------- panels ---------- */}
      <div className="relative z-10 -mt-3 rounded-t-3xl border-t border-line bg-bg shadow-[0_-8px_24px_-12px_rgb(16_24_40/0.15)] lg:mt-0 lg:overflow-y-auto lg:rounded-none lg:border-l lg:border-t-0">
        <div ref={tabsRef} className="sticky top-0 z-20 rounded-t-3xl bg-bg/95 px-4 pb-2 pt-3 backdrop-blur-xl lg:rounded-none">
          <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl bg-surface p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 whitespace-nowrap rounded-xl px-2.5 py-2 text-[13px] font-bold transition ${
                  tab === t.id ? "bg-surface-2 text-text shadow" : "text-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-2">
          {tab === "maint" && <MaintenanceTab car={car} />}
          {tab === "repairs" && <RepairsTab car={car} onAdd={() => setPartsOpen(true)} onFocus={focusPart} />}
          {tab === "costs" && <ExpensesTab car={car} />}
          {tab === "docs" && <DocumentsTab car={car} />}
          {tab === "value" && <ValueTab car={car} />}
          {tab === "problems" && <ProblemsTab car={car} onFocus={focusPart} />}
          {tab === "sell" && <SellTab car={car} />}
        </div>
      </div>

      <Sheet open={partsOpen} onClose={() => setPartsOpen(false)} title={<span className="flex items-center gap-2"><Layers size={18} /> Hissə seç</span>}>
        {(["Mexanika", "Kuzov", "İşıq və şüşə"] as const).map((g) => (
          <div key={g} className="mb-4">
            <div className="label">{g}</div>
            <div className="grid grid-cols-2 gap-2">
              {PARTS.filter((p) => p.group === g).map((p) => {
                const n = car.repairs.filter((r) => r.partId === p.id).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPartsOpen(false);
                      focusPart(p.id);
                    }}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-left text-sm font-semibold"
                  >
                    {p.name}
                    {n > 0 && <span className="rounded-full bg-accent/20 px-1.5 text-[11px] text-accent">{n}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Sheet>

      <PartSheet
        key={sheetPart ?? "none"}
        car={car}
        part={sheetPart}
        onClose={() => {
          setSheetPart(null);
          setSelected(null);
        }}
      />
    </div>
  );
}

function HudBtn({ children, onClick, active, label }: { children: React.ReactNode; onClick: () => void; active?: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-2xl border backdrop-blur transition sm:h-11 sm:w-11 ${
        active ? "border-accent-2 bg-accent-2 text-white shadow-md" : "border-line bg-white text-text shadow-md"
      }`}
    >
      {children}
    </button>
  );
}
