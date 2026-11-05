"use client";

import { useEffect } from "react";
import { notifyReminders, registerSW } from "@/lib/notify";
import { buildReminders } from "@/lib/reminders";
import { useStore } from "@/lib/store";

/** Registers the service worker and pushes due reminders when the app is opened / refocused. */
export function ReminderNotifier() {
  useEffect(() => {
    registerSW();
    const run = () => {
      const s = useStore.getState();
      if (!s.notifications || document.visibilityState !== "visible") return;
      notifyReminders(buildReminders(s.garage, s.listings, s.savedSearches));
    };
    run();
    document.addEventListener("visibilitychange", run);
    return () => document.removeEventListener("visibilitychange", run);
  }, []);
  return null;
}
