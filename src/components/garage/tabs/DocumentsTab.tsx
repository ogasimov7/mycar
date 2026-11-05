"use client";

import { useState } from "react";
import { Camera, FileText, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { addMonths, currentDocs, DOC_KINDS, docLabel, docState, type DocStatus } from "@/lib/documents";
import { date, todayISO } from "@/lib/format";
import { compressImage } from "@/lib/image";
import { useStore } from "@/lib/store";
import type { CarDocument, DocKind, GarageCar } from "@/lib/types";
import { Sheet } from "../../Sheet";
import { toast } from "../../Toast";

const TONE: Record<DocStatus, { cls: string; bar: string }> = {
  expired: { cls: "text-bad", bar: "var(--bad)" },
  soon: { cls: "text-warn", bar: "var(--warn)" },
  ok: { cls: "text-ok", bar: "var(--ok)" },
  none: { cls: "text-muted", bar: "var(--line)" },
};

type Draft = { kind: DocKind; title: string; issued: string; expires: string; number: string; photo?: string; note: string };

const draftFor = (kind: DocKind, prev?: CarDocument): Draft => {
  const months = DOC_KINDS.find((k) => k.id === kind)?.months;
  const issued = todayISO();
  return { kind, title: prev?.title ?? docLabel(kind), issued, expires: months ? addMonths(issued, months) : "", number: prev?.number ?? "", note: "" };
};

export function DocumentsTab({ car }: { car: GarageCar }) {
  const { addDocument, removeDocument } = useStore.getState();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [view, setView] = useState<CarDocument | null>(null);
  const docs = currentDocs(car.documents).sort((a, b) => (a.expires ?? "9999").localeCompare(b.expires ?? "9999"));
  const history = (car.documents ?? []).filter((d) => !docs.includes(d)).sort((a, b) => (b.expires ?? "").localeCompare(a.expires ?? ""));
  const missing = DOC_KINDS.filter((k) => k.id !== "other" && k.id !== "license" && !docs.some((d) => d.kind === k.id));
  const set = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-muted">Bitmə tarixini yaz — 30 gün qalmış xatırladacağıq. Sığorta və texniki baxış baxış cədvəlini də yeniləyir.</p>

      {docs.map((d) => {
        const st = docState(d);
        const tone = TONE[st.status];
        const total = d.issued && d.expires ? (new Date(d.expires).getTime() - new Date(d.issued).getTime()) / 86400000 : 365;
        const left = st.daysLeft ?? 0;
        return (
          <div key={d.id} className="card p-4">
            <div className="flex items-start gap-3">
              <button onClick={() => setView(d)} className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2" aria-label="Sənədə bax">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {d.photo ? <img src={d.photo} alt="" className="h-full w-full object-cover" /> : <FileText size={20} className="text-muted" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{d.kind === "other" ? d.title : docLabel(d.kind)}</div>
                <div className={`mt-0.5 text-xs font-semibold ${tone.cls}`}>
                  {st.status === "none"
                    ? "Müddətsiz"
                    : st.status === "expired"
                      ? `Müddəti ${-left} gün əvvəl bitib`
                      : `${left} gün qalıb · ${date(d.expires!)}`}
                </div>
                {d.number && <div className="mt-0.5 text-[11px] text-muted">№ {d.number}</div>}
              </div>
              {d.kind !== "other" && (
                <button onClick={() => setDraft(draftFor(d.kind, d))} className="flex shrink-0 items-center gap-1 rounded-xl bg-surface-2 px-3 py-2 text-xs font-bold">
                  <RefreshCw size={13} /> Yenilə
                </button>
              )}
            </div>
            {st.status !== "none" && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.min(100, (1 - left / total) * 100))}%`, background: tone.bar }} />
              </div>
            )}
          </div>
        );
      })}

      {missing.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {missing.map((k) => (
            <button key={k.id} onClick={() => setDraft(draftFor(k.id))} className="chip-outline !text-[13px]">
              <Plus size={14} /> {k.label}
            </button>
          ))}
        </div>
      )}

      <button className="btn btn-primary w-full" onClick={() => setDraft(draftFor("other"))}>
        <Plus size={18} /> Sənəd əlavə et
      </button>

      {history.length > 0 && (
        <div className="pt-2">
          <div className="label">Köhnə sənədlər</div>
          <ul className="space-y-1.5">
            {history.map((d) => (
              <li key={d.id} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-[13px]">
                <FileText size={14} className="text-muted" />
                <span className="flex-1 truncate">{d.kind === "other" ? d.title : docLabel(d.kind)}</span>
                <span className="text-[11px] text-muted">{d.expires ? date(d.expires) : "—"}</span>
                <button onClick={() => removeDocument(car.id, d.id)} aria-label="Sil" className="p-1 text-muted">
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft ? (draft.kind === "other" ? "Yeni sənəd" : docLabel(draft.kind)) : ""}
        footer={
          <button
            className="btn btn-primary w-full"
            disabled={!draft?.title.trim()}
            onClick={() => {
              if (!draft) return;
              try {
                addDocument(car.id, {
                  kind: draft.kind,
                  title: draft.title.trim(),
                  issued: draft.issued || undefined,
                  expires: draft.expires || undefined,
                  number: draft.number.trim() || undefined,
                  photo: draft.photo,
                  note: draft.note.trim() || undefined,
                });
                setDraft(null);
                toast("Sənəd yadda saxlandı");
              } catch {
                toast("Yaddaş doldu — şəkilsiz yadda saxla");
              }
            }}
          >
            Yadda saxla
          </button>
        }
      >
        {draft && (
          <div className="space-y-4">
            <div>
              <span className="label">Növ</span>
              <div className="flex flex-wrap gap-2">
                {DOC_KINDS.map((k) => (
                  <button key={k.id} type="button" className="chip" data-active={draft.kind === k.id} onClick={() => setDraft({ ...draftFor(k.id), photo: draft.photo, number: draft.number })}>
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
            {draft.kind === "other" && (
              <div>
                <label className="label" htmlFor="dtitle">Ad</label>
                <input id="dtitle" className="input" value={draft.title === docLabel("other") ? "" : draft.title} placeholder="məs. Etibarnamə" onChange={(e) => set({ title: e.target.value })} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="dissued">Verilib</label>
                <input
                  id="dissued"
                  type="date"
                  className="input"
                  value={draft.issued}
                  onChange={(e) => {
                    const months = DOC_KINDS.find((k) => k.id === draft.kind)?.months;
                    set({ issued: e.target.value, ...(months && e.target.value ? { expires: addMonths(e.target.value, months) } : {}) });
                  }}
                />
              </div>
              <div>
                <label className="label" htmlFor="dexp">Bitir</label>
                <input id="dexp" type="date" className="input" value={draft.expires} onChange={(e) => set({ expires: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="dnum">Nömrə / polis №</label>
              <input id="dnum" className="input" value={draft.number} onChange={(e) => set({ number: e.target.value })} placeholder="istəyə bağlı" />
            </div>
            <div>
              <span className="label">Şəkil</span>
              {draft.photo ? (
                <div className="relative h-28 w-40 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={draft.photo} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => set({ photo: undefined })} aria-label="Şəkli sil" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-[13px] font-semibold text-muted">
                  <Camera size={18} /> Sənədin şəklini çək
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) set({ photo: await compressImage(f, 1100, 0.7) });
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )}
      </Sheet>

      <Sheet
        open={!!view}
        onClose={() => setView(null)}
        title={view ? (view.kind === "other" ? view.title : docLabel(view.kind)) : ""}
        footer={
          <button
            className="btn btn-ghost w-full !text-bad"
            onClick={() => {
              if (view) removeDocument(car.id, view.id);
              setView(null);
            }}
          >
            <Trash2 size={16} /> Sənədi sil
          </button>
        }
      >
        {view && (
          <div className="space-y-3 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {view.photo && <img src={view.photo} alt="" className="w-full rounded-2xl" />}
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[11px] text-muted">Verilib</dt>
                <dd className="font-semibold">{view.issued ? date(view.issued) : "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted">Bitir</dt>
                <dd className="font-semibold">{view.expires ? date(view.expires) : "—"}</dd>
              </div>
              {view.number && (
                <div className="col-span-2">
                  <dt className="text-[11px] text-muted">Nömrə</dt>
                  <dd className="font-semibold">{view.number}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </Sheet>
    </div>
  );
}
