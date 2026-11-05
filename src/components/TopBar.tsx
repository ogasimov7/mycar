"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Bell, CarFront, UserRound } from "lucide-react";
import { buildReminders } from "@/lib/reminders";
import { useHydrated, useStore } from "@/lib/store";

const SEGMENTS = [
  { href: "/elanlar", label: "Al", match: (p: string) => p === "/" || p.startsWith("/elan") && !p.startsWith("/elan-yerlesdir") },
  { href: "/elan-yerlesdir", label: "Sat", match: (p: string) => p.startsWith("/elan-yerlesdir") },
  { href: "/qaraj", label: "Qaraj", match: (p: string) => p.startsWith("/qaraj") },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-display text-[19px] font-medium tracking-tight">
      <CarFront size={24} strokeWidth={2.2} />
      MyCar
    </Link>
  );
}

export function TopBarShell() {
  return (
    <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4">
        <Logo />
      </div>
    </header>
  );
}

function Segmented({ path }: { path: string }) {
  return (
    <nav className="flex rounded-full bg-surface p-1.5">
      {SEGMENTS.map((s) => {
        const active = s.match(path);
        return (
          <Link
            key={s.href}
            href={s.href}
            className={`rounded-full px-5 py-2 text-[14px] font-medium transition ${active ? "bg-dark text-white" : "text-text hover:bg-surface-2"}`}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Alerts() {
  const hydrated = useHydrated();
  const garage = useStore((s) => s.garage);
  const listings = useStore((s) => s.listings);
  const searches = useStore((s) => s.savedSearches);
  const all = hydrated ? buildReminders(garage, listings, searches) : [];
  const urgent = all.some((r) => r.level === "overdue");
  const n = all.filter((r) => r.level !== "info" || r.kind === "search").length;
  return (
    <Link href="/bildirisler" aria-label={`Bildirişlər: ${n}`} className="relative grid h-10 w-10 place-items-center rounded-full bg-surface">
      <Bell size={18} />
      {n > 0 && (
        <span className={`absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-bg ${urgent ? "bg-bad" : "bg-dark"}`}>
          {n}
        </span>
      )}
    </Link>
  );
}

function SignInChip() {
  return (
    <SignInButton mode="modal">
      <button className="flex h-10 items-center gap-2 rounded-full bg-dark pl-1 pr-4 text-[13px] font-medium text-white">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#f7d08a] to-[#e9a23b] text-accent-ink">
          <UserRound size={16} />
        </span>
        Daxil ol
      </button>
    </SignInButton>
  );
}

export function TopBar() {
  const path = usePathname();
  if (/^\/qaraj\/[^/]+$/.test(path) && path !== "/qaraj/elave-et") return null;
  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 md:grid md:grid-cols-[1fr_auto_1fr] lg:px-6">
        <Logo />
        <div className="hidden md:block">
          <Segmented path={path} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Alerts />
          <Show when="signed-in" fallback={<SignInChip />}>
            <UserButton appearance={{ elements: { avatarBox: "h-10 w-10 ring-2 ring-surface" } }} />
          </Show>
        </div>
      </div>
    </header>
  );
}
