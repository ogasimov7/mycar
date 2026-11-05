"use client";

import { useState } from "react";
import { Loader2, ScanText } from "lucide-react";
import { readReceipt, type ReceiptData } from "@/lib/ocr";
import { toast } from "../Toast";

/** "Read from receipt" button: photo → OCR → fills amount / date / litres */
export function ReceiptScan({ onResult, className = "" }: { onResult: (r: ReceiptData) => void; className?: string }) {
  const [progress, setProgress] = useState<number | null>(null);

  return (
    <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-4 py-3 text-[13px] font-semibold transition hover:border-text ${progress !== null ? "pointer-events-none opacity-80" : ""} ${className}`}>
      {progress === null ? (
        <>
          <ScanText size={17} /> Qəbzin şəklindən oxu
        </>
      ) : (
        <>
          <Loader2 size={17} className="animate-spin" /> Oxunur… {Math.round(progress * 100)}%
        </>
      )}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setProgress(0);
          try {
            const r = await readReceipt(file, setProgress);
            onResult(r);
            const found = [r.total !== undefined && "məbləğ", r.date && "tarix", r.liters && "litr"].filter(Boolean);
            toast(found.length ? `Tapıldı: ${found.join(", ")} — yoxla və düzəlt` : "Rəqəmləri tanıya bilmədik — əl ilə daxil et");
          } catch {
            toast("Qəbzi oxumaq alınmadı — internet bağlantısını yoxla");
          } finally {
            setProgress(null);
          }
        }}
      />
    </label>
  );
}
