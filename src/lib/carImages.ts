import { getModel } from "./data/models";

/**
 * Studio photos of any make/model/year/colour from an image CDN.
 *
 *   NEXT_PUBLIC_CAR_IMAGES_PROVIDER = "carimagesapi" | "imagin"
 *   NEXT_PUBLIC_CAR_IMAGES_KEY      = your key (carimagesapi) / customer id (imagin)
 *
 * Both services are built for client-side use; lock the key to your domain in
 * their dashboard. Without a key the app falls back to the built-in SVG art.
 */
const PROVIDER = process.env.NEXT_PUBLIC_CAR_IMAGES_PROVIDER as "carimagesapi" | "imagin" | undefined;
const KEY = process.env.NEXT_PUBLIC_CAR_IMAGES_KEY;

export const carImagesEnabled = !!(PROVIDER && KEY);

/** Catalogue id → model family name the APIs understand */
const API_MODEL: Record<string, string> = {
  "toyota-prius-30": "Prius",
  "hyundai-elantra-ad": "Elantra",
  "mercedes-e-w212": "E-Class",
  "bmw-5-f10": "5 Series",
  "kia-optima-jf": "Optima",
  "toyota-camry-70": "Camry",
  "chevrolet-cruze-j300": "Cruze",
  "toyota-prado-150": "Land Cruiser Prado",
  "kia-sportage-ql": "Sportage",
  "hyundai-sonata-dn8": "Sonata",
  "mercedes-c-w205": "C-Class",
  "lada-2107": "2107",
  "kia-sorento-um": "Sorento",
  "ford-transit": "Transit",
  "opel-astra-g-h": "Astra",
  "hyundai-santa-fe-dm": "Santa Fe",
  "chevrolet-equinox-3": "Equinox",
  "lada-2106": "2106",
  "range-rover-l405": "Range Rover",
  "ford-fusion-2": "Fusion",
  "bmw-3-f30": "3 Series",
  "mercedes-vito-w639": "Vito",
  "bmw-x5-e70": "X5",
  "lada-niva": "Niva",
  "changan-uni-z": "UNI-Z",
  "toyota-corolla-e180": "Corolla",
  "lada-2115": "2115",
  "kia-rio-4": "Rio",
  "mercedes-s-w221": "S-Class",
  "hyundai-accent-rb": "Accent",
  "mercedes-sprinter-906": "Sprinter",
  "chevrolet-malibu-9": "Malibu",
  "gaz-gazel": "GAZelle",
  "hyundai-tucson-tl": "Tucson",
  "toyota-rav4-xa50": "RAV4",
};

/** Our palette (Azerbaijani names) → provider colour words */
const COLOR_WORD: Record<string, string> = {
  Ağ: "white",
  Qara: "black",
  Gümüşü: "silver",
  Boz: "dark grey",
  Göy: "blue",
  Qırmızı: "red",
  Yaşıl: "green",
  Narıncı: "orange",
  Bej: "beige",
};

export type CarView = "front34" | "side" | "rear34" | "front" | "rear";

const IMAGIN_ANGLE: Record<CarView, string> = { front34: "01", side: "05", rear34: "09", front: "13", rear: "17" };

export function carImageUrl(
  modelId: string,
  opts: { year?: number; colorName?: string; view?: CarView; width?: number } = {},
): string | null {
  if (!carImagesEnabled) return null;
  const m = getModel(modelId);
  if (!m) return null;
  const model = API_MODEL[modelId] ?? m.model;
  const color = opts.colorName ? COLOR_WORD[opts.colorName] : undefined;
  const view = opts.view ?? "front34";
  const width = opts.width ?? 800;

  if (PROVIDER === "carimagesapi") {
    const p = new URLSearchParams({ make: m.make, model, view, width: String(width), format: "webp", key: KEY! });
    if (opts.year) p.set("year", String(opts.year));
    if (color && ["white", "black", "silver", "dark grey", "blue", "red"].includes(color)) p.set("color", color);
    return `https://carimagesapi.com/image?${p}`;
  }

  // imagin.studio
  const p = new URLSearchParams({
    customer: KEY!,
    make: m.make.toLowerCase(),
    modelFamily: model.toLowerCase(),
    angle: IMAGIN_ANGLE[view],
    zoomType: "fullscreen",
    width: String(width),
  });
  if (opts.year) p.set("modelYear", String(opts.year));
  if (color) p.set("paintDescription", color);
  return `https://cdn.imagin.studio/getImage?${p}`;
}
