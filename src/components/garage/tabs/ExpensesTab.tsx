"use client";

import { useState } from "react";
import { Fuel, Plus, Trash2 } from "lucide-react";
import { azn, date, km, num, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { FuelEntry, GarageCar } from "@/lib/types";
import { Sheet } from "../../Sheet";
import { ReceiptScan } from "../ReceiptScan";

/* validated categorical pair (dataviz validator, light surface #f8f7f5) */
const C_FUEL = "#2a78d6";
const C_SERVICE = "#eb6834";
const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];

/** L/100 km between consecutive full fills, and the overall average */
export function consumption(log: FuelEntry[] = []) {
  const asc = [...log].sort((a, b) => a.km - b.km);
  const firstFull = asc.findIndex((f) => f.full);
  if (firstFull < 0) return { avg: null as number | null, last: null as number | null };
  let liters = 0;
  let lastFullKm = asc[firstFull].km;
  let totalLiters = 0;
  let totalKm = 0;
  let last: number | null = null;
  for (const f of asc.slice(firstFull + 1)) {
    liters += f.liters;
    if (!f.full) continue;
    const dist = f.km - lastFullKm;
    if (dist > 0) {
      last = (liters / dist) * 100;
      totalLiters += liters;
      totalKm += dist;
    }
    liters = 0;
    lastFullKm = f.km;
  }
  return { avg: totalKm ? (totalLiters / totalKm) * 100 : null, last };
}

function monthly(car: GarageCar, now = new Date()) {
  const out = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: MONTHS[d.getMonth()], year: d.getFullYear(), fuel: 0, service: 0 };
  });
  const idx = new Map(out.map((m, i) => [m.key, i]));
  for (const f of car.fuelLog ?? []) {
    const i = idx.get(f.date.slice(0, 7));
    if (i !== undefined) out[i].fuel += f.cost;
  }
  for (const r of car.repairs) {
    const i = idx.get(r.date.slice(0, 7));
    if (i !== undefined) out[i].service += r.cost;
  }
  return out;
}

export function ExpensesTab({ car }: { car: GarageCar }) {
  const { addFuel, removeFuel } = useStore.getState();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [form, setForm] = useState({ date: todayISO(), km: "", liters: "", cost: "", full: true });
  const set = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const log = car.fuelLog ?? [];
  const months = monthly(car);
  const max = Math.max(1, ...months.map((m) => m.fuel + m.service));
  const scale = niceMax(max);
  const year = months.reduce((a, m) => a + m.fuel + m.service, 0);
  const thisMonth = months[11].fuel + months[11].service;
  const { avg, last } = consumption(log);
  const fuelTotal = log.reduce((a, f) => a + f.cost, 0);
  const repairTotal = car.repairs.reduce((a, r) => a + r.cost, 0);
  const driven = car.mileage - car.purchaseMileage;
  const perKm = driven > 0 ? (fuelTotal + repairTotal) / driven : null;
  const h = hover ?? 11;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Tile label="Bu ay" value={azn(thisMonth)} />
        <Tile label="Son 12 ay" value={azn(year)} />
        <Tile label="Orta sərf" value={avg ? `${avg.toFixed(1)} L/100` : "—"} sub={last ? `son dolum: ${last.toFixed(1)}` : "2 tam dolum lazımdır"} />
        <Tile label="1 km-in qiyməti" value={perKm ? `${perKm.toFixed(2)} ₼` : "—"} sub="yanacaq + servis" />
      </div>

      {/* monthly stacked bars */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[13px] font-semibold">Aylıq xərclər</div>
            <div className="text-[11px] text-muted">
              {months[h].label} {months[h].year}: <b className="text-text">{azn(months[h].fuel + months[h].service)}</b>
            </div>
          </div>
          <div className="flex gap-3 text-[11px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: C_FUEL }} /> Yanacaq
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: C_SERVICE }} /> Servis və təmir
            </span>
          </div>
        </div>
        <div className="relative mt-4 h-40" onMouseLeave={() => setHover(null)}>
          {[0.5, 1].map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${t * 100}%` }}>
              <span className="absolute -top-2 right-0 bg-surface pl-1 text-[10px] text-muted">{num(scale * t)}</span>
            </div>
          ))}
          <div className="absolute inset-0 bottom-0 flex items-end gap-1 border-b border-line pr-9">
            {months.map((m, i) => {
              const fh = (m.fuel / scale) * 100;
              const sh = (m.service / scale) * 100;
              return (
                <button
                  key={m.key}
                  type="button"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onClick={() => setHover(i)}
                  aria-label={`${m.label} ${m.year}: yanacaq ${azn(m.fuel)}, servis ${azn(m.service)}`}
                  className={`relative flex h-full flex-1 flex-col justify-end rounded-t outline-none ${hover === i ? "bg-surface-2" : ""}`}
                >
                  {m.service > 0 && <span className="mx-auto block w-full max-w-[18px] rounded-t-[4px]" style={{ height: `${sh}%`, background: C_SERVICE, marginBottom: m.fuel > 0 ? 2 : 0 }} />}
                  {m.fuel > 0 && <span className={`mx-auto block w-full max-w-[18px] ${m.service > 0 ? "" : "rounded-t-[4px]"}`} style={{ height: `${fh}%`, background: C_FUEL }} />}
                </button>
              );
            })}
          </div>
          {hover !== null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-xl bg-dark px-3 py-2 text-[11px] text-white shadow-lg"
              style={{ left: `calc(${((hover + 0.5) / 12) * 100}% - ${((hover + 0.5) / 12) * 36}px)` }}
            >
              <div className="font-semibold">
                {months[hover].label} {months[hover].year}
              </div>
              <div>Yanacaq: {azn(months[hover].fuel)}</div>
              <div>Servis: {azn(months[hover].service)}</div>
            </div>
          )}
        </div>
        <div className="mt-1 flex gap-1 pr-9 text-center text-[10px] text-muted">
          {months.map((m, i) => (
            <span key={m.key} className={`flex-1 ${i === h ? "font-semibold text-text" : ""}`}>
              {m.label.slice(0, 1)}
              <span className="max-sm:hidden">{m.label.slice(1)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold">Yanacaq jurnalı</div>
          <div className="text-[11px] text-muted">
            {log.length} dolum · {azn(fuelTotal)}
          </div>
        </div>
        <button
          className="btn btn-primary !py-2.5 !text-sm"
          onClick={() => {
            setForm({ date: todayISO(), km: String(car.mileage), liters: "", cost: "", full: true });
            setOpen(true);
          }}
        >
          <Plus size={16} /> Dolum
        </button>
      </div>

      {!log.length && <div className="card p-6 text-center text-sm text-muted">Hər dolumda litr və yürüşü yaz — orta sərfi hesablayacağıq.</div>}
      <ul className="space-y-2">
        {log.slice(0, 20).map((f) => (
          <li key={f.id} className="card flex items-center gap-3 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2">
              <Fuel size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">
                {f.liters.toLocaleString("az-AZ")} L {!f.full && <span className="text-[11px] font-normal text-muted">· yarımçıq</span>}
              </div>
              <div className="text-[11px] text-muted">
                {date(f.date)} · {km(f.km)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">{azn(f.cost)}</div>
              <div className="text-[10px] text-muted">{f.liters ? (f.cost / f.liters).toFixed(2) : "—"} ₼/L</div>
            </div>
            <button onClick={() => removeFuel(car.id, f.id)} aria-label="Sil" className="p-1 text-muted">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Yanacaq dolumu"
        footer={
          <button
            className="btn btn-primary w-full"
            disabled={!+form.liters || !+form.km}
            onClick={() => {
              addFuel(car.id, { date: form.date, km: +form.km, liters: +form.liters.replace(",", "."), cost: +form.cost.replace(",", ".") || 0, full: form.full });
              setOpen(false);
            }}
          >
            Yadda saxla
          </button>
        }
      >
        <div className="space-y-4">
          <ReceiptScan
            onResult={(r) =>
              set({
                ...(r.total !== undefined ? { cost: String(r.total) } : {}),
                ...(r.liters ? { liters: String(r.liters) } : {}),
                ...(r.date ? { date: r.date } : {}),
              })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="fl">Litr</label>
              <input id="fl" className="input" inputMode="decimal" value={form.liters} onChange={(e) => set({ liters: e.target.value.replace(/[^\d.,]/g, "") })} placeholder="45" autoFocus />
            </div>
            <div>
              <label className="label" htmlFor="fc">Məbləğ, ₼</label>
              <input id="fc" className="input" inputMode="decimal" value={form.cost} onChange={(e) => set({ cost: e.target.value.replace(/[^\d.,]/g, "") })} placeholder="50" />
            </div>
            <div>
              <label className="label" htmlFor="fk">Yürüş, km</label>
              <input id="fk" className="input" inputMode="numeric" value={form.km} onChange={(e) => set({ km: e.target.value.replace(/\D/g, "") })} />
            </div>
            <div>
              <label className="label" htmlFor="fd">Tarix</label>
              <input id="fd" type="date" className="input" value={form.date} onChange={(e) => set({ date: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
            <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={form.full} onChange={(e) => set({ full: e.target.checked })} />
            Tam bak doldurdum <span className="text-[11px] text-muted">(sərfi dəqiq hesablamaq üçün)</span>
          </label>
        </div>
      </Sheet>
    </div>
  );
}

function niceMax(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((x) => x >= v) ?? v;
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-3.5">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-0.5 font-display text-[17px] font-semibold">{value}</div>
      {sub && <div className="mt-0.5 truncate text-[10px] text-muted">{sub}</div>}
    </div>
  );
}
