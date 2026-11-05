"use client";

import { useEffect } from "react";
import { create } from "zustand";

interface ToastState {
  msg: string | null;
  key: number;
  show: (msg: string) => void;
  hide: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  msg: null,
  key: 0,
  show: (msg) => set((s) => ({ msg, key: s.key + 1 })),
  hide: () => set({ msg: null }),
}));

/** Fire-and-forget toast from anywhere (event handlers) */
export const toast = (msg: string) => useToastStore.getState().show(msg);

export function Toaster() {
  const { msg, key, hide } = useToastStore();
  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(hide, 2600);
    return () => window.clearTimeout(t);
  }, [msg, key, hide]);
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[172px] z-[60] flex justify-center px-4 lg:bottom-28" role="status" aria-live="polite">
      <div key={key} className="animate-fade rounded-full bg-dark px-5 py-3 text-[13px] font-medium text-white shadow-lg">
        {msg}
      </div>
    </div>
  );
}
