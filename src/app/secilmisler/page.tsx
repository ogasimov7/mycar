"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, ChevronRight, Heart, Trash2 } from "lucide-react";
import { CarCard } from "@/components/CarCard";
import { ago } from "@/lib/format";
import { newSearchMatches } from "@/lib/reminders";
import { matches, parseFilters } from "@/lib/search";
import { useHydrated, useStore } from "@/lib/store";

export default function Page() {
  const hydrated = useHydrated();
  const listings = useStore((s) => s.listings);
  const favorites = useStore((s) => s.favorites);
  const searches = useStore((s) => s.savedSearches);
  const removeSearch = useStore((s) => s.removeSearch);
  const [tab, setTab] = useState<"cars" | "searches">("cars");
  const items = listings.filter((l) => favorites.includes(l.id));

  return (
    <div className="px-4 pb-10 pt-2 lg:px-0 lg:pt-6">
      <h1 className="headline-star font-display text-[28px] font-semibold tracking-tight sm:text-[34px]">Seçilmişlər</h1>

      <div className="mt-4 inline-flex rounded-full bg-surface p-1.5">
        {(
          [
            ["cars", `Elanlar${hydrated ? ` · ${items.length}` : ""}`],
            ["searches", `Axtarışlar${hydrated ? ` · ${searches.length}` : ""}`],
          ] as const
        ).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${tab === id ? "bg-dark text-white" : ""}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "cars" && (
        <>
          {hydrated && !items.length && (
            <Empty icon={<Heart size={30} className="text-muted" />} text="Bəyəndiyin elanlarda ♥ işarəsinə toxun, burada saxlanacaq." />
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{hydrated && items.map((l) => <CarCard key={l.id} listing={l} />)}</div>
        </>
      )}

      {tab === "searches" && hydrated && (
        <>
          {!searches.length && (
            <Empty
              icon={<Bookmark size={30} className="text-muted" />}
              text="Elanlarda filtr seç və “Axtarışı yadda saxla” düyməsinə bas — uyğun yeni elan çıxanda xəbər verəcəyik."
            />
          )}
          <ul className="mt-4 space-y-2">
            {searches.map((s) => {
              const { filters } = parseFilters(new URLSearchParams(s.query));
              const total = listings.filter((l) => matches(l, filters)).length;
              const fresh = newSearchMatches(s, listings).length;
              return (
                <li key={s.id} className="flex items-center gap-2 rounded-[18px] bg-surface p-2 pl-4">
                  <Link href={`/elanlar?${s.query}`} className="flex min-w-0 flex-1 items-center gap-3 py-1.5">
                    <Bookmark size={18} className="shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">{s.name}</span>
                      <span className="block text-[12px] text-muted">
                        {total} elan · {ago(s.createdAt)} saxlanıb
                      </span>
                    </span>
                    {fresh > 0 && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink">{fresh} yeni</span>}
                    <ChevronRight size={18} className="shrink-0 text-muted" />
                  </Link>
                  <button onClick={() => removeSearch(s.id)} aria-label="Axtarışı sil" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-bad">
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-[22px] bg-surface p-8 text-center">
      {icon}
      <p className="mt-3 max-w-sm text-sm text-muted">{text}</p>
      <Link href="/elanlar" className="btn btn-dark mt-4">
        Elanlara bax
      </Link>
    </div>
  );
}
