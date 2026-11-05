"use client";

import { useState } from "react";
import { Box, Plus, Trash2 } from "lucide-react";
import { partName } from "@/lib/data/parts";
import { azn, date } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { GarageCar, PartId } from "@/lib/types";

export function RepairsTab({ car, onAdd, onFocus }: { car: GarageCar; onAdd: () => void; onFocus: (p: PartId) => void }) {
  const removeRepair = useStore((s) => s.removeRepair);
  const [filter, setFilter] = useState<PartId | null>(null);
  const parts = Array.from(new Set(car.repairs.map((r) => r.partId)));
  const list = filter ? car.repairs.filter((r) => r.partId === filter) : car.repairs;
  const total = list.reduce((a, r) => a + r.cost, 0);

  const byYear = list.reduce<Record<string, typeof list>>((acc, r) => {
    const y = r.date.slice(0, 4);
    (acc[y] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted">Cəmi xərc</div>
          <div className="font-display text-2xl font-bold">{azn(total)}</div>
        </div>
        <button className="btn btn-primary !py-2.5 !text-sm" onClick={onAdd}>
          <Plus size={16} /> Qeyd et
        </button>
      </div>

      {parts.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          <button className="chip" data-active={!filter} onClick={() => setFilter(null)}>Hamısı</button>
          {parts.map((p) => (
            <button key={p} className="chip" data-active={filter === p} onClick={() => setFilter(filter === p ? null : p)}>
              {partName(p)}
            </button>
          ))}
        </div>
      )}

      {!list.length && (
        <div className="card mt-4 p-6 text-center text-sm text-muted">
          Hələ qeyd yoxdur. 3D maşında detala toxun və ya “Qeyd et” düyməsini bas.
        </div>
      )}

      {Object.entries(byYear)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([year, items]) => (
          <div key={year} className="mt-5">
            <div className="label">{year}</div>
            <ol className="relative space-y-3 border-l border-line pl-4">
              {items.map((r) => (
                <li key={r.id} className="relative">
                  <span className={`absolute -left-[21px] top-4 h-2.5 w-2.5 rounded-full ${r.kind === "servis" ? "bg-accent-2" : "bg-accent"}`} />
                  <div className="card p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{r.title}</div>
                        <div className="text-xs text-muted">
                          {partName(r.partId)} · {date(r.date)} · {r.km.toLocaleString("az-AZ")} km
                        </div>
                        {r.note && <div className="mt-1 text-xs text-muted">{r.note}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{azn(r.cost)}</div>
                        <div className="text-[10px] uppercase text-muted">{r.kind}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => onFocus(r.partId)} className="flex items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 text-[11px] font-semibold text-accent-2">
                        <Box size={12} /> 3D-də göstər
                      </button>
                      <button
                        onClick={() => removeRepair(car.id, r.id)}
                        className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted"
                        aria-label="Qeydi sil"
                      >
                        <Trash2 size={12} /> Sil
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
    </div>
  );
}
