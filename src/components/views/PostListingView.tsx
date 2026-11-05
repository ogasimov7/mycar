"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles, Warehouse } from "lucide-react";
import { CITIES } from "@/lib/data/models";
import { azn } from "@/lib/format";
import { marketEstimate } from "@/lib/pricing";
import { useHydrated, useStore } from "@/lib/store";
import { CarFields, emptyCar, type CarFieldValues } from "../CarFields";
import { PhotoPicker } from "../PhotoPicker";

export function PostListingView() {
  const router = useRouter();
  const hydrated = useHydrated();
  const addListing = useStore((s) => s.addListing);
  const listings = useStore((s) => s.listings);
  const garage = useStore((s) => s.garage);
  const [car, setCar] = useState<CarFieldValues>(emptyCar);
  const [price, setPrice] = useState("");
  const [city, setCity] = useState(CITIES[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+994 ");
  const [desc, setDesc] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");

  const est =
    car.modelId && car.year && car.mileage ? marketEstimate(car.modelId, +car.year, +car.mileage, listings).value : null;

  return (
    <form
      className="mx-auto max-w-xl px-4 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!car.modelId || !car.year || !car.mileage || !price) return setError("Marka, model, il, yürüş və qiyməti doldurun.");
        try {
          const id = addListing({
            modelId: car.modelId,
            year: +car.year,
            mileage: +car.mileage,
            color: car.color,
            colorName: car.colorName,
            fuel: car.fuel,
            gearbox: car.gearbox,
            engine: car.engine || "—",
            price: +price,
            city,
            phone,
            sellerName: name || "Satıcı",
            description: desc,
            photos,
            mine: true,
          });
          router.push(`/elan/${id}`);
        } catch {
          setError("Yaddaş doldu — şəkillərin sayını azaldın.");
        }
      }}
    >
      <h1 className="font-display text-2xl font-bold">Elan yerləşdir</h1>

      {hydrated && garage.length > 0 && (
        <Link href="/qaraj" className="mt-3 flex items-center gap-3 rounded-2xl border border-accent-2/40 bg-accent-2/5 p-3 text-sm">
          <Warehouse size={20} className="shrink-0 text-accent-2" />
          <span>
            Maşının qarajdadırsa, <b>qarajdan sat</b> — servis tarixçəsi elanda görünəcək və alıcı daha çox güvənəcək.
          </span>
        </Link>
      )}

      <section className="mt-5">
        <span className="label">Şəkillər</span>
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </section>

      <section className="mt-5">
        <CarFields v={car} set={(p) => setCar((c) => ({ ...c, ...p }))} />
      </section>

      <section className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="price">Qiymət, ₼</label>
          <input
            id="price"
            className="input font-display !text-xl font-bold"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
          />
          {est && (
            <button
              type="button"
              onClick={() => setPrice(String(Math.round(est / 100) * 100))}
              className="mt-2 flex w-full items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-left text-xs"
            >
              <Sparkles size={14} className="text-accent" />
              <span className="flex-1">
                Təxmini bazar qiyməti: <b>{azn(est)}</b>
              </span>
              <span className="font-semibold text-accent">Tətbiq et</span>
            </button>
          )}
        </div>
        <div>
          <label className="label" htmlFor="city">Şəhər</label>
          <select id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="name">Adınız</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="phone">Telefon</label>
            <input id="phone" className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="desc">Təsvir</label>
          <textarea id="desc" rows={4} className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Vəziyyəti, rənglənmiş detallar, əlavə avadanlıq…" />
        </div>
      </section>

      {error && <p className="mt-4 text-sm font-semibold text-bad">{error}</p>}
      <button className="btn btn-primary mt-6 w-full">Elanı yerləşdir</button>
    </form>
  );
}
