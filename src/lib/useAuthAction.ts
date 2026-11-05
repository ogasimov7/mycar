"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { toast } from "@/components/Toast";
import { ApiError } from "./api";

/**
 * Wraps a server action from the UI: asks to sign in first when needed,
 * tracks a busy flag and turns API errors into a toast.
 */
export function useAuthAction() {
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const [busy, setBusy] = useState(false);

  const run = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (!isSignedIn) {
      toast("Davam etmək üçün daxil ol");
      clerk.openSignIn({ forceRedirectUrl: typeof window !== "undefined" ? window.location.href : undefined });
      return;
    }
    setBusy(true);
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) clerk.openSignIn();
      toast(e instanceof Error ? e.message : "Xəta baş verdi");
    } finally {
      setBusy(false);
    }
  };

  return { run, busy, isSignedIn: !!isSignedIn };
}
