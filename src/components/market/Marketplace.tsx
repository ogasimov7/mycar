"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, ChevronDown, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { CITIES, COLORS, MAKES } from "@/lib/data/models";
import {
  activeChips,
  BODIES,
  describeFilters,
  EMPTY_FILTERS,
  FUELS,
  GEARBOXES,
  hasFilters,
  parseFilters,
  search,
  serializeFilters,
  SORTS,
  type Filters,
  type Sort,
} from "@/lib/search";
import { useHydrated, useStore } from "@/lib/store";
import { CarCard, CardSkeleton } from "../CarCard";
import { Sheet } from "../Sheet";
import { toast } from "../Toast";

export function Marketplace({ title = "Maşınını tap" }: { title?: string }) {
  const hydrated = useHydrated();
  if (!hydrated)
    return (
      <div className="grid gap-4 px-4 pt-32 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  return <MarketplaceInner title={title} />;
}

const digits = (v: string) => v.replace(/\D/g, "");

function MarketplaceInner({ title }: { title: string }) {
  const listings = useStore((s) => s.listings);
  const savedSearches = useStore((s) => s.savedSearches);
  const { saveSearch, removeSearch, markSearchSeen } = useStore.getState();
  // filters live in the URL, so a search can be shared, bookmarked and survives a reload
  const [init] = useState(() => parseFilters(new URLSearchParams(window.location.search)));
  const [f, setF] = useState<Filters>(init.filters);
  const [sort, setSort] = useState<Sort>(init.sort);
  const [open, setOpen] = useState(false);
  const set = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }));

  const query = serializeFilters(f, sort);
  const filterQuery = serializeFilters(f);
  const result = useMemo(() => search(listings, f, sort), [listings, f, sort]);
  const saved = savedSearches.find((s) => s.query === filterQuery);
  const chips = activeChips(f);

  useEffect(() => {
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(window.history.state, "", url);
  }, [query]);

  // opening a saved search marks its current results as seen
  const resultIds = result.map((l) => l.id).join(",");
  useEffect(() => {
    if (!saved) return;
    const ids = resultIds ? resultIds.split(",") : [];
    if (ids.some((id) => !saved.seen.includes(id))) markSearchSeen(saved.id, ids);
  }, [saved, resultIds, markSearchSeen]);

  const toggleSaved = () => {
    if (saved) {
      removeSearch(saved.id);
      toast("Axtarış silindi");
    } else {
      saveSearch(describeFilters(f), filterQuery, result.map((l) => l.id));
      toast("Yadda saxlandı — yeni elan çıxanda xəbər verəcəyik");
    }
  };

  return (
    <div className="px-4 lg:px-0">
      <div className="min-w-0 pt-2 lg:pt-6">
        <h1 className="headline-star font-display text-[30px] font-semibold tracking-tight sm:text-[40px]">{title}</h1>

        {/* search box: query | location | ● */}
        <div className="mt-5 flex gap-3">
          <form onSubmit={(e) => e.preventDefault()} className="outline-ctl flex h-[58px] min-w-0 flex-1 items-center rounded-2xl pl-5 pr-2 max-sm:border-transparent max-sm:bg-surface">
            <input
              value={f.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Marka və ya model"
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
              enterKeyHint="search"
              aria-label="Axtarış"
            />
            <span className="mx-4 hidden h-7 w-px bg-line sm:block" />
            <label className="relative hidden min-w-0 flex-1 items-center gap-2 text-[14px] text-muted sm:flex">
              <MapPin size={18} strokeWidth={1.7} className="shrink-0" />
              <select value={f.city ?? ""} onChange={(e) => set({ city: e.target.value || null })} className="min-w-0 flex-1 appearance-none bg-transparent outline-none" aria-label="Şəhər">
                <option value="">Şəhər</option>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <button className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-dark text-white" aria-label="Axtar">
              <Search size={18} />
            </button>
          </form>
          <button onClick={() => setOpen(true)} className="outline-ctl relative grid h-[58px] w-[58px] shrink-0 place-items-center rounded-2xl max-sm:border-transparent max-sm:bg-surface" aria-label="Filtrlər">
            <SlidersHorizontal size={21} strokeWidth={1.7} />
            {chips.length > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-ink">{chips.length}</span>
            )}
          </button>
        </div>

        {/* filter chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.length
            ? chips.map((c) => (
                <button key={c.label} onClick={() => set(Object.fromEntries(c.keys.map((k) => [k, EMPTY_FILTERS[k]])))} className="chip-outline">
                  {c.label} <X size={15} strokeWidth={1.8} />
                </button>
              ))
            : (["Marka", "Qiymət", "Kuzov", "Yürüş"] as const).map((l) => (
                <button key={l} onClick={() => setOpen(true)} className="chip-outline text-muted">
                  {l} <ChevronDown size={15} strokeWidth={1.8} />
                </button>
              ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 text-[14px]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-medium">{result.length} maşın satışda</span>
            {hasFilters(f) && (
              <button
                onClick={toggleSaved}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${saved ? "bg-dark text-white" : "bg-surface hover:bg-white"}`}
                aria-pressed={!!saved}
              >
                {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                <span className="max-sm:hidden">{saved ? "Yadda saxlanıb" : "Axtarışı yadda saxla"}</span>
                <span className="sm:hidden">{saved ? "Saxlanıb" : "Saxla"}</span>
              </button>
            )}
          </div>
          <label className="relative flex shrink-0 items-center text-muted">
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="appearance-none bg-transparent pr-5 outline-none" aria-label="Sıralama">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-0" />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-3">
          {result.map((l) => (
            <CarCard key={l.id} listing={l} />
          ))}
        </div>
        {!result.length && (
          <div className="mt-6 rounded-[22px] bg-surface p-8 text-center text-sm text-muted">
            Bu filtrlərə uyğun maşın tapılmadı.
            {hasFilters(f) && !saved && (
              <button onClick={toggleSaved} className="mx-auto mt-3 flex items-center gap-1.5 font-semibold text-text underline-offset-2 hover:underline">
                <Bookmark size={14} /> Axtarışı saxla, uyğun elan çıxanda xəbər verək
              </button>
            )}
          </div>
        )}
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filtrlər"
        footer={
          <div className="flex gap-2">
            <button className="btn btn-ghost flex-1" onClick={() => setF({ ...EMPTY_FILTERS, q: f.q })}>
              Sıfırla
            </button>
            <button className="btn btn-dark flex-[2]" onClick={() => setOpen(false)}>
              {result.length} maşını göstər
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <ChipGroup label="Marka" items={MAKES.map((x) => ({ id: x, label: x }))} value={f.make} onChange={(make) => set({ make })} />
          <ChipGroup label="Kuzov" items={BODIES} value={f.body} onChange={(body) => set({ body })} />
          <div>
            <span className="label">Qiymət, ₼</span>
            <div className="grid grid-cols-2 gap-2">
              <input className="input" inputMode="numeric" placeholder="min." value={f.priceMin} onChange={(e) => set({ priceMin: digits(e.target.value) })} aria-label="Minimum qiymət" />
              <input className="input" inputMode="numeric" placeholder="maks." value={f.priceMax} onChange={(e) => set({ priceMax: digits(e.target.value) })} aria-label="Maksimum qiymət" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="label">İl, ən azı</span>
              <input className="input" inputMode="numeric" placeholder="məs. 2015" value={f.yearMin} onChange={(e) => set({ yearMin: digits(e.target.value) })} />
            </div>
            <div>
              <span className="label">Yürüş, ən çox (km)</span>
              <input className="input" inputMode="numeric" placeholder="məs. 150000" value={f.mileageMax} onChange={(e) => set({ mileageMax: digits(e.target.value) })} />
            </div>
          </div>
          <ChipGroup label="Sürətlər qutusu" items={GEARBOXES.map((x) => ({ id: x, label: x }))} value={f.gearbox} onChange={(gearbox) => set({ gearbox })} />
          <ChipGroup label="Yanacaq" items={FUELS.map((x) => ({ id: x, label: x }))} value={f.fuel} onChange={(fuel) => set({ fuel })} />
          <div>
            <span className="label">Rəng</span>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c.name} className="chip" data-active={f.color === c.name} onClick={() => set({ color: f.color === c.name ? null : c.name })}>
                  <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/15" style={{ background: c.hex }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <ChipGroup label="Şəhər" items={CITIES.map((x) => ({ id: x, label: x }))} value={f.city} onChange={(city) => set({ city })} />
        </div>
      </Sheet>
    </div>
  );
}

function ChipGroup<T extends string>({ label, items, value, onChange }: { label: string; items: { id: T; label: string }[]; value: T | null; onChange: (v: T | null) => void }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map((x) => (
          <button key={x.id} className="chip" data-active={value === x.id} onClick={() => onChange(value === x.id ? null : x.id)}>
            {x.label}
          </button>
        ))}
      </div>
    </div>
  );
}
