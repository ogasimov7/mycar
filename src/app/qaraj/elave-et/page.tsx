"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CarFields, emptyCar, type CarFieldValues } from "@/components/CarFields";
import { todayISO } from "@/lib/format";
import { useHydrated, useStore } from "@/lib/store";

export default function Page() {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="mx-auto mt-4 h-96 max-w-xl animate-pulse rounded-3xl bg-surface" />;
  return <AddCarForm />;
}

function AddCarForm() {
  const router = useRouter();
  const addCar = useStore((s) => s.addCar);
  const [car, setCar] = useState<CarFieldValues>(emptyCar);
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayISO);
  const [plate, setPlate] = useState("");
  const [oilKm, setOilKm] = useState("");
  const [oilDate, setOilDate] = useState("");
  const [inspDate, setInspDate] = useState("");
  const [insDate, setInsDate] = useState("");

  return (
    <form
      className="mx-auto max-w-xl px-4 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!car.modelId || !car.year || !car.mileage) return;
        const mileage = +car.mileage;
        const maintenance: Record<string, { date: string; km: number }> = {};
        if (oilDate || oilKm) maintenance.oil = { date: oilDate || todayISO(), km: oilKm ? +oilKm : mileage };
        if (inspDate) maintenance.inspection = { date: inspDate, km: mileage };
        if (insDate) maintenance.insurance = { date: insDate, km: mileage };
        const id = addCar({
          modelId: car.modelId,
          year: +car.year,
          color: car.color,
          colorName: car.colorName,
          fuel: car.fuel,
          gearbox: car.gearbox,
          engine: car.engine || "—",
          plate: plate || undefined,
          mileage,
          purchasePrice: +price || 0,
          purchaseDate,
          purchaseMileage: mileage,
          maintenance,
          repairs: [],
        });
        router.push(`/qaraj/${id}`);
      }}
    >
      <h1 className="font-display text-2xl font-bold">Maşınımı qaraja əlavə et</h1>
      <p className="mt-1 text-sm text-muted">Artıq sahib olduğun maşını əlavə et və baxışını izləməyə başla.</p>

      <section className="mt-5">
        <CarFields v={car} set={(p) => setCar((c) => ({ ...c, ...p }))} />
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="price">Alış qiyməti, ₼</label>
          <input id="price" className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} />
        </div>
        <div>
          <label className="label" htmlFor="pdate">Alış tarixi</label>
          <input id="pdate" type="date" className="input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="plate">Dövlət nömrəsi</label>
          <input id="plate" className="input uppercase" placeholder="10-AA-123" value={plate} onChange={(e) => setPlate(e.target.value)} />
        </div>
      </section>

      <h2 className="mt-6 font-display text-lg font-bold">Son baxışlar</h2>
      <p className="text-xs text-muted">Bilmirsənsə boş burax — sonra da əlavə edə bilərsən.</p>
      <section className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="oilKm">Son yağ dəyişimi, km</label>
          <input id="oilKm" className="input" inputMode="numeric" value={oilKm} onChange={(e) => setOilKm(e.target.value.replace(/\D/g, ""))} />
        </div>
        <div>
          <label className="label" htmlFor="oilDate">Yağ — tarix</label>
          <input id="oilDate" type="date" className="input" value={oilDate} onChange={(e) => setOilDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="insp">Texniki baxış</label>
          <input id="insp" type="date" className="input" value={inspDate} onChange={(e) => setInspDate(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="ins">Sığorta</label>
          <input id="ins" type="date" className="input" value={insDate} onChange={(e) => setInsDate(e.target.value)} />
        </div>
      </section>

      <button className="btn btn-primary mt-6 w-full">Qaraja əlavə et</button>
    </form>
  );
}
