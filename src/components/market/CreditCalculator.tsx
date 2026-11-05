"use client";

import { useState } from "react";
import { azn, num } from "@/lib/format";
import { AVG_CONSUMER_APR, loan } from "@/lib/pricing";
import { Sheet } from "../Sheet";

const TERMS = [12, 24, 36, 48, 60];
const RATES = [
  { label: "Güzəştli", apr: 12 },
  { label: "Bazar ortası", apr: AVG_CONSUMER_APR },
  { label: "Yüksək", apr: 22 },
];

export function CreditCalculator({ open, onClose, price }: { open: boolean; onClose: () => void; price: number }) {
  const [down, setDown] = useState(20);
  const [months, setMonths] = useState(36);
  const [apr, setApr] = useState(String(AVG_CONSUMER_APR));
  const r = loan(price, down, months, +apr.replace(",", ".") || 0);
  const parts = r.total + r.down;

  return (
    <Sheet open={open} onClose={onClose} title="Kredit kalkulyatoru">
      <div className="space-y-5">
        <div className="panel-dark px-5 py-4">
          <div className="text-[12px] text-white/60">Aylıq ödəniş</div>
          <div className="font-display text-[32px] font-semibold leading-tight">
            {num(r.monthly)} <span className="text-[15px] font-normal text-white/60">₼/ay</span>
          </div>
          {/* where the money goes: down payment · loan body · interest */}
          <div className="mt-3 flex h-2 gap-[2px] overflow-hidden rounded-full">
            <span className="bg-white/80" style={{ width: `${(r.down / parts) * 100}%` }} />
            <span className="bg-accent" style={{ width: `${(r.principal / parts) * 100}%` }} />
            <span className="bg-bad" style={{ width: `${(r.overpay / parts) * 100}%` }} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
            <Legend color="bg-white/80" label="İlkin" value={azn(r.down)} />
            <Legend color="bg-accent" label="Kredit" value={azn(r.principal)} />
            <Legend color="bg-bad" label="Faiz" value={azn(r.overpay)} />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="label !mb-0">İlkin ödəniş</span>
            <span className="text-[13px] font-semibold">
              {down}% · {azn(r.down)}
            </span>
          </div>
          <input type="range" min={0} max={70} step={5} value={down} onChange={(e) => setDown(+e.target.value)} className="mt-2 w-full accent-[var(--accent)]" aria-label="İlkin ödəniş faizi" />
        </div>

        <div>
          <span className="label">Müddət</span>
          <div className="grid grid-cols-5 gap-2">
            {TERMS.map((t) => (
              <button key={t} className="chip justify-center" data-active={months === t} onClick={() => setMonths(t)}>
                {t} ay
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">İllik faiz, %</span>
          <div className="grid grid-cols-3 gap-2">
            {RATES.map((x) => (
              <button key={x.label} className="chip flex-col justify-center !gap-0 !py-2 leading-tight" data-active={+apr.replace(",", ".") === x.apr} onClick={() => setApr(String(x.apr))}>
                <span className="text-[11px] font-normal opacity-70">{x.label}</span>
                <span>{x.apr}%</span>
              </button>
            ))}
          </div>
          <input className="input mt-2" inputMode="decimal" value={apr} onChange={(e) => setApr(e.target.value.replace(/[^\d.,]/g, ""))} aria-label="İllik faiz" />
        </div>

        <div className="rounded-2xl bg-surface-2 p-3 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted">Cəmi ödəniləcək</span>
            <b>{azn(r.total + r.down)}</b>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted">Artıq ödəniş (faiz)</span>
            <b className="text-bad">{azn(r.overpay)}</b>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-muted">
          Annuitet hesabı, təxminidir. “Bazar ortası” Mərkəzi Bankın fiziki şəxslərə kreditlər üzrə orta faizidir (~{AVG_CONSUMER_APR}%). Bankların real təklifi, sığorta və
          komissiyalar fərqli ola bilər — müqavilədə FİFD-ə (effektiv faiz) bax.
        </p>
      </div>
    </Sheet>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span>
      <span className="flex items-center gap-1.5 text-white/60">
        <span className={`h-2 w-2 rounded-full ${color}`} /> {label}
      </span>
      <b className="text-white">{value}</b>
    </span>
  );
}
