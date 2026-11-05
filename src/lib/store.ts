"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { demoGarageExtras, seedGarage, seedListings } from "./data/seed";
import { uid } from "./format";
import { DOC_KINDS } from "./documents";
import type { CarDocument, FuelEntry, GarageCar, Listing, MaintenanceRecord, Repair, SavedSearch } from "./types";

export interface Report {
  listingId: string;
  reason: string;
  note?: string;
  date: string;
}

const MAX_COMPARE = 3;

interface State {
  listings: Listing[];
  garage: GarageCar[];
  favorites: string[];
  savedSearches: SavedSearch[];
  compare: string[];
  reports: Report[];
  /** Phone notifications for reminders (permission is asked when switched on) */
  notifications: boolean;
  addListing: (l: Omit<Listing, "id" | "createdAt" | "status">) => string;
  updateListing: (id: string, patch: Partial<Listing>) => void;
  removeListing: (id: string) => void;
  toggleFavorite: (id: string) => void;
  buyListing: (listingId: string) => string | undefined;
  addCar: (c: Omit<GarageCar, "id">) => string;
  updateCar: (id: string, patch: Partial<GarageCar>) => void;
  removeCar: (id: string) => void;
  addRepair: (carId: string, r: Omit<Repair, "id">, maintenanceIds?: string[]) => void;
  removeRepair: (carId: string, repairId: string) => void;
  markMaintenance: (carId: string, itemId: string, rec: MaintenanceRecord) => void;
  listCarForSale: (carId: string, data: { price: number; city: string; phone: string; sellerName: string; description: string; photos: string[] }) => string;
  addDocument: (carId: string, d: Omit<CarDocument, "id">) => void;
  updateDocument: (carId: string, docId: string, patch: Partial<CarDocument>) => void;
  removeDocument: (carId: string, docId: string) => void;
  addFuel: (carId: string, f: Omit<FuelEntry, "id">) => void;
  removeFuel: (carId: string, fuelId: string) => void;
  saveSearch: (name: string, query: string, seen: string[]) => string;
  removeSearch: (id: string) => void;
  markSearchSeen: (id: string, seen: string[]) => void;
  toggleCompare: (listingId: string) => boolean;
  clearCompare: () => void;
  reportListing: (r: Omit<Report, "date">) => void;
  setNotifications: (on: boolean) => void;
  reset: () => void;
}

const now = () => new Date().toISOString();
const mapCar = (garage: GarageCar[], id: string, f: (c: GarageCar) => GarageCar) => garage.map((c) => (c.id === id ? f(c) : c));

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      listings: seedListings(),
      garage: seedGarage(),
      favorites: [],
      savedSearches: [],
      compare: [],
      reports: [],
      notifications: false,

      addListing: (l) => {
        const id = uid();
        const createdAt = now();
        set((s) => ({ listings: [{ ...l, id, createdAt, status: "active", priceHistory: [{ date: createdAt, price: l.price }] }, ...s.listings] }));
        return id;
      },
      updateListing: (id, patch) =>
        set((s) => ({
          listings: s.listings.map((l) => {
            if (l.id !== id) return l;
            const next = { ...l, ...patch };
            if (patch.price !== undefined && patch.price !== l.price) {
              const hist = l.priceHistory?.length ? l.priceHistory : [{ date: l.createdAt, price: l.price }];
              next.priceHistory = [...hist, { date: now(), price: patch.price }];
            }
            return next;
          }),
        })),
      removeListing: (id) =>
        set((s) => ({
          listings: s.listings.filter((l) => l.id !== id),
          compare: s.compare.filter((c) => c !== id),
          garage: s.garage.map((c) => (c.listingId === id ? { ...c, listingId: undefined } : c)),
        })),
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
        })),

      buyListing: (listingId) => {
        const l = get().listings.find((x) => x.id === listingId);
        if (!l) return;
        const today = new Date().toISOString().slice(0, 10);
        const id = get().addCar({
          modelId: l.modelId,
          year: l.year,
          color: l.color,
          colorName: l.colorName,
          fuel: l.fuel,
          gearbox: l.gearbox,
          engine: l.engine,
          mileage: l.mileage,
          purchasePrice: l.price,
          purchaseDate: today,
          purchaseMileage: l.mileage,
          maintenance: {},
          repairs: [],
          fromListingId: l.id,
          mileageUpdatedAt: today,
        });
        set((s) => ({ listings: s.listings.map((x) => (x.id === listingId ? { ...x, status: "sold" } : x)) }));
        return id;
      },

      addCar: (c) => {
        const id = uid();
        set((s) => ({ garage: [...s.garage, { ...c, id }] }));
        return id;
      },
      updateCar: (id, patch) =>
        set((s) => ({
          garage: mapCar(s.garage, id, (c) => ({ ...c, ...patch, ...(patch.mileage !== undefined ? { mileageUpdatedAt: now() } : {}) })),
        })),
      removeCar: (id) =>
        set((s) => {
          const car = s.garage.find((c) => c.id === id);
          return {
            garage: s.garage.filter((c) => c.id !== id),
            listings: car?.listingId ? s.listings.filter((l) => l.id !== car.listingId) : s.listings,
          };
        }),

      addRepair: (carId, r, maintenanceIds = []) =>
        set((s) => ({
          garage: s.garage.map((c) => {
            if (c.id !== carId) return c;
            const maintenance = { ...c.maintenance };
            for (const m of maintenanceIds) maintenance[m] = { date: r.date, km: r.km };
            return {
              ...c,
              mileage: Math.max(c.mileage, r.km),
              ...(r.km >= c.mileage ? { mileageUpdatedAt: now() } : {}),
              maintenance,
              repairs: [{ ...r, id: uid() }, ...c.repairs].sort((a, b) => b.date.localeCompare(a.date)),
            };
          }),
        })),
      removeRepair: (carId, repairId) =>
        set((s) => ({
          garage: s.garage.map((c) => (c.id === carId ? { ...c, repairs: c.repairs.filter((r) => r.id !== repairId) } : c)),
        })),
      markMaintenance: (carId, itemId, rec) =>
        set((s) => ({
          garage: s.garage.map((c) =>
            c.id === carId
              ? { ...c, mileage: Math.max(c.mileage, rec.km), maintenance: { ...c.maintenance, [itemId]: rec } }
              : c,
          ),
        })),

      listCarForSale: (carId, data) => {
        const car = get().garage.find((c) => c.id === carId)!;
        if (car.listingId) {
          get().updateListing(car.listingId, { ...data, mileage: car.mileage, status: "active" });
          return car.listingId;
        }
        const id = get().addListing({
          modelId: car.modelId,
          year: car.year,
          mileage: car.mileage,
          color: car.color,
          colorName: car.colorName,
          fuel: car.fuel,
          gearbox: car.gearbox,
          engine: car.engine,
          garageCarId: car.id,
          mine: true,
          ...data,
        });
        get().updateCar(carId, { listingId: id });
        return id;
      },

      addDocument: (carId, d) =>
        set((s) => {
          // a new insurance / inspection also resets that line of the maintenance schedule
          const mid = DOC_KINDS.find((k) => k.id === d.kind)?.maintenanceId;
          return {
            garage: mapCar(s.garage, carId, (c) => ({
              ...c,
              documents: [...(c.documents ?? []), { ...d, id: uid() }],
              maintenance: mid && d.issued ? { ...c.maintenance, [mid]: { date: d.issued, km: c.mileage } } : c.maintenance,
            })),
          };
        }),
      updateDocument: (carId, docId, patch) =>
        set((s) => ({
          garage: mapCar(s.garage, carId, (c) => ({ ...c, documents: (c.documents ?? []).map((d) => (d.id === docId ? { ...d, ...patch } : d)) })),
        })),
      removeDocument: (carId, docId) =>
        set((s) => ({ garage: mapCar(s.garage, carId, (c) => ({ ...c, documents: (c.documents ?? []).filter((d) => d.id !== docId) })) })),
      addFuel: (carId, f) =>
        set((s) => ({
          garage: mapCar(s.garage, carId, (c) => ({
            ...c,
            fuelLog: [{ ...f, id: uid() }, ...(c.fuelLog ?? [])].sort((a, b) => b.km - a.km || b.date.localeCompare(a.date)),
            ...(f.km >= c.mileage ? { mileage: f.km, mileageUpdatedAt: now() } : {}),
          })),
        })),
      removeFuel: (carId, fuelId) =>
        set((s) => ({ garage: mapCar(s.garage, carId, (c) => ({ ...c, fuelLog: (c.fuelLog ?? []).filter((f) => f.id !== fuelId) })) })),

      saveSearch: (name, query, seen) => {
        const existing = get().savedSearches.find((x) => x.query === query);
        if (existing) return existing.id;
        const id = uid();
        set((s) => ({ savedSearches: [{ id, name, query, createdAt: now(), seen }, ...s.savedSearches] }));
        return id;
      },
      removeSearch: (id) => set((s) => ({ savedSearches: s.savedSearches.filter((x) => x.id !== id) })),
      markSearchSeen: (id, seen) =>
        set((s) => ({ savedSearches: s.savedSearches.map((x) => (x.id === id ? { ...x, seen: Array.from(new Set([...x.seen, ...seen])) } : x)) })),

      toggleCompare: (listingId) => {
        const c = get().compare;
        if (c.includes(listingId)) {
          set({ compare: c.filter((x) => x !== listingId) });
          return true;
        }
        if (c.length >= MAX_COMPARE) return false;
        set({ compare: [...c, listingId] });
        return true;
      },
      clearCompare: () => set({ compare: [] }),
      reportListing: (r) => set((s) => ({ reports: [...s.reports, { ...r, date: now() }] })),
      setNotifications: (on) => set({ notifications: on }),

      reset: () =>
        set({ listings: seedListings(), garage: seedGarage(), favorites: [], savedSearches: [], compare: [], reports: [], notifications: false }),
    }),
    {
      name: "mycar-store-v1",
      storage: createJSONStorage(() => localStorage),
      version: 8,
      // v2/v3: catalogue grew to turbo.az's top models — sync demo listings without touching user data
      migrate: (persisted, version) => {
        const state = persisted as State;
        if (version < 3 && state?.listings) {
          const seeds = new Map(seedListings().map((l) => [l.id, l]));
          // drop demo listings whose id now points to a different car (stale seed order)
          state.listings = state.listings.filter((l) => !l.id.startsWith("seed-") || seeds.get(l.id)?.modelId === l.modelId);
          const have = new Set(state.listings.map((l) => l.id));
          state.listings = [...state.listings, ...[...seeds.values()].filter((l) => !have.has(l.id))];
        }
        if (version < 4 && state?.listings) {
          // v4: demo listings got real photos (and the colour of the car in the photo)
          const seeds = new Map(seedListings().map((l) => [l.id, l]));
          state.listings = state.listings.map((l) => {
            const s = seeds.get(l.id);
            if (!s || l.photos.length) return l;
            return { ...l, photos: s.photos, photoCredit: s.photoCredit, color: s.color, colorName: s.colorName };
          });
        }
        if (version < 5 && state?.listings) {
          // v5: demo photos became background-free cut-outs (.webp)
          const seeds = new Map(seedListings().map((l) => [l.id, l]));
          state.listings = state.listings.map((l) => {
            const s = seeds.get(l.id);
            if (!s || (l.photos[0] && !l.photos[0].startsWith("/listings/seed-"))) return l;
            return { ...l, photos: s.photos, photoCredit: s.photoCredit, color: s.color, colorName: s.colorName };
          });
        }
        if (version < 6 && state?.listings) {
          // v6: back to real photos (no cut-outs), several photos per demo car
          const seeds = new Map(seedListings().map((l) => [l.id, l]));
          state.listings = state.listings.map((l) => {
            const s = seeds.get(l.id);
            if (!s || (l.photos[0] && !l.photos[0].startsWith("/listings/seed-"))) return l;
            return { ...l, photos: s.photos, photoCredit: s.photoCredit, color: s.color, colorName: s.colorName };
          });
        }
        if (version < 7 && state) {
          // v7: price history, documents, fuel log, saved searches, comparison
          const seeds = new Map(seedListings().map((l) => [l.id, l]));
          state.listings = (state.listings ?? []).map((l) =>
            l.priceHistory?.length ? l : { ...l, priceHistory: seeds.get(l.id)?.priceHistory ?? [{ date: l.createdAt, price: l.price }] },
          );
          state.garage = (state.garage ?? []).map((c) => (c.id === "demo-bmw" && !c.documents ? { ...c, ...demoGarageExtras() } : c));
          state.savedSearches ??= [];
          state.compare ??= [];
          state.reports ??= [];
          state.notifications ??= false;
        }
        if (version < 8 && state?.garage) {
          // v8: an early v7 build stored the fuel log under `fuel` (the fuel type) — move it back
          const demo = seedGarage()[0];
          state.garage = state.garage.map((c) => {
            const raw = (c as unknown as { fuel: unknown }).fuel;
            if (!Array.isArray(raw)) return c;
            return { ...c, fuel: c.id === demo.id ? demo.fuel : "Benzin", fuelLog: c.fuelLog?.length ? c.fuelLog : (raw as GarageCar["fuelLog"]) };
          });
        }
        return state;
      },
    },
  ),
);

/** Avoids SSR/localStorage hydration mismatches: render store-driven UI only after mount. */
const noopSubscribe = () => () => {};
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
