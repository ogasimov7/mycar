"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Gauge, HelpCircle } from "lucide-react";
import { azn, km, todayISO } from "@/lib/format";
import { maintenanceState, type MaintState } from "@/lib/maintenance";
import { mileageAgeDays, MILEAGE_STALE_DAYS } from "@/lib/reminders";
import { useStore } from "@/lib/store";
import type { GarageCar } from "@/lib/types";
import { Sheet } from "../../Sheet";

const STATUS = {
  overdue: { color: "var(--bad)", icon: AlertTriangle, text: "Gecikir" },
  soon: { color: "var(--warn)", icon: Clock, text: "Yaxınlaşır" },
  ok: { color: "var(--ok)", icon: CheckCircle2, text: "Qaydasında" },
  unknown: { color: "var(--muted)", icon: HelpCircle, text: "Məlum deyil" },
};

export function MaintenanceTab({ car }: { car: GarageCar }) {
  const { updateCar, markMaintenance, addRepair } = useStore.getState();
  const states = maintenanceState(car);
  const [mileOpen, setMileOpen] = useState(false);
  const [mileage, setMileage] = useState("");
  const [item, setItem] = useState<MaintState | null>(null);
  const [dt, setDt] = useState(todayISO());
  const [kmV, setKmV] = useState("");
  const [cost, setCost] = useState("");

  const staleDays = mileageAgeDays(car);
  const stale = staleDays >= MILEAGE_STALE_DAYS;
  const urgent = states.filter((s) => s.status === "overdue").length;
  const soon = states.filter((s) => s.status === "soon").length;

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setMileage(String(car.mileage));
          setMileOpen(true);
        }}
        className={`flex w-full items-center gap-3 p-4 text-left ${stale ? "rounded-[22px] bg-accent text-accent-ink" : "card"}`}
      >
        <Gauge className={stale ? "" : "text-accent-2"} />
        <div className="min-w-0 flex-1">
          <div className={`text-xs ${stale ? "text-accent-ink/70" : "text-muted"}`}>
            {stale ? `Yürüşü ${staleDays} gündür yeniləməmisən` : "Hazırkı yürüş"}
          </div>
          <div className="font-display text-xl font-bold">{km(car.mileage)}</div>
          {stale && <div className="text-[11px] text-accent-ink/70">Spidometrə bax — xatırlatmalar yürüşə görə hesablanır</div>}
        </div>
        <span className={`shrink-0 text-sm font-semibold ${stale ? "rounded-xl bg-dark px-3 py-2 text-white" : "text-accent-2"}`}>Yenilə</span>
      </button>

      {(urgent > 0 || soon > 0) && (
        <div className="rounded-2xl border border-warn/30 bg-warn/10 p-3 text-sm">
          {urgent > 0 && <b className="text-bad">{urgent} baxış gecikir. </b>}
          {soon > 0 && <span className="text-warn">{soon} baxışın vaxtı yaxınlaşır.</span>}
        </div>
      )}

      {states.map((s) => {
        const st = STATUS[s.status];
        const Icon = st.icon;
        return (
          <div key={s.item.id} className="card p-4">
            <div className="flex items-start gap-3">
              <Icon size={20} style={{ color: st.color }} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{s.item.name}</span>
                  {s.item.legal && <span className="rounded bg-surface-2 px-1.5 text-[10px] font-bold text-muted">MƏCBURİ</span>}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: st.color }}>
                  {st.text}
                  {s.label && <span className="text-muted"> · {s.label}</span>}
                </div>
                <div className="mt-0.5 text-[11px] text-muted">
                  Hər {[s.item.intervalKm && km(s.item.intervalKm), s.item.intervalMonths && `${s.item.intervalMonths} ay`].filter(Boolean).join(" / ")} · ~{azn(s.item.approxCost)}
                </div>
              </div>
              <button
                onClick={() => {
                  setItem(s);
                  setDt(todayISO());
                  setKmV(String(car.mileage));
                  setCost(String(s.item.approxCost));
                }}
                className="shrink-0 rounded-xl bg-surface-2 px-3 py-2 text-xs font-bold"
              >
                Edildi
              </button>
            </div>
            {s.status !== "unknown" && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full" style={{ width: `${Math.max(4, s.progress * 100)}%`, background: st.color }} />
              </div>
            )}
          </div>
        );
      })}

      <Sheet
        open={mileOpen}
        onClose={() => setMileOpen(false)}
        title="Yürüşü yenilə"
        footer={
          <button
            className="btn btn-primary w-full"
            onClick={() => {
              // confirming the same number still counts as "checked today"
              if (+mileage >= car.purchaseMileage) updateCar(car.id, { mileage: +mileage });
              setMileOpen(false);
            }}
          >
            Yadda saxla
          </button>
        }
      >
        <input className="input font-display !text-2xl font-bold" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value.replace(/\D/g, ""))} autoFocus />
        <p className="mt-2 text-xs text-muted">Spidometrdəki rəqəmi daxil et — baxış cədvəli avtomatik hesablanacaq.</p>
      </Sheet>

      <Sheet
        open={!!item}
        onClose={() => setItem(null)}
        title={item?.item.name ?? ""}
        footer={
          <button
            className="btn btn-primary w-full"
            onClick={() => {
              if (!item) return;
              const rec = { date: dt, km: +kmV || car.mileage };
              if (+cost > 0) {
                addRepair(car.id, { partId: item.item.part, title: item.item.name, kind: "servis", ...rec, cost: +cost }, [item.item.id]);
              } else {
                markMaintenance(car.id, item.item.id, rec);
              }
              setItem(null);
            }}
          >
            Qeyd et
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="mdate">Tarix</label>
            <input id="mdate" type="date" className="input" value={dt} onChange={(e) => setDt(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="mkm">Yürüş</label>
            <input id="mkm" className="input" inputMode="numeric" value={kmV} onChange={(e) => setKmV(e.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="col-span-2">
            <label className="label" htmlFor="mcost">Xərc, ₼</label>
            <input id="mcost" className="input" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value.replace(/\D/g, ""))} />
            <p className="mt-1 text-xs text-muted">Xərc daxil etsən, təmir tarixçəsinə də düşəcək.</p>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
