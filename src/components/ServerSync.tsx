"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { seedGarage } from "@/lib/data/seed";
import { api, dataUrlToBlob, uploadPhoto } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { GarageCar } from "@/lib/types";
import { toast } from "./Toast";

/**
 * Keeps the local store in step with the server:
 *  - loads public listings (and re-loads when the user signs in, so `mine` is right)
 *  - on sign-in: merges the device garage with the account garage, uploads old local listings
 *  - afterwards: every garage change is saved to the account (debounced)
 */
export function ServerSync() {
  const { isLoaded, userId } = useAuth();
  const prevUser = useRef<string | null | undefined>(undefined);

  // signing out must not leave the account's garage on a shared device
  useEffect(() => {
    if (!isLoaded) return;
    if (prevUser.current && !userId) useStore.getState().setGarage(seedGarage());
    prevUser.current = userId ?? null;
  }, [isLoaded, userId]);

  // listings — public, refreshed whenever the identity changes
  useEffect(() => {
    if (!isLoaded) return;
    let alive = true;
    api
      .listings()
      .then((l) => alive && useStore.getState().setListings(l))
      .catch(() => alive && useStore.getState().setListings(useStore.getState().listings));
    useStore.getState().setUserId(userId ?? null);
    return () => {
      alive = false;
    };
  }, [isLoaded, userId]);

  // garage + legacy listings — only for signed-in users
  useEffect(() => {
    if (!isLoaded || !userId) return;
    let alive = true;
    let unsub = () => {};
    let timer: number | undefined;

    (async () => {
      const store = useStore.getState();
      const remote = await api.garage().catch(() => null);
      if (!alive || remote === null) return;

      // merge: the account wins for cars it knows, device-only cars get uploaded
      const remoteIds = new Set(remote.map((c) => c.id));
      const localOnly = store.garage.filter((c) => !remoteIds.has(c.id));
      // the demo car only travels to a brand-new account
      const toUpload = remote.length ? localOnly.filter((c) => c.id !== "demo-bmw") : localOnly;
      store.setGarage([...remote, ...toUpload]);
      await Promise.all(toUpload.map((c) => api.saveCar(c).catch(() => {})));

      await uploadLegacyListings();
      if (!alive) return;
      lastSynced = new Map(useStore.getState().garage.map((c) => [c.id, c]));

      // from now on, persist each change
      let prev = useStore.getState().garage;
      unsub = useStore.subscribe((s) => {
        if (s.garage === prev) return;
        const before = prev;
        prev = s.garage;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => pushGarageDiff(before, useStore.getState().garage), 600);
      });
    })();

    return () => {
      alive = false;
      unsub();
      window.clearTimeout(timer);
    };
  }, [isLoaded, userId]);

  return null;
}

let lastSynced = new Map<string, GarageCar>();

async function pushGarageDiff(before: GarageCar[], after: GarageCar[]) {
  // compare against what was last confirmed by the server, falling back to the previous state
  const base = lastSynced.size ? lastSynced : new Map(before.map((c) => [c.id, c]));
  const next = new Map(after.map((c) => [c.id, c]));
  const jobs: Promise<unknown>[] = [];
  for (const car of after) if (base.get(car.id) !== car) jobs.push(api.saveCar(car));
  for (const id of base.keys()) if (!next.has(id)) jobs.push(api.deleteCar(id));
  const results = await Promise.allSettled(jobs);
  if (results.some((r) => r.status === "rejected")) toast("Qaraj serverə yazılmadı — internet bağlantısını yoxla");
  else lastSynced = next;
}

/** Listings saved only on this device before accounts existed → publish them under the account */
async function uploadLegacyListings() {
  const { localListings, clearLocalListings, upsertListing } = useStore.getState();
  if (!localListings.length) return;
  let ok = 0;
  for (const l of localListings) {
    try {
      const photos = await Promise.all(l.photos.map(async (p) => (p.startsWith("data:") ? uploadPhoto(await dataUrlToBlob(p)) : p)));
      const { id: _id, createdAt: _c, status: _s, priceHistory: _p, mine: _m, photoCredit: _pc, ...rest } = l;
      void [_id, _c, _s, _p, _m, _pc];
      upsertListing(await api.createListing({ ...rest, photos }));
      ok++;
    } catch {
      /* keep going; failures are reported below */
    }
  }
  clearLocalListings();
  if (ok) toast(`${ok} köhnə elanın hesabına köçürüldü`);
}
