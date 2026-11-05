"use client";

import { CAR_MODELS, COLORS, MAKES, generationNames } from "@/lib/data/models";
import type { Fuel, Gearbox } from "@/lib/types";

export interface CarFieldValues {
  make: string;
  modelId: string;
  year: string;
  mileage: string;
  color: string;
  colorName: string;
  fuel: Fuel;
  gearbox: Gearbox;
  engine: string;
}

export const emptyCar: CarFieldValues = {
  make: "",
  modelId: "",
  year: "",
  mileage: "",
  color: COLORS[0].hex,
  colorName: COLORS[0].name,
  fuel: "Benzin",
  gearbox: "Avtomat",
  engine: "",
};

const YEARS = Array.from({ length: 2026 - 1976 + 1 }, (_, i) => 2026 - i);

export function CarFields({ v, set }: { v: CarFieldValues; set: (p: Partial<CarFieldValues>) => void }) {
  const models = CAR_MODELS.filter((m) => m.make === v.make);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="make">Marka</label>
          <select id="make" className="input" value={v.make} onChange={(e) => set({ make: e.target.value, modelId: "" })} required>
            <option value="">Seç</option>
            {MAKES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="model">Model</label>
          <select id="model" className="input" value={v.modelId} onChange={(e) => set({ modelId: e.target.value })} required disabled={!v.make}>
            <option value="">Seç</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.model} ({generationNames(m.id)})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="year">İl</label>
          <select id="year" className="input" value={v.year} onChange={(e) => set({ year: e.target.value })} required>
            <option value="">Seç</option>
            {YEARS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="mileage">Yürüş, km</label>
          <input
            id="mileage"
            className="input"
            inputMode="numeric"
            placeholder="125000"
            value={v.mileage}
            onChange={(e) => set({ mileage: e.target.value.replace(/\D/g, "") })}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="fuel">Yanacaq</label>
          <select id="fuel" className="input" value={v.fuel} onChange={(e) => set({ fuel: e.target.value as Fuel })}>
            {["Benzin", "Dizel", "Hibrid", "Elektrik", "Qaz"].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="gearbox">Qutu</label>
          <select id="gearbox" className="input" value={v.gearbox} onChange={(e) => set({ gearbox: e.target.value as Gearbox })}>
            {["Avtomat", "Mexaniki", "Robot", "Variator"].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="engine">Mühərrik</label>
        <input id="engine" className="input" placeholder="2.0 L" value={v.engine} onChange={(e) => set({ engine: e.target.value })} />
      </div>
      <div>
        <span className="label">Rəng</span>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c.hex}
              aria-label={c.name}
              title={c.name}
              onClick={() => set({ color: c.hex, colorName: c.name })}
              className={`h-9 w-9 rounded-full border-2 transition ${v.color === c.hex ? "scale-110 border-accent" : "border-line"}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
