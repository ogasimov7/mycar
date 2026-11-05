export type Fuel = "Benzin" | "Dizel" | "Hibrid" | "Elektrik" | "Qaz";
export type Gearbox = "Avtomat" | "Mexaniki" | "Robot" | "Variator";

export type PartId =
  | "engine"
  | "transmission"
  | "battery"
  | "exhaust"
  | "suspension"
  | "brakes"
  | "hood"
  | "trunk"
  | "roof"
  | "front_bumper"
  | "rear_bumper"
  | "door_fl"
  | "door_fr"
  | "door_rl"
  | "door_rr"
  | "headlights"
  | "taillights"
  | "glass"
  | "mirrors"
  | "wheels";

export interface ChronicProblem {
  title: string;
  description: string;
  part: PartId;
  severity: "aşağı" | "orta" | "yüksək";
  /** Typical km range when the problem appears */
  atKm?: string;
  costRange: [number, number];
  /** YouTube search query for fix videos */
  video: string;
}

export interface CarModel {
  id: string;
  make: string;
  model: string;
  generation: string;
  years: [number, number];
  /** Approx. new price in AZN, used as depreciation anchor */
  basePrice: number;
  /** Annual depreciation rate (0.08 = 8%/yr) */
  depreciation: number;
  bodyType: "sedan" | "suv" | "hatch" | "van";
  problems: ChronicProblem[];
}

export interface Listing {
  id: string;
  modelId: string;
  year: number;
  price: number;
  mileage: number;
  color: string;
  colorName: string;
  fuel: Fuel;
  gearbox: Gearbox;
  engine: string;
  city: string;
  phone: string;
  sellerName: string;
  description: string;
  photos: string[];
  /** Attribution for photos taken from free-licence sources (e.g. Wikimedia Commons) */
  photoCredit?: { author: string; license: string; url: string };
  createdAt: string;
  status: "active" | "sold";
  /** Every price the listing has had, oldest first (a single entry = never changed) */
  priceHistory?: { date: string; price: number }[];
  /** Set when the listing was published from a virtual garage */
  garageCarId?: string;
  mine?: boolean;
}

export interface MaintenanceRecord {
  date: string;
  km: number;
}

export interface Repair {
  id: string;
  partId: PartId;
  title: string;
  kind: "təmir" | "dəyişmə" | "servis";
  date: string;
  km: number;
  cost: number;
  note?: string;
}

export interface GarageCar {
  id: string;
  modelId: string;
  year: number;
  color: string;
  colorName: string;
  fuel: Fuel;
  gearbox: Gearbox;
  engine: string;
  plate?: string;
  vin?: string;
  mileage: number;
  purchasePrice: number;
  purchaseDate: string;
  purchaseMileage: number;
  maintenance: Record<string, MaintenanceRecord>;
  repairs: Repair[];
  listingId?: string;
  fromListingId?: string;
  documents?: CarDocument[];
  fuelLog?: FuelEntry[];
  /** Last time the owner confirmed the odometer reading */
  mileageUpdatedAt?: string;
}

export type DocKind = "insurance" | "inspection" | "kasko" | "tax" | "license" | "other";

export interface CarDocument {
  id: string;
  kind: DocKind;
  title: string;
  issued?: string;
  expires?: string;
  number?: string;
  /** Compressed photo of the document (data URL) */
  photo?: string;
  note?: string;
}

export interface FuelEntry {
  id: string;
  date: string;
  km: number;
  liters: number;
  cost: number;
  /** Filled to the brim — needed to compute consumption between two full fills */
  full: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  /** URL query string of the filters, e.g. "make=Toyota&yearMin=2015" */
  query: string;
  createdAt: string;
  /** Listing ids the user has already seen for this search */
  seen: string[];
}
