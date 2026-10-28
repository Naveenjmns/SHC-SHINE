"use client";

import { signOut } from "next-auth/react";

/**
 * Sign out and wipe the service-worker cache so the next person using a shared
 * device (scanner counters, registration desk) cannot see the previous user's pages.
 */
export async function signOutAndClearCache(options?: Parameters<typeof signOut>[0]) {
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: "CLEAR_CACHE" });
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Cache cleanup is best-effort; never block sign-out on it
  }
  return signOut(options);
}
