"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, BellOff, BellRing, Clock, FileText, Gauge, Search, Wrench } from "lucide-react";
import { notifyReminders, notifySupported, requestPermission } from "@/lib/notify";
import { buildReminders, type Reminder } from "@/lib/reminders";
import { useHydrated, useStore } from "@/lib/store";
import { toast } from "../Toast";

const KIND_ICON = { maintenance: Wrench, document: FileText, mileage: Gauge, search: Search };
const LEVEL = {
  overdue: { label: "Təcili", cls: "text-bad", Icon: AlertTriangle },
  soon: { label: "Yaxınlaşır", cls: "text-warn", Icon: Clock },
  info: { label: "Məlumat", cls: "text-muted", Icon: BellRing },
};

export function NotificationsView() {
  const hydrated = useHydrated();
  const garage = useStore((s) => s.garage);
  const listings = useStore((s) => s.listings);
  const searches = useStore((s) => s.savedSearches);
  const enabled = useStore((s) => s.notifications);
  const setNotifications = useStore((s) => s.setNotifications);
  const [busy, setBusy] = useState(false);

  if (!hydrated) return <div className="mx-4 mt-6 h-64 animate-pulse rounded-[22px] bg-surface" />;
  const reminders = buildReminders(garage, listings, searches);
  const groups = (["overdue", "soon", "info"] as const).map((lv) => ({ lv, items: reminders.filter((r) => r.level === lv) })).filter((g) => g.items.length);

  const toggle = async () => {
    if (enabled) {
      setNotifications(false);
      return toast("Telefon bildirişləri söndürüldü");
    }
    setBusy(true);
    const perm = await requestPermission();
    setBusy(false);
    if (perm === "unsupported") return toast("Bu brauzer bildirişləri dəstəkləmir");
    if (perm !== "granted") return toast("İcazə verilmədi — brauzer ayarlarından aça bilərsən");
    setNotifications(true);
    const n = await notifyReminders(reminders, true);
    toast(n ? "Bildirişlər açıldı — sınaq bildirişi göndərildi" : "Bildirişlər açıldı");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-2 lg:px-0 lg:pt-6">
      <h1 className="headline-star font-display text-[28px] font-semibold tracking-tight sm:text-[34px]">Bildirişlər</h1>

      <div className="panel-dark mt-5 flex items-center gap-4 px-5 py-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${enabled ? "bg-accent text-accent-ink" : "bg-white/10"}`}>
          {enabled ? <BellRing size={20} /> : <BellOff size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold">Telefon bildirişləri</div>
          <div className="text-[12px] text-white/60">
            Yağ, sığorta, texniki baxış və yadda saxlanmış axtarışlar üzrə xəbərdarlıq.
            {notifySupported() ? "" : " Bu brauzer dəstəkləmir."}
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          role="switch"
          aria-checked={enabled}
          aria-label="Telefon bildirişləri"
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-accent" : "bg-white/20"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>
      <p className="mt-2 px-1 text-[11px] leading-relaxed text-muted">
        iPhone-da bildiriş üçün saytı əvvəlcə “Ana ekrana əlavə et” ilə tətbiq kimi quraşdır. Hələlik server olmadığı üçün bildirişlər tətbiqi açanda göndərilir.
      </p>

      {!reminders.length && (
        <div className="mt-6 rounded-[22px] bg-surface p-8 text-center text-sm text-muted">Hər şey qaydasındadır — yaxın vaxtda heç nə gözləmir. ✓</div>
      )}

      {groups.map(({ lv, items }) => (
        <section key={lv} className="mt-6">
          <div className={`mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] ${LEVEL[lv].cls}`}>
            {(() => {
              const I = LEVEL[lv].Icon;
              return <I size={14} />;
            })()}
            {LEVEL[lv].label} · {items.length}
          </div>
          <ul className="space-y-2">
            {items.map((r) => (
              <ReminderRow key={r.id} r={r} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function ReminderRow({ r }: { r: Reminder }) {
  const Icon = KIND_ICON[r.kind];
  return (
    <li>
      <Link href={r.href} className="flex items-center gap-3 rounded-[18px] bg-surface p-3.5 transition hover:bg-white">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${r.level === "overdue" ? "bg-bad/12 text-bad" : r.level === "soon" ? "bg-warn/15 text-warn" : "bg-surface-2"}`}
        >
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{r.title}</span>
          <span className="block truncate text-[12px] text-muted">{r.detail}</span>
        </span>
      </Link>
    </li>
  );
}
