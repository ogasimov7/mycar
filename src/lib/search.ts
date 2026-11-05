import { getModel } from "./data/models";
import { azn, num } from "./format";
import type { CarModel, Fuel, Gearbox, Listing } from "./types";

export type Sort = "new" | "cheap" | "expensive" | "mileage";
export type Body = CarModel["bodyType"];

export const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "Ən yeni" },
  { id: "cheap", label: "Əvvəlcə ucuz" },
  { id: "expensive", label: "Əvvəlcə bahalı" },
  { id: "mileage", label: "Az yürüş" },
];
export const FUELS: Fuel[] = ["Benzin", "Dizel", "Hibrid", "Elektrik", "Qaz"];
export const GEARBOXES: Gearbox[] = ["Avtomat", "Mexaniki", "Robot", "Variator"];
export const BODIES: { id: Body; label: string }[] = [
  { id: "sedan", label: "Sedan" },
  { id: "suv", label: "SUV" },
  { id: "hatch", label: "Hetçbek" },
  { id: "van", label: "Furqon" },
];

export interface Filters {
  q: string;
  make: string | null;
  city: string | null;
  priceMin: string;
  priceMax: string;
  yearMin: string;
  mileageMax: string;
  fuel: Fuel | null;
  gearbox: Gearbox | null;
  body: Body | null;
  color: string | null;
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  make: null,
  city: null,
  priceMin: "",
  priceMax: "",
  yearMin: "",
  mileageMax: "",
  fuel: null,
  gearbox: null,
  body: null,
  color: null,
};

const KEYS = Object.keys(EMPTY_FILTERS) as (keyof Filters)[];

export function parseFilters(params: URLSearchParams): { filters: Filters; sort: Sort } {
  const filters = { ...EMPTY_FILTERS } as Record<keyof Filters, string | null>;
  for (const k of KEYS) {
    const v = params.get(k);
    if (v) filters[k] = v;
  }
  const s = params.get("sort");
  const sort = SORTS.some((x) => x.id === s) ? (s as Sort) : "new";
  return { filters: filters as unknown as Filters, sort };
}

/** Stable query string (keys in a fixed order) so equal searches compare equal */
export function serializeFilters(f: Filters, sort: Sort = "new") {
  const p = new URLSearchParams();
  for (const k of KEYS) {
    const v = f[k];
    if (v) p.set(k, String(v).trim());
  }
  if (sort !== "new") p.set("sort", sort);
  return p.toString();
}

export function matches(l: Listing, f: Filters) {
  if (l.status !== "active") return false;
  const m = getModel(l.modelId);
  if (f.make && m?.make !== f.make) return false;
  if (f.city && l.city !== f.city) return false;
  const needle = f.q.trim().toLowerCase();
  if (needle && !`${m?.make} ${m?.model} ${m?.generation} ${l.city}`.toLowerCase().includes(needle)) return false;
  if (f.priceMin && l.price < +f.priceMin) return false;
  if (f.priceMax && l.price > +f.priceMax) return false;
  if (f.yearMin && l.year < +f.yearMin) return false;
  if (f.mileageMax && l.mileage > +f.mileageMax) return false;
  if (f.fuel && l.fuel !== f.fuel) return false;
  if (f.gearbox && l.gearbox !== f.gearbox) return false;
  if (f.body && m?.bodyType !== f.body) return false;
  if (f.color && l.colorName !== f.color) return false;
  return true;
}

export function search(listings: Listing[], f: Filters, sort: Sort) {
  return listings
    .filter((l) => matches(l, f))
    .sort((a, b) =>
      sort === "cheap"
        ? a.price - b.price
        : sort === "expensive"
          ? b.price - a.price
          : sort === "mileage"
            ? a.mileage - b.mileage
            : b.createdAt.localeCompare(a.createdAt),
    );
}

/** Active filter chips: label + which keys to clear */
export function activeChips(f: Filters): { label: string; keys: (keyof Filters)[] }[] {
  const out: { label: string; keys: (keyof Filters)[] }[] = [];
  if (f.q.trim()) out.push({ label: `“${f.q.trim()}”`, keys: ["q"] });
  if (f.make) out.push({ label: f.make, keys: ["make"] });
  if (f.body) out.push({ label: BODIES.find((b) => b.id === f.body)?.label ?? f.body, keys: ["body"] });
  if (f.priceMin || f.priceMax)
    out.push({
      label: f.priceMin && f.priceMax ? `${num(+f.priceMin)}–${azn(+f.priceMax)}` : f.priceMax ? `≤ ${azn(+f.priceMax)}` : `≥ ${azn(+f.priceMin)}`,
      keys: ["priceMin", "priceMax"],
    });
  if (f.yearMin) out.push({ label: `${f.yearMin}+`, keys: ["yearMin"] });
  if (f.mileageMax) out.push({ label: `≤ ${num(+f.mileageMax)} km`, keys: ["mileageMax"] });
  if (f.gearbox) out.push({ label: f.gearbox, keys: ["gearbox"] });
  if (f.fuel) out.push({ label: f.fuel, keys: ["fuel"] });
  if (f.color) out.push({ label: f.color, keys: ["color"] });
  if (f.city) out.push({ label: f.city, keys: ["city"] });
  return out;
}

/** Human name for a saved search, e.g. "Toyota · 2015+ · ≤ 40 000 ₼" */
export function describeFilters(f: Filters) {
  const chips = activeChips(f).map((c) => c.label);
  return chips.length ? chips.slice(0, 4).join(" · ") : "Bütün elanlar";
}

export function hasFilters(f: Filters) {
  return activeChips(f).length > 0;
}
