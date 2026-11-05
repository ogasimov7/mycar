"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CarFront, CirclePlus, Heart, House } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Əsas", icon: House },
  { href: "/elanlar", label: "Elanlar", icon: CarFront },
  { href: "/qaraj", label: "Qaraj və baxış cədvəli", icon: CalendarDays },
  { href: "/secilmisler", label: "Seçilmişlər", icon: Heart },
  { href: "/elan-yerlesdir", label: "Elan ver", icon: CirclePlus },
];

/** Desktop-only column of white rounded-square icon buttons */
export function Sidebar() {
  const path = usePathname();
  if (/^\/qaraj\/[^/]+$/.test(path) && path !== "/qaraj/elave-et") return null;
  return (
    <aside className="fixed left-6 top-[150px] z-20 hidden lg:block">
      <nav className="flex flex-col gap-3">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={`group relative grid h-[52px] w-[52px] place-items-center rounded-2xl transition ${
                active ? "bg-accent text-accent-ink" : "bg-surface text-text hover:bg-white"
              }`}
            >
              <Icon size={21} strokeWidth={1.8} />
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-dark px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
