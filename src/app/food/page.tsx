"use client";

import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { signOutAndClearCache } from "@/lib/signOutAndClearCache";
import Link from "next/link";
import CheckInModal from "@/components/CheckInModal";
import {
  Utensils,
  QrCode,
  Search,
  Volume2,
  VolumeX,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { safeJson } from "@/lib/safeFetch";
import { DEFAULT_EDITION_CONFIG } from "@/lib/editionDefaults";
import FoodDistributionStats, {
  FoodStats,
  FoodEditionInfo,
} from "./components/FoodDistributionStats";
import FoodScanResultCard from "./components/FoodScanResultCard";
import FoodRecentHistory, { RecentClaim } from "./components/FoodRecentHistory";
import FoodScannerViewport from "./components/FoodScannerViewport";
import { playScannerTone } from "./lib/foodAudio";
import { useFoodClaims } from "./hooks/useFoodClaims";

// Auto-claim preference persisted per device. Read through useSyncExternalStore so the server
// render (default: on) and the first client render agree, then the saved value applies.
const AUTO_CLAIM_KEY = "shine_auto_claim";
const AUTO_CLAIM_EVENT = "shine:auto-claim-change";
let inMemoryAutoClaim: boolean | null = null; // used when storage is unavailable (private mode)

function readAutoClaim(): boolean {
  try {
    const saved = localStorage.getItem(AUTO_CLAIM_KEY);
    if (saved !== null) return saved === "true";
  } catch {
    // Storage blocked: fall back to the in-memory choice
  }
  return inMemoryAutoClaim ?? true;
}

function writeAutoClaim(value: boolean) {
  inMemoryAutoClaim = value;
  try {
    localStorage.setItem(AUTO_CLAIM_KEY, String(value));
  } catch {
    // Storage blocked: the in-memory value still applies for this session
  }
  window.dispatchEvent(new Event(AUTO_CLAIM_EVENT));
}

function subscribeAutoClaim(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(AUTO_CLAIM_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(AUTO_CLAIM_EVENT, onChange);
  };
}

export default function FoodCoordinatorPage() {
  const { data: session, status } = useSession();

  const [stats, setStats] = useState<FoodStats | null>(null);
  const [edition, setEdition] = useState<FoodEditionInfo | null>(null);
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [inputCode, setInputCode] = useState("");
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const autoClaim = useSyncExternalStore(subscribeAutoClaim, readAutoClaim, () => true);

  const toggleAutoClaim = () => {
    writeAutoClaim(!autoClaim);
  };

  const playSound = (type: "success" | "warning" | "error") => {
    if (soundEnabled) playScannerTone(type);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/food/stats");
      const data = await safeJson(res);
      if (data.success) {
        setStats(data.stats);
        setRecentClaims(data.recentClaims || []);
        if (data.edition) setEdition(data.edition);
      }
    } catch (err) {
      console.error("Failed to load food stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const {
    processing,
    actionLoading,
    popup,
    setPopup,
    handleDetectedCode,
    handleManualClaim,
    handleRejectClaim,
    handleUndoClaim,
    handleSwitchPreference,
  } = useFoodClaims({
    autoClaim,
    playSound,
    onRefreshStats: fetchStats,
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
      const interval = setInterval(fetchStats, 12000);
      return () => clearInterval(interval);
    }
  }, [status, fetchStats]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    handleDetectedCode(inputCode);
    setInputCode("");
  };

  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="font-semibold text-[15px] tracking-tight text-ink truncate">
              {edition?.name?.trim() || DEFAULT_EDITION_CONFIG.name}
              {edition?.edition?.trim() && (
                <>
                  {" "}
                  <span className="text-accent">{edition.edition.trim()}</span>
                </>
              )}
            </Link>
            <span className="hidden sm:inline text-border-strong">/</span>
            <div className="hidden sm:inline-flex pill-badge whitespace-nowrap">
              <Utensils className="w-3.5 h-3.5 text-accent" />
              <span>Food Committee</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label={soundEnabled ? "Mute scan sounds" : "Unmute scan sounds"}
              className="text-sm !px-3"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline ml-1.5">{soundEnabled ? "Audio On" : "Muted"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              aria-label="Refresh stats"
              className="text-sm !px-3"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin text-accent" : ""}`} />
              <span className="hidden sm:inline ml-1.5">Refresh</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCheckInModal(true)}
              aria-label="Full lookup"
              className="text-sm gap-1.5 !px-3 sm:!px-4"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Lookup</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOutAndClearCache({ callbackUrl: "/login" })}
              aria-label="Sign out"
              className="text-sm text-ink-muted hover:text-danger !px-3"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="eyebrow">
                Catering &amp; Hospitality Desk
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-success-surface text-success-ink border border-success-border">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live Distribution
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">
              Meal Pass Verification
            </h1>
            <p className="text-[15px] text-ink-muted mt-1">
              Logged in as <span className="font-semibold text-ink">{session?.user?.name || session?.user?.email}</span>
            </p>
          </div>

          <div className="text-left sm:text-right bg-surface border border-border rounded-2xl shadow-card px-4 py-3">
            <span className="text-sm text-ink-muted block">Venue</span>
            <span className="text-[15px] font-semibold text-ink block">
              {edition?.diningHallVenue || "Dining Hall"}
            </span>
          </div>
        </div>

        <FoodDistributionStats stats={stats} edition={edition} />

        <div className="bg-surface border border-border rounded-2xl shadow-card p-3.5">
          <form onSubmit={onSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Enter Food Token (FT-...) or Badge Code..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="pl-9 h-10 text-sm sm:text-[15px] font-mono"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={processing}
              className="px-5 shrink-0"
            >
              Verify Code
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <FoodScannerViewport
              scannerDivId="food-qr-reader"
              onDetectedCode={handleDetectedCode}
              processing={processing}
              autoClaim={autoClaim}
              onToggleAutoClaim={toggleAutoClaim}
            />
          </div>

          <div className="lg:col-span-5 space-y-4">
            {popup && (
              <FoodScanResultCard
                popup={popup}
                actionLoading={actionLoading}
                mealOptions={edition?.mealOptions}
                onManualClaim={handleManualClaim}
                onRejectClaim={handleRejectClaim}
                onUndoClaim={handleUndoClaim}
                onSwitchPreference={handleSwitchPreference}
                onDismiss={() => setPopup(null)}
              />
            )}

            <FoodRecentHistory
              claims={recentClaims}
              onUndoClaim={handleUndoClaim}
              actionLoading={actionLoading}
            />
          </div>
        </div>
      </div>

      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onCheckInComplete={fetchStats}
        mode="food"
      />
    </main>
  );
}
