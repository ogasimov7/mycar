"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, ShieldCheck, Trash2 } from "lucide-react";
import { getModel } from "@/lib/data/models";
import { CITIES } from "@/lib/data/models";
import { partName } from "@/lib/data/parts";
import { azn } from "@/lib/format";
import { saleAdvice } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { GarageCar } from "@/lib/types";
import { PhotoPicker } from "../../PhotoPicker";
import { Sheet } from "../../Sheet";

export function SellTab({ car }: { car: GarageCar }) {
  const router = useRouter();
  const listings = useStore((s) => s.listings);
  const listing = listings.find((l) => l.id === car.listingId);
  const { listCarForSale, removeListing, removeCar } = useStore.getState();
  const a = saleAdvice(car, listings);
  const m = getModel(car.modelId)!;

  const autoDesc = () => {
    const recent = car.repairs
      .filter((r) => r.kind !== "servis")
      .slice(0, 5)
      .map((r) => `• ${r.title} (${partName(r.partId)}, ${r.date.slice(0, 7)})`)
      .join("\n");
    return `Bütün servis tarixçəsi MyCar qarajında qeydə alınıb.\n${recent ? `\nSon işlər:\n${recent}` : ""}`;
  };

  const [price, setPrice] = useState(String(listing?.price ?? a.suggested));
  const [city, setCity] = useState(listing?.city ?? CITIES[0]);
  const [name, setName] = useState(listing?.sellerName ?? "");
  const [phone, setPhone] = useState(listing?.phone ?? "+994 ");
  const [desc, setDesc] = useState(listing?.description ?? autoDesc());
  const [photos, setPhotos] = useState<string[]>(listing?.photos ?? []);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="space-y-4">
      {listing && (
        <Link href={`/elan/${listing.id}`} className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4">
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-widest text-accent">Satışdadır</div>
            <div className="font-display text-xl font-bold">{azn(listing.price)}</div>
          </div>
          <ExternalLink size={18} className="text-accent" />
        </Link>
      )}

      <div className="rounded-2xl border border-accent-2/30 bg-accent-2/5 p-3 text-sm">
        <div className="flex items-center gap-2 font-bold text-accent-2">
          <ShieldCheck size={16} /> Servis tarixçəsi elanda göstəriləcək
        </div>
        <p className="mt-1 text-xs text-muted">
          {car.repairs.length} qeyd və baxış balı {a.health}/100 alıcıya görünəcək — bu, etibarı və qiyməti artırır.
        </p>
      </div>

      <div>
        <span className="label">Şəkillər</span>
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </div>

      <div>
        <label className="label" htmlFor="sprice">Qiymət, ₼</label>
        <input id="sprice" className="input font-display !text-2xl font-bold" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} />
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            ["Tez satış", a.quickSale],
            ["Məsləhət", a.suggested],
            ["Maksimum", a.maxPrice],
          ].map(([l, v]) => (
            <button key={l} type="button" onClick={() => setPrice(String(v))} className="chip flex-col !gap-0 !rounded-xl !py-2" data-active={+price === v}>
              <span className="text-[10px] opacity-80">{l}</span>
              <span>{azn(v as number)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="scity">Şəhər</label>
          <select id="scity" className="input" value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sname">Adınız</label>
          <input id="sname" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="sphone">Telefon</label>
          <input id="sphone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="sdesc">Təsvir</label>
          <textarea id="sdesc" rows={6} className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
      </div>

      <button
        className="btn btn-primary w-full"
        disabled={!price}
        onClick={() => {
          const id = listCarForSale(car.id, { price: +price, city, phone, sellerName: name || "Satıcı", description: desc, photos });
          router.push(`/elan/${id}`);
        }}
      >
        {listing ? "Elanı yenilə" : `${m.make} ${m.model} satışa qoy`}
      </button>

      {listing && (
        <button className="btn btn-ghost w-full" onClick={() => removeListing(listing.id)}>
          Satışdan çıxar
        </button>
      )}

      <button onClick={() => setConfirm(true)} className="mx-auto flex items-center gap-1.5 pt-4 text-xs font-semibold text-muted">
        <Trash2 size={13} /> Maşın satıldı / qarajdan sil
      </button>

      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Qarajdan silinsin?"
        footer={
          <div className="flex gap-2">
            <button className="btn btn-ghost flex-1" onClick={() => setConfirm(false)}>Xeyr</button>
            <button
              className="btn flex-1 bg-bad text-white"
              onClick={() => {
                removeCar(car.id);
                router.push("/qaraj");
              }}
            >
              Sil
            </button>
          </div>
        }
      >
        <p className="text-sm text-muted">Bütün təmir tarixçəsi və aktiv elan silinəcək. Bu əməliyyat geri qaytarılmır.</p>
      </Sheet>
    </div>
  );
}
