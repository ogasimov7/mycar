import type { PartId } from "../types";

export interface PartInfo {
  id: PartId;
  name: string;
  group: "Kuzov" | "Mexanika" | "İşıq və şüşə";
  /** Hidden under the body — shown in X-ray mode */
  internal?: boolean;
}

export const PARTS: PartInfo[] = [
  { id: "engine", name: "Mühərrik", group: "Mexanika", internal: true },
  { id: "transmission", name: "Sürətlər qutusu", group: "Mexanika", internal: true },
  { id: "battery", name: "Akkumulyator", group: "Mexanika", internal: true },
  { id: "exhaust", name: "İşlənmiş qaz sistemi", group: "Mexanika", internal: true },
  { id: "suspension", name: "Asqı", group: "Mexanika", internal: true },
  { id: "brakes", name: "Əyləclər", group: "Mexanika", internal: true },
  { id: "wheels", name: "Təkərlər", group: "Mexanika" },
  { id: "hood", name: "Kapot", group: "Kuzov" },
  { id: "trunk", name: "Baqaj qapağı", group: "Kuzov" },
  { id: "roof", name: "Dam", group: "Kuzov" },
  { id: "front_bumper", name: "Ön bamper", group: "Kuzov" },
  { id: "rear_bumper", name: "Arxa bamper", group: "Kuzov" },
  { id: "door_fl", name: "Ön sol qapı", group: "Kuzov" },
  { id: "door_fr", name: "Ön sağ qapı", group: "Kuzov" },
  { id: "door_rl", name: "Arxa sol qapı", group: "Kuzov" },
  { id: "door_rr", name: "Arxa sağ qapı", group: "Kuzov" },
  { id: "mirrors", name: "Güzgülər", group: "Kuzov" },
  { id: "headlights", name: "Ön faralar", group: "İşıq və şüşə" },
  { id: "taillights", name: "Arxa stoplar", group: "İşıq və şüşə" },
  { id: "glass", name: "Şüşələr və salon", group: "İşıq və şüşə" },
];

export function partName(id: PartId) {
  return PARTS.find((p) => p.id === id)?.name ?? id;
}

/** Quick-pick repair titles per part to speed up logging on mobile */
export const PART_PRESETS: Partial<Record<PartId, string[]>> = {
  engine: ["Yağ dəyişimi", "Şamların dəyişməsi", "Vaxt zənciri / kəməri", "Su nasosu", "Conta dəyişməsi", "Radiator"],
  transmission: ["ATF yağ dəyişimi", "Qutunun təmiri", "Mufta / disk"],
  battery: ["Akkumulyator dəyişimi", "Klemlərin təmizlənməsi"],
  exhaust: ["Glüşitel", "Katalizator", "Lyambda zondu"],
  suspension: ["Amortizator", "Sayləntblok", "Stabilizator dayağı", "Şaravoy", "Razval-sxojdeniya"],
  brakes: ["Əyləc bəndləri", "Əyləc diskləri", "Əyləc mayesi", "Support"],
  wheels: ["Mövsümi təkər dəyişimi", "Yeni şinlər", "Balans", "Disk təmiri"],
  headlights: ["Fara cilalanması", "Lampa dəyişimi", "Fara dəyişimi"],
  taillights: ["Stop lampası", "Stop dəyişimi"],
  glass: ["Ön şüşə dəyişimi", "Salon filtri", "Kondisioner doldurulması", "Salon kimyəvi təmizlik"],
  mirrors: ["Güzgü dəyişimi", "Güzgü korpusu"],
};

export const BODY_PRESETS = ["Rəngləmə", "Düzəltmə (rixtovka)", "Detal dəyişimi", "Cızıq cilalanması", "Polirovka"];
