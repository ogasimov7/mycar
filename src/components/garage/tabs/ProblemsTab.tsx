"use client";

import { Box, CheckCircle2 } from "lucide-react";
import { generationInfo, getModel } from "@/lib/data/models";
import type { GarageCar, PartId } from "@/lib/types";
import { ProblemCard } from "../../ProblemList";

export function ProblemsTab({ car, onFocus }: { car: GarageCar; onFocus: (p: PartId) => void }) {
  const m = getModel(car.modelId)!;
  const gen = generationInfo(car.modelId, car.year);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {m.make} {m.model} — <b className="text-text">{gen.name}</b> nəsli ({gen.years[0]}–{gen.years[1]}) üçün sahiblərin ən çox rastlaşdığı problemlər və düzəltmə videoları.
      </p>
      {gen.problems.map((p) => {
        const handled = car.repairs.some((r) => r.partId === p.part && r.kind !== "servis");
        return (
          <div key={p.title}>
            <ProblemCard p={p} />
            <div className="mt-1.5 flex items-center gap-2 px-1">
              <button onClick={() => onFocus(p.part)} className="flex items-center gap-1 text-xs font-semibold text-accent-2">
                <Box size={13} /> 3D-də göstər
              </button>
              {handled && (
                <span className="ml-auto flex items-center gap-1 text-xs text-ok">
                  <CheckCircle2 size={13} /> Bu hissədə təmir qeydi var
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
