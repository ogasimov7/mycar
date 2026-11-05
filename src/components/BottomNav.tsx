"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CarFront, CirclePlus, Heart, House } from "lucide-react";

const items = [
  { href: "/", label: "Əsas", icon: House },
  { href: "/qaraj", label: "Qaraj", icon: CalendarDays },
  { href: "/elanlar", label: "Elanlar", icon: CarFront },
  { href: "/secilmisler", label: "Seçilmişlər", icon: Heart },
  { href: "/elan-yerlesdir", label: "Elan ver", icon: CirclePlus },
];

/** Floating charcoal pill; the active tab is a raised amber circle */
export function BottomNav() {
  const path = usePathname();
  if ((/^\/qaraj\/[^/]+$/.test(path) && path !== "/qaraj/elave-et") || path.startsWith("/elan/")) return null;
  return (
    <nav className="fixed inset-x-6 bottom-4 z-40 mx-auto max-w-sm rounded-full bg-dark px-3 shadow-[0_14px_30px_-12px_rgb(0_0_0/0.5)] safe-bottom lg:hidden">
      <ul className="flex h-[62px] items-center justify-between">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                className={`grid place-items-center rounded-full transition ${active ? "-mt-5 h-[54px] w-[54px] bg-accent text-accent-ink ring-[6px] ring-bg" : "h-11 w-11 text-white/60"}`}
              >
                <Icon size={active ? 22 : 20} strokeWidth={active ? 2.2 : 1.8} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
