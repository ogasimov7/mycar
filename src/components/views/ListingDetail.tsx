"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, Flag, RotateCcw, Heart, MessageCircle, Phone, Share2, ShieldCheck, Trash2, TrendingDown, Wrench } from "lucide-react";
import { generationInfo, getModel } from "@/lib/data/models";
import { partName } from "@/lib/data/parts";
import { ago, azn, date, km } from "@/lib/format";
import { healthScore } from "@/lib/maintenance";
import { marketEstimate } from "@/lib/pricing";
import { useHydrated, useStore } from "@/lib/store";
import { CarCard, CompareButton, ListingPhoto, Price, priceDrop } from "../CarCard";
import { CreditCalculator } from "../market/CreditCalculator";
import { toast } from "../Toast";
import { useAuthAction } from "@/lib/useAuthAction";
import type { Listing } from "@/lib/types";
import { AmberButton, OverviewCard } from "../market/OverviewCard";
import { ProblemCard } from "../ProblemList";
import { Sheet } from "../Sheet";

const TABS = ["Ümumi", "Xüsusiyyətlər", "Problemlər", "Satıcı"] as const;
type Tab = (typeof TABS)[number];

export function ListingDetail({ id }: { id: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const listing = useStore((s) => s.listings.find((l) => l.id === id));
  const listings = useStore((s) => s.listings);
  const garageCar = useStore((s) => s.garage.find((c) => c.id === listing?.garageCarId));
  const fav = useStore((s) => s.favorites.includes(id));
  const listingsLoaded = useStore((s) => s.listingsLoaded);
  const { toggleFavorite, buyListing, removeListing, updateListing } = useStore.getState();
  const { run, busy } = useAuthAction();
  const [buyOpen, setBuyOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("Ümumi");
  const [creditOpen, setCreditOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const reported = useStore((s) => s.reports.some((r) => r.listingId === id));

  if (!hydrated || (!listing && !listingsLoaded)) return <div className="mx-4 mt-4 h-[60dvh] animate-pulse rounded-[28px] bg-surface" />;
  if (!listing)
    return (
      <div className="p-8 text-center">
        <p className="text-muted">Elan tapılmadı.</p>
        <Link href="/elanlar" className="btn btn-primary mt-4">
          Elanlara qayıt
        </Link>
      </div>
    );

  const m = getModel(listing.modelId)!;
  const gen = generationInfo(listing.modelId, listing.year);
  const est = marketEstimate(listing.modelId, listing.year, listing.mileage, listings, listing.id);
  const diff = (listing.price - est.value) / est.value;
  const diffTone = diff <= -0.03 ? "text-ok" : diff >= 0.05 ? "text-bad" : "text-warn";
  const canBuy = listing.status === "active" && !listing.mine;
  const drop = priceDrop(listing);
  const similar = similarListings(listing, listings);
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - est.low) / Math.max(1, est.high - est.low)) * 100))}%`;
  const share = async () => {
    const url = window.location.href;
    const title = `${m.make} ${m.model} ${listing.year} — ${azn(listing.price)}`;
    try {
      if (navigator.share) return await navigator.share({ title, url });
      await navigator.clipboard.writeText(url);
      toast("Link kopyalandı");
    } catch {
      /* share sheet closed */
    }
  };
  const waText = encodeURIComponent(`Salam! MyCar-dakı ${m.make} ${m.model} ${listing.year} (${azn(listing.price)}) elanı ilə bağlı yazıram.`);
  const waHref = `https://wa.me/${listing.phone.replace(/\D/g, "")}?text=${waText}`;

  const cta = canBuy ? (
    <AmberButton onClick={() => setBuyOpen(true)}>Aldım</AmberButton>
  ) : (
    <span className="rounded-2xl bg-white/10 px-5 py-3.5 text-sm text-muted">{listing.status === "sold" ? "Satılıb" : "Sizin elan"}</span>
  );

  const specs: [string, string][] = [
    ["Buraxılış ili", String(listing.year)],
    ["Nəsil", gen.name],
    ["Yürüş", km(listing.mileage)],
    ["Mühərrik", listing.engine],
    ["Yanacaq", listing.fuel],
    ["Sürətlər qutusu", listing.gearbox],
    ["Rəng", listing.colorName],
    ["Şəhər", listing.city],
  ];

  return (
    <div className="pb-10 lg:grid lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start lg:gap-7 lg:pt-6">
      <div className="min-w-0">
        {/* hero */}
        <div className="rounded-b-[32px] bg-white px-5 pb-6 pt-4 lg:rounded-[28px]">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="-ml-2 grid h-10 w-10 place-items-center" aria-label="Geri">
              <ChevronLeft size={24} strokeWidth={1.8} />
            </button>
            <div className="flex items-center gap-2">
              <button onClick={share} className="grid h-10 w-10 place-items-center rounded-full bg-surface-2" aria-label="Paylaş">
                <Share2 size={17} strokeWidth={1.8} />
              </button>
              <CompareButton id={id} className="h-10 w-10 !bg-surface-2 aria-pressed:!bg-dark" />
              <button onClick={() => toggleFavorite(id)} className="grid h-10 w-10 place-items-center rounded-full bg-surface-2" aria-label="Seçilmiş">
                <Heart size={18} strokeWidth={1.8} className={fav ? "fill-bad text-bad" : ""} />
              </button>
            </div>
          </div>
          <div className="mt-2 aspect-[16/10] overflow-hidden rounded-[22px]">
            <ListingPhoto listing={listing} />
          </div>
          <div className="mt-5 flex items-baseline justify-between gap-3">
            <h1 className="min-w-0 font-display text-[22px] font-semibold leading-tight sm:text-[26px]">
              {m.make} {m.model}
            </h1>
            <Price value={listing.price} className="shrink-0 text-[19px]" />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
            <span>
              {listing.year} · {gen.name} · {listing.city} · {ago(listing.createdAt)}
            </span>
            {drop && (
              <span className="flex items-center gap-1 font-semibold text-ok">
                <TrendingDown size={13} /> {drop.times} dəfə endirilib · əvvəl {azn(drop.from)}
              </span>
            )}
            <span className={`font-semibold ${diffTone}`}>
              {Math.abs(diff) < 0.03 ? "Bazar qiymətinə uyğun" : diff < 0 ? `Bazardan ~${Math.round(-diff * 100)}% ucuz` : `Bazardan ~${Math.round(diff * 100)}% baha`}
            </span>
          </div>
          {listing.photoCredit && (
            <a href={listing.photoCredit.url} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-[10px] text-muted/80 hover:underline">
              Foto: {listing.photoCredit.author} · {listing.photoCredit.license} · Wikimedia Commons
            </a>
          )}

          {/* tabs */}
          <div className="-mx-5 mt-5 flex gap-6 border-b border-line px-5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-px shrink-0 border-b-2 pb-2.5 text-[13px] transition ${tab === t ? "border-accent font-semibold text-text" : "border-transparent text-muted"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="pt-4 text-[14px]">
            {tab === "Ümumi" && (
              <div className="space-y-4">
                {listing.description ? <p className="whitespace-pre-line leading-relaxed text-text/85">{listing.description}</p> : <p className="text-muted">Satıcı təsvir əlavə etməyib.</p>}
                {garageCar && (
                  <div className="rounded-2xl bg-surface-2 p-4">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldCheck size={17} className="text-accent" /> MyCar qarajından servis tarixçəsi
                    </div>
                    <div className="mt-2 text-[12px] text-muted">
                      Baxış balı {healthScore(garageCar)}/100 · {garageCar.repairs.length} qeyd · sahibkarda {km(garageCar.mileage - garageCar.purchaseMileage)}
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {garageCar.repairs.slice(0, 4).map((r) => (
                        <li key={r.id} className="flex items-center gap-2 text-[13px]">
                          <Wrench size={13} className="shrink-0 text-muted" />
                          <span className="flex-1 truncate">
                            {r.title} <span className="text-muted">· {partName(r.partId)}</span>
                          </span>
                          <span className="text-[11px] text-muted">{date(r.date)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rounded-2xl bg-surface-2 p-4 text-[13px]">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-muted">Təxmini bazar qiyməti</span>
                    <b>{azn(Math.round(est.value / 100) * 100)}</b>
                  </div>
                  {/* likely band; the dark tick is this listing's price */}
                  <div className="relative mt-4 h-2 rounded-full bg-gradient-to-r from-ok/70 via-warn/60 to-bad/70">
                    <span className="absolute -top-1.5 h-5 w-1.5 -translate-x-1/2 rounded bg-dark ring-2 ring-surface-2" style={{ left: pos(listing.price) }} title="Bu elan" />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-muted">
                    <span>{azn(Math.round(est.low / 100) * 100)}</span>
                    <span>{azn(Math.round(est.high / 100) * 100)}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-muted">
                    Etibarlılıq: <b className="text-text">{est.confidence}</b> ·{" "}
                    {est.comparables.length + est.sold ? `${est.comparables.length} oxşar elan${est.sold ? `, ${est.sold} satılmış` : ""} + amortizasiya modeli` : "yalnız amortizasiya modeli"}
                  </div>
                </div>
                {(listing.priceHistory?.length ?? 0) > 1 && (
                  <div>
                    <div className="label">Qiymət tarixçəsi</div>
                    <ol className="space-y-1.5">
                      {listing.priceHistory!.map((p, i, arr) => {
                        const prev = arr[i - 1]?.price;
                        return (
                          <li key={p.date + i} className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-[13px]">
                            <span className="text-muted">{i === 0 ? "Yerləşdirildi" : "Dəyişdi"} · {date(p.date)}</span>
                            <span className="flex items-center gap-2">
                              {prev !== undefined && (
                                <span className={`text-[11px] font-semibold ${p.price < prev ? "text-ok" : "text-bad"}`}>
                                  {p.price < prev ? "−" : "+"}
                                  {azn(Math.abs(p.price - prev))}
                                </span>
                              )}
                              <b>{azn(p.price)}</b>
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {tab === "Xüsusiyyətlər" && (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                {specs.map(([k, v]) => (
                  <div key={k} className="border-b border-line pb-2.5">
                    <dt className="text-[12px] text-muted">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {tab === "Problemlər" && (
              <div className="space-y-3">
                <p className="text-[12px] text-muted">{gen.name} nəslinin xroniki problemləri — almadan əvvəl ustaya yoxlatdırın.</p>
                {gen.problems.map((p) => (
                  <ProblemCard key={p.title} p={p} compact />
                ))}
              </div>
            )}

            {tab === "Satıcı" && (
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#f7d08a] to-[#e9a23b] font-semibold text-accent-ink">{listing.sellerName[0]}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{listing.sellerName}</div>
                  <div className="text-[12px] text-muted">{listing.phone}</div>
                </div>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !rounded-2xl !px-3.5 !py-3 !text-sm" aria-label="WhatsApp-da yaz">
                  <MessageCircle size={16} /> <span className="max-sm:hidden">WhatsApp</span>
                </a>
                <a href={`tel:${listing.phone.replace(/\s/g, "")}`} className="btn btn-dark !rounded-2xl !px-4 !py-3 !text-sm">
                  <Phone size={15} /> Zəng et
                </a>
              </div>
            )}

            {!listing.mine && (
              <button
                onClick={() => (reported ? toast("Şikayətin artıq göndərilib") : setReportOpen(true))}
                className="mt-5 flex items-center gap-1.5 text-[12px] text-muted hover:text-bad"
              >
                <Flag size={13} /> {reported ? "Şikayət göndərilib" : "Elandan şikayət et"}
              </button>
            )}

            {listing.mine && (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await updateListing(listing.id, { status: listing.status === "sold" ? "active" : "sold" });
                      toast(listing.status === "sold" ? "Elan yenidən satışdadır" : "Elan “satılıb” kimi qeyd olundu");
                    })
                  }
                  className="btn btn-dark !text-sm"
                >
                  {listing.status === "sold" ? <RotateCcw size={16} /> : <CheckCircle2 size={16} />}
                  {listing.status === "sold" ? "Yenidən sat" : "Satıldı"}
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await removeListing(listing.id);
                      router.push("/elanlar");
                    })
                  }
                  className="btn btn-ghost !text-sm !text-bad"
                >
                  <Trash2 size={16} /> Elanı sil
                </button>
              </div>
            )}
          </div>
        </div>

        {/* dark overview — mobile */}
        <div className="px-3 pt-3 lg:hidden">
          <OverviewCard listing={listing} market={est.value} cta={cta} onCredit={() => setCreditOpen(true)} />
        </div>

        {similar.length > 0 && (
          <section className="mt-7 px-4 lg:px-0">
            <h2 className="font-display text-[18px] font-semibold">Oxşar elanlar</h2>
            <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
              {similar.map((l) => (
                <div key={l.id} className="w-[78vw] max-w-[300px] shrink-0 snap-start lg:w-auto lg:max-w-none">
                  <CarCard listing={l} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* dark overview — desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-[88px]">
          <OverviewCard listing={listing} market={est.value} cta={cta} onCredit={() => setCreditOpen(true)} />
        </div>
      </aside>

      <CreditCalculator open={creditOpen} onClose={() => setCreditOpen(false)} price={listing.price} />
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} listingId={listing.id} />

      <Sheet
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        title="Təbriklər! 🎉"
        footer={
          <button
            className="btn btn-primary w-full"
            onClick={() => {
              const carId = buyListing(listing.id);
              if (carId) router.push(`/qaraj/${carId}`);
            }}
          >
            Qaraja əlavə et
          </button>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          {m.make} {m.model} virtual qarajına əlavə olunacaq. Alış qiyməti <b className="text-text">{azn(listing.price)}</b>, yürüş <b className="text-text">{km(listing.mileage)}</b> kimi
          qeyd ediləcək. Satıcı razılaşmadan sonra elanı “satılıb” kimi bağlayacaq.
        </p>
      </Sheet>
    </div>
  );
}

/** Same model first, then same body type in a similar price band */
function similarListings(l: Listing, all: Listing[]) {
  const body = getModel(l.modelId)?.bodyType;
  return all
    .filter((x) => x.id !== l.id && x.status === "active")
    .map((x) => {
      const sameModel = x.modelId === l.modelId;
      const priceGap = Math.abs(x.price - l.price) / l.price;
      const ok = sameModel || (getModel(x.modelId)?.bodyType === body && priceGap <= 0.3);
      return { x, ok, score: (sameModel ? 0 : 1) + priceGap };
    })
    .filter((r) => r.ok)
    .sort((a, b) => a.score - b.score)
    .slice(0, 6)
    .map((r) => r.x);
}

const REASONS = ["Maşın artıq satılıb", "Qiymət və ya məlumat yanlışdır", "Şəkillər başqa maşındır", "Fırıldaqçılıq şübhəsi", "Digər"];

function ReportSheet({ open, onClose, listingId }: { open: boolean; onClose: () => void; listingId: string }) {
  const reportListing = useStore((s) => s.reportListing);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Elandan şikayət"
      footer={
        <button
          className="btn btn-dark w-full"
          disabled={!reason}
          onClick={() => {
            if (!reason) return;
            reportListing({ listingId, reason, note: note.trim() || undefined });
            onClose();
            toast("Şikayətin qəbul olundu — moderator yoxlayacaq");
          }}
        >
          Göndər
        </button>
      }
    >
      <div className="space-y-2">
        {REASONS.map((r) => (
          <label key={r} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-3 text-sm">
            <input type="radio" name="reason" className="h-4 w-4 accent-[var(--accent)]" checked={reason === r} onChange={() => setReason(r)} />
            {r}
          </label>
        ))}
        <textarea rows={2} className="input mt-2" placeholder="Əlavə qeyd (istəyə bağlı)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Sheet>
  );
}
