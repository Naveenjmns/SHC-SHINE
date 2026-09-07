"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export default function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.error("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Track Network Status
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineToast(true);
      const timer = setTimeout(() => setShowOnlineToast(false), 4000);
      return () => clearTimeout(timer);
    };

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("offline", handleOffline);
      window.addEventListener("online", handleOnline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
      }
    };
  }, []);

  if (!isOffline && !showOnlineToast) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 w-full max-w-sm">
      {isOffline && (
        <div className="pointer-events-auto bg-stone-900/95 border border-amber-500/40 text-white px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-amber-300">Offline Mode Active</div>
              <div className="text-[11px] text-stone-300">Using cached passes & schedule.</div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
            OFFLINE
          </span>
        </div>
      )}

      {showOnlineToast && !isOffline && (
        <div className="pointer-events-auto bg-stone-900/95 border border-emerald-500/40 text-white px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-emerald-300">Connection Restored</div>
            <div className="text-[11px] text-stone-300">Synced with live SHINE 26 servers.</div>
          </div>
        </div>
      )}
    </div>
  );
}
