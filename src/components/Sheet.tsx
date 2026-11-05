"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

/** Mobile bottom sheet; centered dialog on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="animate-fade absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-sheet relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <div className="font-display text-lg font-bold">{title}</div>
          <button onClick={onClose} aria-label="Bağla" className="grid h-9 w-9 place-items-center rounded-full bg-surface-2">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="safe-bottom border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
