import type { PartId } from "../types";
import generated from "./models3d.generated.json";

/**
 * Real 3D (GLB/glTF) model registry.
 *
 * Models are listed in scripts/3d-models.json (one default per catalogue
 * model + optional per-generation variants with year ranges) and downloaded,
 * optimised and registered by `npm run models:fetch`. The registry key is the
 * catalogue modelId for the default file and `modelId@GEN` for variants.
 * get3D(modelId, year) picks the variant whose years cover the car's year,
 * otherwise the nearest generation. Cars without any file use GENERIC_3D.
 */
export interface Model3D {
  url: string;
  /** Shown in the attribution line, as CC-BY requires */
  title: string;
  author: string;
  license: string;
  sourceUrl: string;
  /** Material names that receive the car's paint colour (null = keep the file's own colours) */
  paint: RegExp | null;
  /** Set to true if the model's nose points to -X after auto-alignment */
  flip?: boolean;
  /**
   * For files whose colours come from a palette texture (one material for the
   * whole car): triangles sampling this texel colour are split out into their
   * own paintable material at load time.
   */
  paletteKey?: { rgb: [number, number, number]; tol?: number };
  /** Also treat materials whose base colour is ≈ this (0–1 RGB) as paint — for files with numbered material names */
  paintColor?: [number, number, number];
  /** Drop the base-colour texture on paint materials so the new colour isn't muddied by a baked paint texture */
  paintClearMap?: boolean;
  /** Extra name rules for this file, checked before the generic ones */
  partRules?: [RegExp, PartId][];
  /** Generation this file represents (e.g. "W210") */
  generation?: string;
  /** Model years this file covers */
  years?: [number, number];
}

export const GENERIC_3D: Model3D = {
  url: "/models/car-concept.glb",
  title: "Car Concept",
  author: "Eric Chadwick / Darmstadt Graphics Group",
  license: "CC BY 4.0",
  sourceUrl: "https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept",
  paint: /^Paint 1/i,
};

/** Generic paint-material names used by most car models */
const DEFAULT_PAINT = /paint|car.?body|body.?colou?r|exterior|carroceria|carrosserie/i;

type GeneratedEntry = Omit<Model3D, "paint">;

/** Name given to the material split out by `paletteKey` */
export const PALETTE_PAINT_NAME = "Paint (palette)";
const PALETTE_PAINT = /^Paint \(palette\)$/;

/**
 * Per-file tweaks found by inspecting each downloaded model. `paint: null`
 * where the body colour is baked into a texture or shares one material with
 * glass/tyres — tinting those would colour the whole car.
 */
const OVERRIDES: Partial<Record<string, Partial<Model3D>>> = {
  "toyota-prius-30": { paint: /^Color\./ },
  "hyundai-elantra-ad": { paint: /Ceramic_White/ },
  "mercedes-e-w212": { paint: /^Body_Color$/ },
  "bmw-5-f10": { paint: /^New_Material$/ },
  // body = light-grey palette cell (171,171,171), 36% of the surface
  "kia-optima-jf": { paint: PALETTE_PAINT, paletteKey: { rgb: [171, 171, 171], tol: 8 } },
  "toyota-camry-70": { paint: /^Paint_Color$/ },
  "toyota-prado-150": { paint: /^(MeshestoyotaLandcruiserBody11Mtl|F1Mtl|MeshestoyotaLandcruiserBody21Mtl)$/ },
  "kia-sportage-ql": { paint: /^Carro_Pintura$/ },
  // second batch — body materials found by inspecting each file
  "chevrolet-cruze-j300": { paint: /^cruzej300_body$/ },
  "hyundai-sonata-dn8": { paint: /^Material_2125738062$/ },
  "lada-2107": { paint: /^BaseColorCuzov$/ },
  "lada-2106": { paint: /^Steel$/, paintClearMap: true },
  "range-rover-l405": { paint: /^Material\.005$/ },
  "ford-fusion-2": { paint: /^material_0$/ },
  "bmw-3-f30": { paint: /^00_-_BODY$/ },
  "hyundai-santa-fe-dm": { paint: null },
  "lada-niva": { paint: /^niva_bodyshell$/ },
  "changan-uni-z": { paint: null },
  "mercedes-sprinter-906": { paint: /^Carrosserie/ },
  "chevrolet-malibu-9": { paint: /^int_mat$/ },
  "lada-2115": { paint: null, paintColor: [0.24, 1, 0] },
  "kia-rio-4": { paint: /Steel_Gray$/ },
  "hyundai-accent-rb": { paint: /^body$/ },
  "hyundai-tucson-tl": { paint: /^varnish$/ },
  "toyota-rav4-xa50": { paint: /^Silver_Sky_Metallic$/ },
};

/**
 * All downloaded files, keyed by registry key (`modelId` or `modelId@GEN`).
 * Filled by `npm run models:fetch` (models3d.generated.json).
 */
export const MODEL_3D: Partial<Record<string, Model3D>> = Object.fromEntries(
  Object.entries(generated as unknown as Record<string, GeneratedEntry>).map(([key, e]) => [
    key,
    { ...e, paint: DEFAULT_PAINT, ...OVERRIDES[key] },
  ]),
);

/** Every file per catalogue model (default + generation variants) */
const BY_MODEL: Record<string, Model3D[]> = {};
for (const [key, m] of Object.entries(MODEL_3D)) {
  if (!m) continue;
  (BY_MODEL[key.split("@")[0]] ||= []).push(m);
}

/** 3D files available for a model, oldest generation first */
export function variants3D(modelId: string): Model3D[] {
  return [...(BY_MODEL[modelId] ?? [])].sort((a, b) => (a.years?.[0] ?? 0) - (b.years?.[0] ?? 0));
}

/**
 * The 3D model for a car: the generation whose years include `year`,
 * otherwise the closest generation, otherwise the default file / generic model.
 */
export function get3D(modelId: string, year?: number): Model3D {
  const list = BY_MODEL[modelId];
  if (!list?.length) return GENERIC_3D;
  const fallback = MODEL_3D[modelId] ?? list[0];
  if (!year) return fallback;
  let best = fallback;
  let bestD = Infinity;
  for (const m of list) {
    if (!m.years) continue;
    const [a, b] = m.years;
    const d = year < a ? a - year : year > b ? year - b : 0;
    if (d < bestD) {
      bestD = d;
      best = m;
    }
  }
  return best;
}

/**
 * Generic mesh/material name → part rules. Most car models from Sketchfab,
 * CGTrader, Hum3D etc. use English part names, so this covers a lot of files
 * without manual work. Order matters: the first match wins.
 */
export const PART_RULES: [RegExp, PartId][] = [
  [/brake|caliper|rotor|disc/i, "brakes"],
  [/tire|tyre|wheel|rims?\b|rims?[._\d]|pneu|roda/i, "wheels"],
  [/engine|motor\b/i, "engine"],
  [/exhaust|muffler|tailpipe/i, "exhaust"],
  [/axle|suspension|spring|shock|strut/i, "suspension"],
  [/battery/i, "battery"],
  [/gearbox|transmission/i, "transmission"],
  [/head.?light|head.?lamp|front.?light|projector|farol/i, "headlights"],
  [/tail.?light|tailight|rear.?light|brake.?light|turnsignalsrear|stop.?lamp|lanterna/i, "taillights"],
  [/mirror/i, "mirrors"],
  [/hood|bonnet/i, "hood"],
  [/trunk|boot.?lid|tailgate|hatch/i, "trunk"],
  [/roof/i, "roof"],
  [/bumper.?(front|f\b)|front.?bumper|grill/i, "front_bumper"],
  [/bumper.?(rear|back|r\b)|rear.?bumper/i, "rear_bumper"],
  [/glass|window|windshield|windscreen|wiper|vidro/i, "glass"],
  [/interior|seat|steering|dash|pedal|floor/i, "glass"],
  [/door.?(rear|back).?(l|left)|door.?rl/i, "door_rl"],
  [/door.?(rear|back).?(r|right)|door.?rr/i, "door_rr"],
  [/door.?(front.?)?(l|left)|left.?door|door.?fl/i, "door_fl"],
  [/door.?(front.?)?(r|right)|right.?door|door.?fr/i, "door_fr"],
];
