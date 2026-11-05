"use client";

import { useState, type ReactNode } from "react";
import { Banknote, CalendarRange, CarFront, Fuel, Gauge, LineChart, MapPin, Settings2, Tag } from "lucide-react";
import { num } from "@/lib/format";
import { AVG_CONSUMER_APR, loan } from "@/lib/pricing";
import type { Listing } from "@/lib/types";

/** Default plan shown on the card: 20% down, 36 months, average market rate */
export function monthlyPayment(price: number) {
  return loan(price, 20, 36, AVG_CONSUMER_APR).monthly;
}

type Plan = "cash" | "credit" | "market";

/** Charcoal "car overview" panel: spec tiles, payment plans, location, price + CTA */
export function OverviewCard({
  listing,
  market,
  cta,
  onCredit,
  className = "",
}: {
  listing: Listing;
  market?: number;
  cta: ReactNode;
  /** Opens the loan calculator */
  onCredit?: () => void;
  className?: string;
}) {
  const [plan, setPlan] = useState<Plan>("cash");
  const monthly = Math.round(monthlyPayment(listing.price));
  const marketRounded = market ? Math.round(market / 100) * 100 : undefined;
  const plans: { id: Plan; icon: typeof Banknote; label: string; value: number; unit: string }[] = [
    { id: "cash", icon: Banknote, label: "Nağd", value: listing.price, unit: "₼" },
    { id: "credit", icon: CalendarRange, label: "Kredit", value: monthly, unit: "₼/ay" },
    ...(marketRounded ? [{ id: "market" as Plan, icon: LineChart, label: "Bazar", value: marketRounded, unit: "₼" }] : []),
  ];
  const current = plans.find((p) => p.id === plan)!;

  return (
    <div className={`panel-dark px-5 pb-5 pt-6 ${className}`}>
      <div className="text-[15px] font-semibold">Maşın haqqında</div>
      <div className="mt-3.5 flex gap-2 overflow-hidden">
        <span className="spec-chip">
          <Fuel size={16} strokeWidth={1.7} /> {listing.fuel}
        </span>
        <span className="spec-chip">
          <Settings2 size={16} strokeWidth={1.7} /> {listing.gearbox}
        </span>
        <span className="spec-chip">
          <Gauge size={16} strokeWidth={1.7} /> {num(listing.mileage / 1000)}k km
        </span>
        <span className="spec-chip !px-2.5" title={listing.engine}>
          <CarFront size={16} strokeWidth={1.7} />
        </span>
      </div>

      <div className="mt-6 text-[15px] font-semibold">Ödəniş planı</div>
      <div className={`mt-3.5 grid gap-2.5 ${plans.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {plans.map(({ id, icon: Icon, label, value, unit }) => {
          const on = plan === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPlan(id)}
              className={`rounded-2xl border p-3 text-left transition ${on ? "border-accent" : "border-line hover:border-[#6a6a6a]"}`}
            >
              <span className={`grid h-6 w-6 place-items-center rounded-full ${on ? "bg-accent text-accent-ink" : "rounded-md bg-[#5a5a5a] text-white"}`}>
                <Icon size={13} />
              </span>
              <span className="mt-3 block text-[12px] text-white/85">{label}</span>
              <span className="mt-2 block truncate text-[13px] font-bold">
                {num(value)}
                <span className="text-[11px] font-normal text-muted">{unit}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 text-[15px] font-semibold">Yerləşmə</div>
      <div className="mt-3 flex items-center overflow-hidden rounded-2xl border border-line bg-dark-2/60 text-[13px]">
        <span className="grid h-12 w-12 place-items-center border-r border-line">
          <MapPin size={18} strokeWidth={1.7} />
        </span>
        <span className="px-4">{listing.city}, Azərbaycan</span>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Tag size={20} strokeWidth={1.7} className="shrink-0" />
          <span className="h-8 w-px bg-line" />
          <span className="truncate font-display text-[26px] font-semibold leading-none">
            <sup className="mr-0.5 text-[13px] font-medium">₼</sup>
            {num(current.value)}
            {current.unit !== "₼" && <span className="font-sans text-[13px] font-normal text-muted">/ay</span>}
          </span>
        </div>
        {cta}
      </div>
      {plan === "credit" && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted">
          <span>20% ilkin ödəniş, 36 ay, illik {AVG_CONSUMER_APR}% — təxmini</span>
          {onCredit && (
            <button type="button" onClick={onCredit} className="shrink-0 rounded-full border border-line px-3 py-1 text-[11px] font-semibold text-white hover:border-accent">
              Kalkulyator
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Amber CTA in the style of "Book Now" */
export function AmberButton({ children, href, onClick }: { children: ReactNode; href?: string; onClick?: () => void }) {
  const cls = "inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-accent px-7 text-[15px] font-medium text-accent-ink transition hover:brightness-105 active:scale-[0.98]";
  if (href)
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
