export const azn = (n: number) => `${new Intl.NumberFormat("az-AZ").format(Math.round(n))} ₼`;
export const km = (n: number) => `${new Intl.NumberFormat("az-AZ").format(Math.round(n))} km`;
export const num = (n: number) => new Intl.NumberFormat("az-AZ").format(Math.round(n));

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avq", "sen", "okt", "noy", "dek"];
export function date(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "bu gün";
  if (days === 1) return "dünən";
  if (days < 30) return `${days} gün əvvəl`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ay əvvəl`;
  return `${Math.floor(months / 12)} il əvvəl`;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const todayISO = () => new Date().toISOString().slice(0, 10);
