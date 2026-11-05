import { getModel } from "./data/models";
import { currentDocs, docLabel, docState } from "./documents";
import { maintenanceState } from "./maintenance";
import { matches, parseFilters } from "./search";
import type { GarageCar, Listing, SavedSearch } from "./types";

export type ReminderLevel = "overdue" | "soon" | "info";

export interface Reminder {
  /** Stable id — used to show each phone notification only once a day */
  id: string;
  level: ReminderLevel;
  kind: "maintenance" | "document" | "mileage" | "search";
  title: string;
  detail: string;
  href: string;
  carId?: string;
}

const DAY = 86400000;
export const MILEAGE_STALE_DAYS = 7;

/** Days since the odometer reading was last confirmed */
export function mileageAgeDays(car: GarageCar, now = Date.now()) {
  return Math.floor((now - new Date(car.mileageUpdatedAt ?? car.purchaseDate).getTime()) / DAY);
}

export function mileageStale(car: GarageCar, now = Date.now()) {
  return mileageAgeDays(car, now) >= MILEAGE_STALE_DAYS;
}

export function newSearchMatches(s: SavedSearch, listings: Listing[]) {
  const { filters } = parseFilters(new URLSearchParams(s.query));
  return listings.filter((l) => matches(l, filters) && !s.seen.includes(l.id));
}

export function buildReminders(garage: GarageCar[], listings: Listing[], searches: SavedSearch[], now = Date.now()): Reminder[] {
  const out: Reminder[] = [];
  for (const car of garage) {
    const m = getModel(car.modelId);
    const name = `${m?.make ?? ""} ${m?.model ?? ""}`.trim();
    const href = `/qaraj/${car.id}`;
    const docs = currentDocs(car.documents);
    const docKinds = new Set(docs.filter((d) => d.expires).map((d) => d.kind));

    for (const s of maintenanceState(car, now)) {
      if (s.status !== "overdue" && s.status !== "soon") continue;
      // insurance / inspection are tracked by the document's real expiry date when there is one
      if ((s.item.id === "insurance" || s.item.id === "inspection") && docKinds.has(s.item.id)) continue;
      out.push({
        id: `m:${car.id}:${s.item.id}:${s.status}`,
        level: s.status,
        kind: "maintenance",
        title: `${s.item.name} — ${s.status === "overdue" ? "gecikir" : "vaxtı yaxınlaşır"}`,
        detail: `${name} · ${s.label}`,
        href,
        carId: car.id,
      });
    }

    for (const d of docs) {
      const st = docState(d, now);
      if (st.status !== "expired" && st.status !== "soon") continue;
      out.push({
        id: `d:${car.id}:${d.id}:${st.status}`,
        level: st.status === "expired" ? "overdue" : "soon",
        kind: "document",
        title: `${d.kind === "other" ? d.title : docLabel(d.kind)} — ${st.status === "expired" ? "müddəti bitib" : `${st.daysLeft} gün qalıb`}`,
        detail: `${name}${car.plate ? ` · ${car.plate}` : ""}`,
        href: `${href}?tab=docs`,
        carId: car.id,
      });
    }

    if (mileageStale(car, now)) {
      out.push({
        id: `k:${car.id}`,
        level: "info",
        kind: "mileage",
        title: "Yürüşü yenilə",
        detail: `${name} · baxış cədvəli yürüşə görə hesablanır`,
        href,
        carId: car.id,
      });
    }
  }

  for (const s of searches) {
    const fresh = newSearchMatches(s, listings);
    if (!fresh.length) continue;
    out.push({
      id: `s:${s.id}:${fresh.map((l) => l.id).sort().join(",")}`,
      level: "info",
      kind: "search",
      title: `${fresh.length} yeni elan`,
      detail: `Yadda saxlanmış axtarış: ${s.name}`,
      href: `/elanlar?${s.query}`,
    });
  }

  const rank = { overdue: 0, soon: 1, info: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}
