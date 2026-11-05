"use client";

export interface ReceiptData {
  total?: number;
  date?: string;
  liters?: number;
  text: string;
}

const num = (s: string) => parseFloat(s.replace(/\s/g, "").replace(",", "."));
const AMOUNT = /(\d{1,3}(?:[  ]?\d{3})*(?:[.,]\d{1,2})?)/g;

/** Pulls total, date and litres out of OCR text from an AZ receipt (service or fuel station). */
export function parseReceipt(text: string): ReceiptData {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const out: ReceiptData = { text };

  // total: a "cəmi / yekun / ödəniləcək / total / məbləğ" line wins; else the largest amount with kopecks or ₼/AZN
  const totalLine = [...lines].reverse().find((l) => /c[əe]m|yekun|[öo]d[əe]nil|total|toplam|m[əe]bl[əe]ğ|summa|итог/i.test(l));
  const amountsIn = (l: string) => [...l.matchAll(AMOUNT)].map((m) => num(m[1])).filter((n) => n > 0 && n < 100000);
  if (totalLine) {
    const a = amountsIn(totalLine);
    if (a.length) out.total = a[a.length - 1];
  }
  if (out.total === undefined) {
    const money = lines.filter((l) => /₼|azn|man|[.,]\d{2}\b/i.test(l)).flatMap(amountsIn);
    if (money.length) out.total = Math.max(...money);
  }

  // date: dd.mm.yyyy / dd/mm/yy / yyyy-mm-dd
  const dm = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/) ?? null;
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) out.date = `${iso[1]}-${iso[2]}-${iso[3]}`;
  else if (dm) {
    const [, d, m, y] = dm;
    const yyyy = y.length === 2 ? `20${y}` : y;
    if (+m >= 1 && +m <= 12 && +d >= 1 && +d <= 31) out.date = `${yyyy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // litres (fuel receipts): "35,42 L" / "35.42 lt" / "Litr: 35.42"
  const lm = text.match(/(\d{1,3}[.,]\d{1,3})\s*(?:l\b|lt|litr)/i) ?? text.match(/litr[^\d]{0,6}(\d{1,3}[.,]\d{1,3})/i);
  if (lm) out.liters = num(lm[1]);
  return out;
}

/** Runs Tesseract in the browser (Azerbaijani + English); language data is fetched on first use. */
export async function readReceipt(file: File | Blob, onProgress?: (p: number) => void): Promise<ReceiptData> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["aze", "eng"], 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(m.progress);
    },
  });
  try {
    const { data } = await worker.recognize(file);
    return parseReceipt(data.text);
  } finally {
    await worker.terminate();
  }
}
