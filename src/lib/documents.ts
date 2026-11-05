import type { CarDocument, DocKind } from "./types";

export const DOC_KINDS: { id: DocKind; label: string; months?: number; maintenanceId?: string }[] = [
  { id: "insurance", label: "İcbari sığorta", months: 12, maintenanceId: "insurance" },
  { id: "inspection", label: "Texniki baxış", months: 12, maintenanceId: "inspection" },
  { id: "kasko", label: "KASKO", months: 12 },
  { id: "tax", label: "Yol vergisi", months: 12 },
  { id: "license", label: "Sürücülük vəsiqəsi", months: 120 },
  { id: "other", label: "Digər sənəd" },
];

export const docLabel = (k: DocKind) => DOC_KINDS.find((d) => d.id === k)?.label ?? "Sənəd";

const DAY = 86400000;

export type DocStatus = "ok" | "soon" | "expired" | "none";

export function docState(d: CarDocument, now = Date.now()): { status: DocStatus; daysLeft?: number } {
  if (!d.expires) return { status: "none" };
  const daysLeft = Math.ceil((new Date(d.expires).getTime() - now) / DAY);
  return { status: daysLeft < 0 ? "expired" : daysLeft <= 30 ? "soon" : "ok", daysLeft };
}

/** Latest document of each kind (older renewals stay in the list as history) */
export function currentDocs(docs: CarDocument[] = []) {
  const byKind = new Map<string, CarDocument>();
  for (const d of docs) {
    const key = d.kind === "other" ? d.id : d.kind;
    const prev = byKind.get(key);
    if (!prev || (d.expires ?? "") > (prev.expires ?? "")) byKind.set(key, d);
  }
  return [...byKind.values()];
}

export function addMonths(iso: string, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
