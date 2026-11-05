import type { GarageCar, PartId } from "./types";

export interface MaintenanceItem {
  id: string;
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
  part: PartId;
  approxCost: number;
  legal?: boolean;
}

export const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  { id: "oil", name: "Mühərrik yağı + filtr", intervalKm: 10000, intervalMonths: 12, part: "engine", approxCost: 90 },
  { id: "air_filter", name: "Hava filtri", intervalKm: 20000, intervalMonths: 12, part: "engine", approxCost: 25 },
  { id: "cabin_filter", name: "Salon filtri", intervalKm: 15000, intervalMonths: 12, part: "glass", approxCost: 20 },
  { id: "inspection", name: "Texniki baxış", intervalMonths: 12, part: "glass", approxCost: 30, legal: true },
  { id: "insurance", name: "İcbari sığorta", intervalMonths: 12, part: "glass", approxCost: 50, legal: true },
  { id: "brake_pads", name: "Əyləc bəndləri", intervalKm: 30000, part: "brakes", approxCost: 80 },
  { id: "brake_fluid", name: "Əyləc mayesi", intervalMonths: 24, part: "brakes", approxCost: 35 },
  { id: "tires", name: "Mövsümi təkər dəyişimi", intervalMonths: 6, part: "wheels", approxCost: 20 },
  { id: "spark", name: "Alışdırma şamları", intervalKm: 40000, part: "engine", approxCost: 70 },
  { id: "coolant", name: "Antifriz", intervalKm: 60000, intervalMonths: 48, part: "engine", approxCost: 45 },
  { id: "atf", name: "Sürətlər qutusu yağı", intervalKm: 60000, part: "transmission", approxCost: 180 },
  { id: "battery", name: "Akkumulyator yoxlanışı", intervalMonths: 36, part: "battery", approxCost: 140 },
];

export type MaintStatus = "ok" | "soon" | "overdue" | "unknown";

export interface MaintState {
  item: MaintenanceItem;
  status: MaintStatus;
  /** 0..1 — how much of the interval is used */
  progress: number;
  kmLeft?: number;
  daysLeft?: number;
  label: string;
}

const DAY = 86400000;

export function maintenanceState(car: GarageCar, now = Date.now()): MaintState[] {
  return MAINTENANCE_ITEMS.map((item): MaintState => {
    const rec = car.maintenance[item.id];
    if (!rec) {
      return { item, status: "unknown", progress: 0, label: "Məlumat yoxdur" };
    }
    let progress = 0;
    let kmLeft: number | undefined;
    let daysLeft: number | undefined;
    if (item.intervalKm) {
      const used = car.mileage - rec.km;
      kmLeft = item.intervalKm - used;
      progress = Math.max(progress, used / item.intervalKm);
    }
    if (item.intervalMonths) {
      const due = new Date(rec.date);
      due.setMonth(due.getMonth() + item.intervalMonths);
      daysLeft = Math.round((due.getTime() - now) / DAY);
      const total = item.intervalMonths * 30.4;
      progress = Math.max(progress, 1 - daysLeft / total);
    }
    const overdue = (kmLeft !== undefined && kmLeft <= 0) || (daysLeft !== undefined && daysLeft <= 0);
    const soon =
      !overdue && ((kmLeft !== undefined && kmLeft < 1500) || (daysLeft !== undefined && daysLeft < 30));
    const parts: string[] = [];
    if (kmLeft !== undefined) parts.push(kmLeft > 0 ? `${fmtNum(kmLeft)} km` : `${fmtNum(-kmLeft)} km keçib`);
    if (daysLeft !== undefined) parts.push(daysLeft > 0 ? `${daysLeft} gün` : `${-daysLeft} gün gecikir`);
    return {
      item,
      status: overdue ? "overdue" : soon ? "soon" : "ok",
      progress: Math.min(1, Math.max(0, progress)),
      kmLeft,
      daysLeft,
      label: parts.join(" · "),
    };
  }).sort((a, b) => rank(b) - rank(a) || b.progress - a.progress);
}

function rank(s: MaintState) {
  return { overdue: 3, soon: 2, unknown: 1, ok: 0 }[s.status];
}

function fmtNum(n: number) {
  return new Intl.NumberFormat("az-AZ").format(Math.round(n));
}

/** 0..100 maintenance health score */
export function healthScore(car: GarageCar) {
  const states = maintenanceState(car);
  let score = 100;
  for (const s of states) {
    if (s.status === "overdue") score -= s.item.legal ? 6 : 9;
    else if (s.status === "soon") score -= 3;
    else if (s.status === "unknown") score -= 4;
  }
  return Math.max(0, Math.min(100, score));
}
