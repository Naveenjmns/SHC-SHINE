"use client";

import { useEffect, useState } from "react";
import { Download, Sparkles, X, Check } from "lucide-react";
import { safeStorage } from "@/lib/storage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if previously dismissed recently (within 24 hours) - safe for Safari Private Browsing
    const dismissedAt = safeStorage.getItem("shine26_pwa_dismissed");
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Give the user 3 seconds of browsing before gently offering the install prompt
      setTimeout(() => setShowPrompt(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log("[PWA] App installed successfully!");
    };

    // Custom event listener so other components (e.g. Navbar) can trigger install
    const handleTriggerInstall = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === "accepted") {
            setShowPrompt(false);
          }
          setDeferredPrompt(null);
        });
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("trigger-pwa-install", handleTriggerInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trigger-pwa-install", handleTriggerInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    safeStorage.setItem("shine26_pwa_dismissed", Date.now().toString());
  };

  if (!showPrompt || isInstalled || !deferredPrompt) return null;

  return (
    <aside
      aria-label="Install App"
      className="fixed z-50 max-w-sm w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-5 duration-300"
      style={{
        bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
        right: "calc(1.25rem + env(safe-area-inset-right, 0px))",
      }}
    >
      <div className="bg-surface border border-border rounded-3xl p-4 sm:p-5 shadow-modal relative overflow-hidden">
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 p-1 text-ink-subtle hover:text-ink rounded-full hover:bg-surface-raised transition tap-target"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-accent-ink font-bold text-xl shrink-0">
            <Download className="w-5 h-5" />
          </div>

          <div className="flex-1 pr-4">
            <div className="flex items-center gap-1.5 eyebrow !text-accent-strong">
              <Sparkles className="w-3 h-3 text-accent" />
              <span>Official Event App</span>
            </div>
            <h4
              className="text-base font-bold text-ink leading-tight mt-0.5"
            >
              Install App
            </h4>
            <p className="text-sm text-ink-muted mt-1 leading-normal">
              Instant access to QR gate passes, live jury leaderboards & food tokens. Works offline on your device.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="tap-target btn-primary !py-1.5 !px-3.5 !text-[15px] flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Now</span>
              </button>

              <button
                onClick={handleDismiss}
                className="tap-target px-3 py-1.5 text-[15px] font-semibold text-ink-muted hover:text-ink hover:bg-surface-raised rounded-[8px] transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
