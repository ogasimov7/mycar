import { getModel } from "./data/models";
import { healthScore } from "./maintenance";
import type { GarageCar, Listing } from "./types";

const AVG_KM_PER_YEAR = 18000;

/** Pure depreciation model, independent of current listings */
export function modelValue(modelId: string, year: number, mileage: number) {
  const m = getModel(modelId);
  if (!m) return 0;
  const age = Math.max(0, new Date().getFullYear() - year);
  let v = m.basePrice * Math.pow(1 - m.depreciation, age);
  // mileage vs. average for age
  const expected = Math.max(1, age) * AVG_KM_PER_YEAR;
  const delta = (mileage - expected) / 10000;
  v *= 1 - Math.max(-0.12, Math.min(0.25, delta * 0.015));
  return v;
}

export type Confidence = "aşağı" | "orta" | "yüksək";

export interface MarketEstimate {
  value: number;
  /** Likely price band for this exact year + mileage */
  low: number;
  high: number;
  comparables: Listing[];
  /** How many of the comparables already sold (real deal prices weigh more) */
  sold: number;
  confidence: Confidence;
  source: "bazar + model" | "model";
}

/**
 * Market value = depreciation model blended with comparable listings
 * (same model, ±2 years), each normalised to this car's year and mileage.
 * Sold cars count 1.5× — that price was actually paid.
 */
export function marketEstimate(
  modelId: string,
  year: number,
  mileage: number,
  listings: Listing[],
  exclude: (string | undefined)[] | string = [],
): MarketEstimate {
  const base = modelValue(modelId, year, mileage);
  const skip = new Set(typeof exclude === "string" ? [exclude] : exclude);
  const comps = listings.filter((l) => l.modelId === modelId && Math.abs(l.year - year) <= 2 && !skip.has(l.id));
  if (!comps.length)
    return { value: base, low: base * 0.88, high: base * 1.12, comparables: [], sold: 0, confidence: "aşağı", source: "model" };

  const points = comps.map((c) => ({
    v: c.price * (base / Math.max(1, modelValue(modelId, c.year, c.mileage))),
    w: (c.status === "sold" ? 1.5 : 1) * (c.year === year ? 1.2 : 1),
  }));
  const wsum = points.reduce((a, p) => a + p.w, 0);
  const avg = points.reduce((a, p) => a + p.v * p.w, 0) / wsum;
  const weight = Math.min(0.8, 0.3 + wsum * 0.1);
  const value = avg * weight + base * (1 - weight);

  // spread of the normalised prices, never narrower than ±5% or wider than ±20%
  const sd = Math.sqrt(points.reduce((a, p) => a + p.w * (p.v - avg) ** 2, 0) / wsum);
  const band = Math.min(0.2, Math.max(0.05, sd / value + 0.1 / Math.sqrt(comps.length)));
  const confidence: Confidence = comps.length >= 5 ? "yüksək" : comps.length >= 2 ? "orta" : "aşağı";
  return {
    value,
    low: value * (1 - band),
    high: value * (1 + band),
    comparables: comps.filter((c) => c.status === "active"),
    sold: comps.filter((c) => c.status === "sold").length,
    confidence,
    source: "bazar + model",
  };
}

/** Annuity loan: monthly payment, total paid and overpayment */
export function loan(price: number, downPct: number, months: number, aprPct: number) {
  const principal = Math.max(0, price * (1 - downPct / 100));
  const r = aprPct / 100 / 12;
  const monthly = r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
  const total = monthly * months;
  return { principal, monthly, total, overpay: total - principal, down: price - principal };
}

/** Average rate on consumer loans to individuals in AZ (CBAR data via Baku Research Institute) */
export const AVG_CONSUMER_APR = 17.3;

export interface SaleAdvice {
  market: number;
  marketLow: number;
  marketHigh: number;
  confidence: Confidence;
  sold: number;
  suggested: number;
  quickSale: number;
  maxPrice: number;
  invested: number;
  repairsTotal: number;
  balance: number;
  health: number;
  factors: { label: string; pct: number }[];
  comparables: Listing[];
}

export function saleAdvice(car: GarageCar, listings: Listing[]): SaleAdvice {
  // the car's own listing and the listing it was bought from would just echo our own price
  const est = marketEstimate(car.modelId, car.year, car.mileage, listings, [car.listingId, car.fromListingId]);
  const health = healthScore(car);
  const repairsTotal = car.repairs.reduce((a, r) => a + r.cost, 0);
  const factors: { label: string; pct: number }[] = [];

  const healthPct = (health - 75) / 500; // 100 → +5%, 50 → -5%
  factors.push({ label: `Baxış balı ${health}/100`, pct: healthPct });

  // Documented history is worth something to buyers
  const historyPct = Math.min(0.04, car.repairs.length * 0.004);
  if (historyPct > 0) factors.push({ label: "Sənədləşdirilmiş servis tarixçəsi", pct: historyPct });

  // Recent big repairs (last 12 months) add partial value
  const yearAgo = Date.now() - 365 * 86400000;
  const recentMajor = car.repairs
    .filter((r) => new Date(r.date).getTime() > yearAgo && r.kind !== "servis")
    .reduce((a, r) => a + r.cost, 0);
  const recentPct = Math.min(0.06, (recentMajor * 0.35) / Math.max(1, est.value));
  if (recentPct > 0.002) factors.push({ label: "Son 12 ayda təmir/dəyişmə", pct: recentPct });

  // Body work lowers value (painted/replaced panels)
  const bodyWork = car.repairs.filter((r) =>
    ["hood", "trunk", "roof", "door_fl", "door_fr", "door_rl", "door_rr", "front_bumper", "rear_bumper"].includes(
      r.partId,
    ) && r.kind !== "servis",
  ).length;
  if (bodyWork) factors.push({ label: `Kuzov işləri (${bodyWork} detal)`, pct: -Math.min(0.08, bodyWork * 0.015) });

  const totalPct = factors.reduce((a, f) => a + f.pct, 0);
  const suggested = roundTo(est.value * (1 + totalPct), 100);
  const invested = car.purchasePrice + repairsTotal;
  return {
    market: roundTo(est.value, 100),
    marketLow: roundTo(est.low, 100),
    marketHigh: roundTo(est.high, 100),
    confidence: est.confidence,
    sold: est.sold,
    suggested,
    quickSale: roundTo(suggested * 0.93, 100),
    maxPrice: roundTo(suggested * 1.06, 100),
    invested,
    repairsTotal,
    balance: suggested - invested,
    health,
    factors,
    comparables: est.comparables,
  };
}

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}
