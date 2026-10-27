"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Printer, Share2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";
import InteractiveFloorPlanModal from "@/components/InteractiveFloorPlanModal";
import { copyToClipboard } from "@/lib/clipboard";
import { safeJson } from "@/lib/safeFetch";
import DigitalBadgeCard, { DelegationInfo, FestInfo } from "../components/DigitalBadgeCard";
import BadgeEventsSchedule, { RegisteredEventItem } from "../components/BadgeEventsSchedule";
import BadgeFoodCoupon from "../components/BadgeFoodCoupon";

interface BadgeData {
  badgeCode: string;
  name: string;
  isOwnerView?: boolean;
  email: string | null;
  phone: string | null;
  foodTokenCode: string | null;
  foodPreference?: "VEG" | "NON_VEG";
  foodTokenClaimed: boolean;
  foodClaimedAt?: string | null;
  eventCheckedIn?: boolean;
  eventCheckedInAt?: string | null;
  qrData: string;
  foodQrData?: string | null;
  createdAt: string;
  delegation: DelegationInfo;
  events: RegisteredEventItem[];
  fest: FestInfo;
}

export default function BadgeDetailPage() {
  const params = useParams();
  const badgeCode = params.badgeCode as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [mapModalState, setMapModalState] = useState<{
    isOpen: boolean;
    zoneId?: string | null;
    title: string;
    subtitle?: string;
  }>({
    isOpen: false,
    zoneId: null,
    title: "Indoor Venue Floor Plan",
  });

  useEffect(() => {
    async function loadBadge() {
      if (!badgeCode) return;
      try {
        const res = await fetch(`/api/badge/${encodeURIComponent(badgeCode)}`);
        const data = await safeJson(res, { success: false });
        if (data.success && data.badge) {
          setBadge(data.badge);
        } else {
          setError(data.message || "Badge not found.");
        }
      } catch (err) {
        console.error("Failed to load badge:", err);
        setError("Failed to fetch badge details.");
      } finally {
        setLoading(false);
      }
    }
    loadBadge();
  }, [badgeCode]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${badge?.name}'s Event Pass - ${badge?.fest.name} ${badge?.fest.edition}`,
          text: `Digital delegate ID pass and meal coupon for ${badge?.name} at ${badge?.fest.name}`,
          url,
        });
      } catch (e) {
        console.log("Share skipped:", e);
      }
    } else {
      const ok = await copyToClipboard(url);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined") {
      try {
        window.close();
      } catch {}
      setTimeout(() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/dashboard");
        }
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-raised)] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
          Loading Official Delegate Pass...
        </p>
      </div>
    );
  }

  if (error || !badge) {
    return (
      <div className="min-h-screen bg-[var(--surface-raised)] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="text-lg font-bold text-[var(--ink)] mb-1">Invalid or Expired Badge</h1>
        <p className="text-xs text-[var(--ink-muted)] max-w-sm mb-5">
          {error || "The badge code provided does not exist in the fest registry."}
        </p>
        <Link href="/">
          <Button variant="primary" size="sm">
            Return to Fest Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-raised)] text-[var(--ink)] py-8 px-4 sm:px-6">
      {/* Print Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { background: white !important; color: black !important; }
              .no-print { display: none !important; }
              .print-badge-wrapper {
                box-shadow: none !important;
                border: 2px solid #1C1917 !important;
                page-break-inside: avoid;
                margin: 0 auto;
                max-width: 500px;
              }
            }
          `,
        }}
      />

      {/* Screen Action Bar */}
      <div className="max-w-xl mx-auto mb-6 flex items-center justify-between no-print">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="text-xs gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="text-xs gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? "Link Copied!" : "Share Pass"}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Badge</span>
          </Button>
        </div>
      </div>

      {/* Main Stack */}
      <div className="max-w-xl mx-auto space-y-4">
        {/* Pass Card */}
        <DigitalBadgeCard
          badgeCode={badge.badgeCode}
          name={badge.name}
          email={badge.email ?? ""}
          phone={badge.phone ?? ""}
          qrData={badge.qrData}
          eventCheckedIn={badge.eventCheckedIn}
          eventCheckedInAt={badge.eventCheckedInAt}
          delegation={badge.delegation}
          fest={badge.fest}
          onOpenMap={() =>
            setMapModalState({
              isOpen: true,
              zoneId: null,
              title: `${badge.fest.name} ${badge.fest.edition} Campus Floor Plan`,
              subtitle: badge.fest.venue,
            })
          }
        />

        {/* Schedule */}
        <div className="no-print">
          <BadgeEventsSchedule
            events={badge.events}
            onOpenMapForEvent={(ev: RegisteredEventItem) =>
              setMapModalState({
                isOpen: true,
                zoneId: ev.venueZoneId || null,
                title: `${ev.eventName} Venue`,
                subtitle: ev.venue || undefined,
              })
            }
          />
        </div>

        {/* Meal Coupon: the token is only returned to the pass owner or desk staff */}
        {badge.foodTokenCode ? (
          <BadgeFoodCoupon
            foodTokenCode={badge.foodTokenCode}
            foodPreference={badge.foodPreference}
            foodTokenClaimed={badge.foodTokenClaimed}
            foodClaimedAt={badge.foodClaimedAt}
            foodQrData={badge.foodQrData}
            diningHallVenue={badge.fest.diningHallVenue || badge.fest.venue}
          />
        ) : (
          <div className="no-print rounded-xl border border-border bg-surface p-4 text-sm text-ink-muted">
            The meal token is private.{" "}
            <Link href="/login" className="font-semibold text-accent underline">
              Log in
            </Link>{" "}
            as this delegate to view it.
          </div>
        )}
      </div>

      {/* Wayfinding Modal */}
      <InteractiveFloorPlanModal
        isOpen={mapModalState.isOpen}
        onClose={() => setMapModalState((prev) => ({ ...prev, isOpen: false }))}
        floorPlanUrl={badge.fest.floorPlanUrl || "/uploads/campus-floorplan.svg"}
        highlightZoneId={mapModalState.zoneId}
        title={mapModalState.title}
        subtitle={mapModalState.subtitle}
      />
    </div>
  );
}
