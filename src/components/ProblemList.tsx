import { AlertTriangle, PlayCircle } from "lucide-react";
import { partName } from "@/lib/data/parts";
import { azn } from "@/lib/format";
import type { ChronicProblem } from "@/lib/types";

const SEV: Record<ChronicProblem["severity"], string> = {
  aşağı: "bg-ok/15 text-ok",
  orta: "bg-warn/15 text-warn",
  yüksək: "bg-bad/15 text-bad",
};

export function ytSearch(q: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

export function ProblemCard({ p, compact }: { p: ChronicProblem; compact?: boolean }) {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warn" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-bold leading-snug">{p.title}</div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${SEV[p.severity]}`}>{p.severity}</span>
          </div>
          <div className="mt-1 text-xs text-muted">
            {partName(p.part)}
            {p.atKm ? ` · ${p.atKm}` : ""} · {azn(p.costRange[0])} – {azn(p.costRange[1])}
          </div>
          {!compact && <p className="mt-2 text-sm leading-relaxed text-text/85">{p.description}</p>}
          <a
            href={ytSearch(p.video)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-2 pr-3"
          >
            <span className="grid h-12 w-20 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-red-600 to-red-900">
              <PlayCircle size={22} className="text-white" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold">Necə düzəldilir — videolar</span>
              <span className="block truncate text-[11px] text-muted">YouTube: “{p.video}”</span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
