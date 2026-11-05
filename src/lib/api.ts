"use client";

import { upload } from "@vercel/blob/client";
import type { GarageCar, Listing } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Xəta baş verdi", res.status);
  return data as T;
}

export type NewListing = Omit<Listing, "id" | "createdAt" | "status" | "priceHistory" | "mine" | "photoCredit">;
export type ListingPatch = Partial<Pick<Listing, "price" | "mileage" | "city" | "phone" | "sellerName" | "description" | "photos" | "status">>;

export const api = {
  listings: () => call<{ listings: Listing[] }>("/api/listings", { cache: "no-store" }).then((r) => r.listings),
  createListing: (l: NewListing) => call<{ listing: Listing }>("/api/listings", { method: "POST", body: JSON.stringify(l) }).then((r) => r.listing),
  updateListing: (id: string, patch: ListingPatch) =>
    call<{ listing: Listing }>(`/api/listings/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).then((r) => r.listing),
  deleteListing: (id: string) => call(`/api/listings/${id}`, { method: "DELETE" }),
  garage: () => call<{ cars: GarageCar[] }>("/api/garage", { cache: "no-store" }).then((r) => r.cars),
  saveCar: (car: GarageCar) => call(`/api/garage/${car.id}`, { method: "PUT", body: JSON.stringify({ car }) }),
  deleteCar: (id: string) => call(`/api/garage/${id}`, { method: "DELETE" }),
  report: (r: { listingId: string; reason: string; note?: string }) => call("/api/reports", { method: "POST", body: JSON.stringify(r) }),
};

/** Upload a (compressed) listing photo straight to Vercel Blob; returns its public URL */
export async function uploadPhoto(file: Blob) {
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const res = await upload(`listings/photo.${ext}`, file, { access: "public", handleUploadUrl: "/api/upload", contentType: file.type || "image/jpeg" });
  return res.url;
}

export const dataUrlToBlob = (url: string) => fetch(url).then((r) => r.blob());
