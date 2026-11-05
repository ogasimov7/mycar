"use client";

import { useState } from "react";
import { Check, Plus, Wrench } from "lucide-react";
import { generationInfo, getModel } from "@/lib/data/models";
import { BODY_PRESETS, PART_PRESETS, partName, PARTS } from "@/lib/data/parts";
import { azn, date, todayISO } from "@/lib/format";
import { MAINTENANCE_ITEMS } from "@/lib/maintenance";
import { useStore } from "@/lib/store";
import type { GarageCar, PartId, Repair } from "@/lib/types";
import { ProblemCard } from "../ProblemList";
import { ReceiptScan } from "./ReceiptScan";
import { Sheet } from "../Sheet";

const KINDS: Repair["kind"][] = ["təmir", "dəyişmə", "servis"];

export function PartSheet({ car, part, onClose }: { car: GarageCar; part: PartId | null; onClose: () => void }) {
  const addRepair = useStore((s) => s.addRepair);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Repair["kind"]>("təmir");
  const [dt, setDt] = useState(todayISO);
  const [kmV, setKmV] = useState(String(car.mileage));
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [maint, setMaint] = useState<string[]>([]);


  if (!part) return null;
  const info = PARTS.find((p) => p.id === part)!;
  const m = getModel(car.modelId)!;
  const repairs = car.repairs.filter((r) => r.partId === part);
  const gen = generationInfo(car.modelId, car.year);
  const problems = gen.problems.filter((p) => p.part === part);
  const presets = PART_PRESETS[part] ?? BODY_PRESETS;
  const maintItems = MAINTENANCE_ITEMS.filter((i) => i.part === part);
  const total = repairs.reduce((a, r) => a + r.cost, 0);

  const save = () => {
    if (!title.trim()) return;
    addRepair(
      car.id,
      { partId: part, title: title.trim(), kind, date: dt, km: +kmV || car.mileage, cost: +cost || 0, note: note || undefined },
      maint,
    );
    setAdding(false);
    setTitle("");
    setCost("");
    setNote("");
    setMaint([]);
  };

  return (
    <Sheet
      open={!!part}
      onClose={onClose}
      title={
        <span>
          {info.name}
          <span className="ml-2 align-middle text-xs font-semibold text-muted">{info.group}</span>
        </span>
      }
      footer={
        adding ? (
          <div className="flex gap-2">
            <button className="btn btn-ghost flex-1" onClick={() => setAdding(false)}>Ləğv et</button>
            <button className="btn btn-primary flex-[2]" onClick={save} disabled={!title.trim()}>
              <Check size={18} /> Yadda saxla
            </button>
          </div>
        ) : (
          <button className="btn btn-primary w-full" onClick={() => setAdding(true)}>
            <Plus size={18} /> Təmir / dəyişmə qeyd et
          </button>
        )
      }
    >
      {adding ? (
        <div className="space-y-4">
          <div>
            <span className="label">Nə edildi?</span>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button key={p} type="button" className="chip" data-active={title === p} onClick={() => setTitle(p)}>
                  {p}
                </button>
              ))}
            </div>
            <input className="input mt-2" placeholder="və ya özün yaz…" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <span className="label">Növ</span>
            <div className="grid grid-cols-3 gap-2">
              {KINDS.map((k) => (
                <button key={k} type="button" className="chip justify-center" data-active={kind === k} onClick={() => setKind(k)}>
                  {k}
                </button>
              ))}
            </div>
          </div>
          <ReceiptScan
            onResult={(r) => {
              if (r.total !== undefined) setCost(String(Math.round(r.total)));
              if (r.date) setDt(r.date);
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="rdate">Tarix</label>
              <input id="rdate" type="date" className="input" value={dt} onChange={(e) => setDt(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="rkm">Yürüş, km</label>
              <input id="rkm" className="input" inputMode="numeric" value={kmV} onChange={(e) => setKmV(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="rcost">Xərc, ₼ (detal + usta)</label>
              <input id="rcost" className="input" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value.replace(/\D/g, ""))} placeholder="0" />
            </div>
          </div>
          {maintItems.length > 0 && (
            <div>
              <span className="label">Baxış cədvəlini də yenilə</span>
              <div className="space-y-2">
                {maintItems.map((i) => (
                  <label key={i.id} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-[var(--accent)]"
                      checked={maint.includes(i.id)}
                      onChange={(e) => setMaint(e.target.checked ? [...maint, i.id] : maint.filter((x) => x !== i.id))}
                    />
                    {i.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="label" htmlFor="rnote">Qeyd</label>
            <textarea id="rnote" rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Usta, detal markası, zəmanət…" />
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="text-[11px] text-muted">Qeydlər</div>
              <div className="font-display text-lg font-bold">{repairs.length}</div>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="text-[11px] text-muted">Xərc</div>
              <div className="font-display text-lg font-bold">{azn(total)}</div>
            </div>
          </div>

          <div className="label mt-5">Tarixçə</div>
          {repairs.length ? (
            <ul className="space-y-2">
              {repairs.map((r) => (
                <li key={r.id} className="flex items-start gap-3 rounded-xl border border-line p-3">
                  <Wrench size={16} className="mt-0.5 shrink-0 text-accent" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{r.title}</div>
                    <div className="text-xs text-muted">
                      {date(r.date)} · {r.km.toLocaleString("az-AZ")} km · {r.kind}
                    </div>
                    {r.note && <div className="mt-1 text-xs text-muted">{r.note}</div>}
                  </div>
                  <div className="text-sm font-bold">{azn(r.cost)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">{partName(part)} üçün hələ qeyd yoxdur.</p>
          )}

          {problems.length > 0 && (
            <>
              <div className="label mt-5">{m.model} {gen.name} üçün tipik problemlər</div>
              <div className="space-y-3">
                {problems.map((p) => (
                  <ProblemCard key={p.title} p={p} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
