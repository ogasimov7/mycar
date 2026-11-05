"use client";

import type { Reminder } from "./reminders";

export const notifySupported = () => typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;

export function registerSW() {
  if (!("serviceWorker" in navigator)) return Promise.resolve(undefined);
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
}

export async function requestPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notifySupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

const SHOWN_KEY = "mycar-notified";

function readShown(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SHOWN_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/**
 * Shows each reminder as a phone/desktop notification at most once a day.
 * There is no server yet, so this runs when the app is opened (or returns to the foreground).
 */
export async function notifyReminders(reminders: Reminder[], force = false) {
  if (!notifySupported() || Notification.permission !== "granted") return 0;
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await registerSW());
  if (!reg) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const shown = readShown();
  const due = reminders.filter((r) => r.level !== "info" || r.kind === "search").filter((r) => force || shown[r.id] !== today);
  for (const r of due.slice(0, 4)) {
    await reg.showNotification(r.title, { body: r.detail, tag: r.id, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: r.href } });
    shown[r.id] = today;
  }
  try {
    // keep only today's entries
    localStorage.setItem(SHOWN_KEY, JSON.stringify(Object.fromEntries(Object.entries(shown).filter(([, d]) => d === today))));
  } catch {}
  return Math.min(due.length, 4);
}
