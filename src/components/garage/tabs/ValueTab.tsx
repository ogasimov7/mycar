"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { getModel } from "@/lib/data/models";
import { azn, date, km } from "@/lib/format";
import { saleAdvice } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { GarageCar } from "@/lib/types";

export function ValueTab({ car }: { car: GarageCar }) {
  const listings = useStore((s) => s.listings);
  const a = saleAdvice(car, listings);
  const m = getModel(car.modelId)!;
  const span = a.maxPrice - a.quickSale || 1;
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - a.quickSale) / span) * 100))}%`;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-accent/40 p-5" style={{ background: "radial-gradient(120% 100% at 100% 0%, rgba(255,90,31,.18), transparent 60%), var(--surface)" }}>
        <div className="text-xs font-bold uppercase tracking-widest text-accent">Məsləhət görülən satış qiyməti</div>
        <div className="mt-1 font-display text-4xl font-bold">{azn(a.suggested)}</div>
        <div className="relative mt-5 h-2 rounded-full bg-gradient-to-r from-ok via-warn to-bad">
          <span className="absolute -top-1.5 h-5 w-1.5 -translate-x-1/2 rounded bg-white shadow" style={{ left: pos(a.suggested) }} />
          <span className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 bg-white/50" style={{ left: pos(a.market) }} />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted">
          <span>
            Tez satış<br />
            <b className="text-text">{azn(a.quickSale)}</b>
          </span>
          <span className="text-right">
            Maksimum<br />
            <b className="text-text">{azn(a.maxPrice)}</b>
          </span>
        </div>
      </div>

      <div className="card divide-y divide-line">
        <Row l="Alış qiyməti" v={azn(car.purchasePrice)} sub={`${date(car.purchaseDate)} · ${km(car.purchaseMileage)}`} />
        <Row l="Təmir və servis xərcləri" v={azn(a.repairsTotal)} sub={`${car.repairs.length} qeyd`} />
        <Row l="Ümumi qoyuluş" v={azn(a.invested)} strong />
        <Row
          l="Bazar qiyməti (təxmini)"
          v={azn(a.market)}
          sub={`${azn(a.marketLow)} – ${azn(a.marketHigh)} · etibarlılıq ${a.confidence} · ${a.comparables.length} elan${a.sold ? `, ${a.sold} satılmış` : ""}`}
        />
      </div>

      <div className="card p-4">
        <div className="label">Qiymətə təsir edən amillər</div>
        <ul className="space-y-2">
          {a.factors.map((f) => (
            <li key={f.label} className="flex items-center gap-2 text-sm">
              {f.pct >= 0 ? <TrendingUp size={16} className="text-ok" /> : <TrendingDown size={16} className="text-bad" />}
              <span className="flex-1">{f.label}</span>
              <span className={`font-bold ${f.pct >= 0 ? "text-ok" : "text-bad"}`}>
                {f.pct >= 0 ? "+" : ""}
                {(f.pct * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`rounded-2xl p-4 ${a.balance >= 0 ? "bg-ok/10" : "bg-bad/10"}`}>
        <div className="text-xs text-muted">Bu qiymətə satsan, ümumi qoyuluşa nisbətən</div>
        <div className={`font-display text-2xl font-bold ${a.balance >= 0 ? "text-ok" : "text-bad"}`}>
          {a.balance >= 0 ? "+" : "−"}
          {azn(Math.abs(a.balance))}
        </div>
        <div className="mt-1 text-xs text-muted">
          Sahiblik müddətində aylıq xərc ≈{" "}
          {azn(Math.max(0, -a.balance) / Math.max(1, monthsSince(car.purchaseDate)))}
        </div>
      </div>

      {a.comparables.length > 0 && (
        <div>
          <div className="label">Bazardakı oxşar elanlar</div>
          <div className="space-y-2">
            {a.comparables.slice(0, 5).map((l) => (
              <Link key={l.id} href={`/elan/${l.id}`} className="card flex items-center justify-between p-3 text-sm">
                <span>
                  {m.model} {l.year} · <span className="text-muted">{km(l.mileage)}</span>
                </span>
                <b>{azn(l.price)}</b>
              </Link>
            ))}
          </div>
        </div>
      )}
      <p className="text-[11px] leading-relaxed text-muted">
        Qiymət modelin amortizasiyası, yürüş, baxış balı, servis tarixçəsi və platformadakı oxşar elanlar (satılmışlar 1,5× çəki ilə) əsasında hesablanır. Platformada
        elan çoxaldıqca dəqiqlik artır. Təxminidir.
      </p>
    </div>
  );
}

function monthsSince(iso: string) {
  return Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / (30.4 * 86400000)));
}

function Row({ l, v, sub, strong }: { l: string; v: string; sub?: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <div className={`text-sm ${strong ? "font-bold" : ""}`}>{l}</div>
        {sub && <div className="text-[11px] text-muted">{sub}</div>}
      </div>
      <div className={`font-display ${strong ? "text-lg font-bold" : "font-semibold"}`}>{v}</div>
    </div>
  );
}
