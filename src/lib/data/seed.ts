import type { GarageCar, Listing } from "../types";
import seedPhotos from "./seedPhotos.json";

/** Real photos (Wikimedia Commons, free licences) — colour follows the car in the photo */
const PHOTOS = seedPhotos as Record<string, { photos: string[]; color: string; colorName: string; credit: Listing["photoCredit"] }>;

const names = ["Elvin", "Rauf", "Nigar", "Tural", "Kamran", "Aysel", "Orxan", "Fərid", "Səbinə", "Ramil"];

type Seed = Omit<Listing, "id" | "photos" | "status" | "sellerName" | "phone" | "createdAt"> & { daysAgo: number };

const raw: Seed[] = [
  { modelId: "toyota-prius-30", year: 2014, price: 19800, mileage: 212000, color: "#f2f2f0", colorName: "Ağ", fuel: "Hibrid", gearbox: "Variator", engine: "1.8 L", city: "Bakı", description: "Hibrid batareya 2025-də yenilənib. Taksi olmayıb, salon təmizdir.", daysAgo: 1 },
  { modelId: "toyota-prius-30", year: 2012, price: 16900, mileage: 268000, color: "#a8adb3", colorName: "Gümüşü", fuel: "Hibrid", gearbox: "Variator", engine: "1.8 L", city: "Sumqayıt", description: "Yanacaq sərfi 4.5 L. Bütün servisləri vaxtında edilib.", daysAgo: 3 },
  { modelId: "hyundai-elantra-ad", year: 2018, price: 24500, mileage: 96000, color: "#141414", colorName: "Qara", fuel: "Benzin", gearbox: "Avtomat", engine: "2.0 L", city: "Bakı", description: "Rəsmi dilerdən alınıb, qəzasız. Yağ yemir.", daysAgo: 0 },
  { modelId: "hyundai-elantra-ad", year: 2017, price: 22300, mileage: 128000, color: "#5b6168", colorName: "Boz", fuel: "Benzin", gearbox: "Avtomat", engine: "2.0 L", city: "Gəncə", description: "Ön bamper rənglənib, qalan hər şey orijinal.", daysAgo: 6 },
  { modelId: "mercedes-e-w212", year: 2014, price: 38500, mileage: 165000, color: "#141414", colorName: "Qara", fuel: "Benzin", gearbox: "Avtomat", engine: "2.0 L Turbo", city: "Bakı", description: "Restyling, AMG paket. Qutuya yeni lövhə qoyulub.", daysAgo: 2 },
  { modelId: "bmw-5-f10", year: 2013, price: 36900, mileage: 151000, color: "#1f3d7a", colorName: "Göy", fuel: "Benzin", gearbox: "Avtomat", engine: "2.0 L Turbo", city: "Bakı", description: "Zəncir dəyişilib (2025). M-paket, HUD, panorama.", daysAgo: 4 },
  { modelId: "bmw-5-f10", year: 2015, price: 44000, mileage: 118000, color: "#f2f2f0", colorName: "Ağ", fuel: "Benzin", gearbox: "Avtomat", engine: "2.0 L Turbo", city: "Xırdalan", description: "xDrive, tam servis tarixçəsi.", daysAgo: 9 },
  { modelId: "kia-optima-jf", year: 2017, price: 23900, mileage: 110000, color: "#b3121d", colorName: "Qırmızı", fuel: "Benzin", gearbox: "Avtomat", engine: "2.4 L", city: "Bakı", description: "Mühərrik zəmanət çərçivəsində dəyişilib.", daysAgo: 5 },
  { modelId: "toyota-camry-70", year: 2020, price: 47500, mileage: 64000, color: "#a8adb3", colorName: "Gümüşü", fuel: "Benzin", gearbox: "Avtomat", engine: "2.5 L", city: "Bakı", description: "Dilerdə servis olunub, ideal vəziyyət.", daysAgo: 1 },
  { modelId: "chevrolet-cruze-j300", year: 2013, price: 13200, mileage: 189000, color: "#f2f2f0", colorName: "Ağ", fuel: "Benzin", gearbox: "Avtomat", engine: "1.8 L", city: "Mingəçevir", description: "Termostat və pompa yenidir.", daysAgo: 12 },
  { modelId: "toyota-prado-150", year: 2016, price: 72000, mileage: 142000, color: "#141414", colorName: "Qara", fuel: "Benzin", gearbox: "Avtomat", engine: "2.7 L", city: "Bakı", description: "Bezdorojedə olmayıb. 7 yer.", daysAgo: 2 },
  { modelId: "kia-sportage-ql", year: 2019, price: 37800, mileage: 78000, color: "#1f5c43", colorName: "Yaşıl", fuel: "Benzin", gearbox: "Avtomat", engine: "2.0 L", city: "Quba", description: "AWD, panorama, isidilən sükan.", daysAgo: 7 },
  { modelId: "hyundai-sonata-dn8", year: 2021, price: 41200, mileage: 52000, color: "#e2621b", colorName: "Narıncı", fuel: "Benzin", gearbox: "Avtomat", engine: "2.5 L", city: "Bakı", description: "Yeni kimi, rəsmi zəmanət davam edir.", daysAgo: 0 },
  { modelId: "mercedes-c-w205", year: 2016, price: 39500, mileage: 132000, color: "#a8adb3", colorName: "Gümüşü", fuel: "Benzin", gearbox: "Avtomat", engine: "1.6 L Turbo", city: "Bakı", description: "C 180, AMG paket, servis kitabçası var.", daysAgo: 1 },
  { modelId: "lada-2107", year: 2010, price: 6800, mileage: 210000, color: "#f2f2f0", colorName: "Ağ", fuel: "Benzin", gearbox: "Mexaniki", engine: "1.6 L", city: "Sumqayıt", description: "İnjektor, kuzov çürük deyil, sənədlər qaydasında.", daysAgo: 2 },
  { modelId: "kia-sorento-um", year: 2017, price: 36500, mileage: 118000, color: "#141414", colorName: "Qara", fuel: "Dizel", gearbox: "Avtomat", engine: "2.2 L CRDi", city: "Bakı", description: "7 yer, AWD, panorama.", daysAgo: 3 },
  { modelId: "hyundai-santa-fe-dm", year: 2015, price: 31900, mileage: 145000, color: "#5b6168", colorName: "Boz", fuel: "Dizel", gearbox: "Avtomat", engine: "2.0 L CRDi", city: "Gəncə", description: "Rəsmi dilerdən, qəzasız.", daysAgo: 4 },
  { modelId: "toyota-corolla-e180", year: 2016, price: 24800, mileage: 98000, color: "#f2f2f0", colorName: "Ağ", fuel: "Benzin", gearbox: "Variator", engine: "1.6 L", city: "Bakı", description: "Variator mayesi dəyişilib, ideal vəziyyət.", daysAgo: 0 },
  { modelId: "lada-niva", year: 2019, price: 15500, mileage: 64000, color: "#1f5c43", colorName: "Yaşıl", fuel: "Benzin", gearbox: "Mexaniki", engine: "1.7 L", city: "Quba", description: "Kənd yollarına ideal, yeni təkərlər.", daysAgo: 6 },
  { modelId: "bmw-x5-e70", year: 2011, price: 33900, mileage: 176000, color: "#141414", colorName: "Qara", fuel: "Benzin", gearbox: "Avtomat", engine: "3.0 L", city: "Bakı", description: "xDrive35i, su nasosu yenidir.", daysAgo: 5 },
];

export function seedListings(): Listing[] {
  const now = Date.now();
  return raw.map(({ daysAgo, ...l }, i) => {
    const id = `seed-${i + 1}`;
    const ph = PHOTOS[id];
    return {
    ...l,
    ...(ph ? { color: ph.color, colorName: ph.colorName, photoCredit: ph.credit } : {}),
    id,
    photos: ph ? ph.photos : [],
    status: "active",
    sellerName: names[i % names.length],
    phone: `+994 50 ${String(200 + i * 37).padStart(3, "0")} ${String(10 + i * 7).padStart(2, "0")} ${String(30 + i).padStart(2, "0")}`,
    createdAt: new Date(now - daysAgo * 86400000 - i * 3600000).toISOString(),
    priceHistory: seedPriceHistory(i, daysAgo, l.price, now),
    } satisfies Listing;
  });
}

/** Some demo sellers already lowered their price once or twice */
function seedPriceHistory(i: number, daysAgo: number, price: number, now: number) {
  const at = (days: number) => new Date(now - days * 86400000 - i * 3600000).toISOString();
  if (daysAgo >= 4 && i % 3 === 1)
    return [
      { date: at(daysAgo), price: Math.round((price * 1.08) / 100) * 100 },
      { date: at(Math.round(daysAgo / 2)), price: Math.round((price * 1.04) / 100) * 100 },
      { date: at(1), price },
    ];
  if (daysAgo >= 2 && i % 4 === 0)
    return [
      { date: at(daysAgo), price: Math.round((price * 1.05) / 100) * 100 },
      { date: at(1), price },
    ];
  return [{ date: at(daysAgo), price }];
}

const dd = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
const dIn = (days: number) => dd(-days);

/** ~every 11 days a full tank (~9.6 L/100 km), newest first */
function demoFuel() {
  return Array.from({ length: 9 }, (_, k) => {
    const liters = [54, 57, 52, 58, 55, 53, 56, 59, 54][k];
    return { id: `f${k + 1}`, date: dd(4 + k * 11), km: 158100 - k * 575, liters, cost: Math.round(liters * 1.5), full: true };
  });
}

export function demoGarageExtras() {
  return {
    mileageUpdatedAt: dd(10),
    fuelLog: demoFuel(),
    documents: [
      { id: "doc-ins", kind: "insurance" as const, title: "İcbari sığorta", issued: dd(345), expires: dIn(20), number: "AA 4817205" },
      { id: "doc-insp", kind: "inspection" as const, title: "Texniki baxış", issued: dd(300), expires: dIn(65) },
      { id: "doc-tax", kind: "tax" as const, title: "Yol vergisi", issued: dd(245), expires: dIn(120) },
    ],
  };
}

const d = (monthsAgo: number) => {
  const x = new Date();
  x.setMonth(x.getMonth() - monthsAgo);
  return x.toISOString().slice(0, 10);
};

export function seedGarage(): GarageCar[] {
  return [
    {
      id: "demo-bmw",
      modelId: "bmw-5-f10",
      year: 2014,
      color: "#1f3d7a",
      colorName: "Göy",
      fuel: "Benzin",
      gearbox: "Avtomat",
      engine: "2.0 L Turbo",
      plate: "90-AB-528",
      mileage: 158400,
      purchasePrice: 34500,
      purchaseDate: d(14),
      purchaseMileage: 139000,
      maintenance: {
        oil: { date: d(5), km: 149200 },
        air_filter: { date: d(10), km: 142000 },
        cabin_filter: { date: d(10), km: 142000 },
        inspection: { date: dd(300), km: 141500 },
        insurance: { date: dd(345), km: 139500 },
        brake_pads: { date: d(8), km: 145000 },
        brake_fluid: { date: d(14), km: 139000 },
        tires: { date: d(7), km: 146000 },
        spark: { date: d(14), km: 139000 },
        coolant: { date: d(14), km: 139000 },
      },
      repairs: [
        { id: "r1", partId: "engine", title: "Yağ filtri korpusu contası", kind: "dəyişmə", date: d(12), km: 141000, cost: 260, note: "Orijinal Elring conta" },
        { id: "r2", partId: "brakes", title: "Ön əyləc bəndləri", kind: "dəyişmə", date: d(8), km: 145000, cost: 140 },
        { id: "r3", partId: "front_bumper", title: "Cızıq cilalanması", kind: "təmir", date: d(6), km: 148000, cost: 90 },
        { id: "r4", partId: "engine", title: "Yağ dəyişimi", kind: "servis", date: d(5), km: 149200, cost: 110 },
        { id: "r5", partId: "suspension", title: "Ön stabilizator dayaqları", kind: "dəyişmə", date: d(3), km: 153000, cost: 120 },
      ],
      ...demoGarageExtras(),
    },
  ];
}
