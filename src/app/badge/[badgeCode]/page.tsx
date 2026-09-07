"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Printer,
  Share2,
  Calendar,
  MapPin,
  Utensils,
  CheckCircle2,
  Clock,
  ArrowLeft,
  GraduationCap,
  Building2,
  Phone,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface BadgeData {
  badgeCode: string;
  name: string;
  email: string;
  phone: string;
  foodTokenCode: string;
  foodTokenClaimed: boolean;
  qrData: string;
  createdAt: string;
  delegation: {
    id: string;
    collegeName: string;
    department: string;
    teamName: string;
    teamLeadName: string;
    teamLeadPhone: string;
    staffInchargeName: string | null;
    staffInchargePhone: string | null;
    paymentStatus: string;
  };
  events: Array<{
    registrationId: string;
    status: string;
    eventName: string;
    category: string;
    venue: string | null;
    rules: string | null;
    staffIncharge: string | null;
    studentIncharge: string | null;
  }>;
  fest: {
    name: string;
    edition: string;
    tagline: string;
    institutionName: string;
    departmentName: string;
    venue: string;
    startDate: string;
    endDate: string | null;
  };
}

export default function BadgeDetailPage() {
  const params = useParams();
  const badgeCode = params.badgeCode as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBadge() {
      if (!badgeCode) return;
      try {
        const res = await fetch(`/api/badge/${encodeURIComponent(badgeCode)}`);
        const data = await res.json();
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
        console.log("Share skipped/aborted:", e);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-[#FF6B1A] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
          Loading Official Delegate Pass...
        </p>
      </div>
    );
  }

  if (error || !badge) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-rose-600" />
        </div>
        <h1 className="text-xl font-black text-stone-900 mb-2">Invalid or Expired Badge</h1>
        <p className="text-xs text-stone-600 max-w-sm mb-6">{error || "The badge code provided does not exist in the registry."}</p>
        <Link
          href="/"
          className="btn-ember px-6 py-2.5 text-xs font-bold rounded-xl"
        >
          Return to Fest Home
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(badge.fest.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 py-8 px-4 sm:px-6">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-badge-wrapper {
            box-shadow: none !important;
            border: 2px solid #1C1917 !important;
            page-break-inside: avoid;
            margin: 0 auto;
            max-width: 500px;
          }
        }
      `}</style>

      {/* Action Bar (Screen Only) */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between no-print">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>New Registration</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="tap-target inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-stone-600" />
            <span>{copied ? "Link Copied!" : "Share Pass"}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="tap-target inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C1917] text-white text-xs font-bold hover:bg-black transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Badge</span>
          </button>
        </div>
      </div>

      {/* Main Badge Container */}
      <div className="max-w-xl mx-auto bg-white border-2 border-stone-200 rounded-3xl shadow-xl overflow-hidden print-badge-wrapper">
        {/* Lanyard Hole Simulation */}
        <div className="h-6 bg-stone-100 border-b border-stone-200 flex items-center justify-center">
          <div className="w-16 h-2.5 rounded-full bg-stone-300/80 border border-stone-400/40" />
        </div>

        {/* Fest Header Header Banner */}
        <div className="bg-gradient-to-r from-[#1C1917] via-[#2A2421] to-[#1C1917] text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#FF6B1A]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-2 right-4">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
              OFFICIAL DELEGATE PASS
            </span>
          </div>

          <div className="text-[11px] font-bold text-amber-400 tracking-wider uppercase mb-1">
            {badge.fest.institutionName || "Sacred Heart College (Autonomous)"}
          </div>
          <div className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mb-2">
            {badge.fest.departmentName || "Post Graduate & Research Department of Computer Applications"}
          </div>

          <h1
            className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-baseline gap-2"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            <span>{badge.fest.name}</span>
            <span className="text-[#FF6B1A] text-xl sm:text-2xl">{badge.fest.edition}</span>
          </h1>

          <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-stone-300">
            <span className="inline-flex items-center gap-1 text-stone-300">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{formattedDate}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-stone-300">
              <MapPin className="w-3.5 h-3.5 text-[#FF6B1A]" />
              <span>{badge.fest.venue}</span>
            </span>
          </div>
        </div>

        {/* Delegate Identity Section */}
        <div className="p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* QR Code */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="p-2.5 bg-white border-2 border-stone-900 rounded-2xl shadow-xs">
                {badge.qrData ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={badge.qrData}
                    alt={`QR Pass for ${badge.badgeCode}`}
                    className="w-36 h-36 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-36 h-36 bg-stone-100 flex items-center justify-center text-xs text-stone-400">
                    QR Unavailable
                  </div>
                )}
              </div>
              <span className="mt-1.5 font-mono text-[11px] font-black text-stone-900 tracking-wider">
                {badge.badgeCode}
              </span>
              <span className="text-[9px] text-stone-500 uppercase tracking-wider font-semibold mt-0.5">
                Scan at Gate Verification
              </span>
            </div>

            {/* Delegate Details */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold tracking-wider uppercase mb-1.5">
                Verified Delegate
              </span>

              <h2
                className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight truncate"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                {badge.name}
              </h2>

              <div className="mt-2 space-y-1 text-xs text-stone-600">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-stone-900 font-semibold">
                  <GraduationCap className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                  <span className="truncate">{badge.delegation.collegeName}</span>
                </div>

                {badge.delegation.teamName && (
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Contingent: <strong className="text-stone-800">{badge.delegation.teamName}</strong></span>
                  </div>
                )}

                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-stone-500 text-[11px]">
                  <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                  <span>{badge.phone} • {badge.email}</span>
                </div>
              </div>

              {/* Accompanying Faculty or Team Lead note */}
              {(badge.delegation.staffInchargeName || badge.delegation.teamLeadName) && (
                <div className="mt-3 pt-2.5 border-t border-stone-100 text-[11px] text-stone-500">
                  {badge.delegation.staffInchargeName ? (
                    <div>
                      Visiting Faculty Incharge: <strong className="text-stone-700">{badge.delegation.staffInchargeName}</strong>
                      {badge.delegation.staffInchargePhone && ` (${badge.delegation.staffInchargePhone})`}
                    </div>
                  ) : (
                    <div>
                      Contingent Lead: <strong className="text-stone-700">{badge.delegation.teamLeadName}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Perforated Food Token Voucher */}
          <div className="my-6 relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-stone-300" />
            <div className="relative flex justify-between items-center px-4">
              <span className="bg-white px-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                Detach or Scan for Food Court Access
              </span>
            </div>
          </div>

          <div className="bg-amber-50/80 border-2 border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <Utensils className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Official Lunch & Refreshment Token
                  </span>
                  <span className="bg-amber-200/70 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded">
                    1x Meal Pass
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80">
                  Valid at Fest Dining Hall on event day. Present token code or badge QR.
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right shrink-0">
              <div className="text-[10px] text-amber-800/70 font-semibold uppercase tracking-wider">Token Code</div>
              <div className="font-mono text-sm font-black text-stone-900 tracking-wider bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-2xs">
                {badge.foodTokenCode}
              </div>
              <div className="text-[9px] text-amber-700 font-medium mt-0.5">
                {badge.foodTokenClaimed ? "Already Claimed" : "Active & Unclaimed"}
              </div>
            </div>
          </div>

          {/* Registered Events / Competitions Schedule */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider">
                Event Competitions ({badge.events.length})
              </h3>
              <span className="text-[10px] font-semibold text-stone-500">
                Show badge at competition registration desk
              </span>
            </div>

            <div className="space-y-2">
              {badge.events.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 truncate">{ev.eventName}</span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          ev.category === "ON_STAGE"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {ev.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
                      </span>
                    </div>
                    {ev.venue && (
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>Venue: {ev.venue}</span>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        ev.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : ev.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ev.status === "CONFIRMED" ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : (
                        <Clock className="w-2.5 h-2.5" />
                      )}
                      <span>{ev.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Instructions Footer */}
          <div className="mt-6 pt-4 border-t border-stone-200 flex items-start gap-2 text-[10px] text-stone-500">
            <ShieldCheck className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <p>
              This badge is non-transferable and mandatory for entry into the college campus, auditorium, and food counters.
              Participants must wear this pass visibly throughout the fest duration.
            </p>
          </div>
        </div>
      </div>

      {/* Screen bottom CTA */}
      <div className="max-w-xl mx-auto mt-6 text-center text-xs text-stone-500 no-print">
        Need assistance or event query? Reach out to the student & staff event coordinators at the helpdesk.
      </div>
    </div>
  );
}
