"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import { safeJson } from "@/lib/safeFetch";
import {
  Trophy,
  GraduationCap,
  CheckCircle2,
  Clock,
  ClipboardList,
  Theater,
  Laptop,
  Check,
  X,
  MapPin,
  QrCode,
  Utensils,
  ExternalLink,
  Ticket,
  Building,
  Sparkles,
  Users,
  ShieldCheck,
  Maximize2,
} from "lucide-react";

interface RegistrationItem {
  id: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  result: string | null;
  createdAt: string;
  event: {
    id: string;
    name: string;
    category: "ON_STAGE" | "OFF_STAGE";
    fee: number;
    venue: string | null;
    dateTime: string;
    coordinator: {
      name: string;
      email: string;
      phone: string | null;
    } | null;
    staffCoordinator?: {
      name: string;
      email: string;
      phone: string | null;
    } | null;
    studentCoordinator?: {
      name: string;
      email: string;
      phone: string | null;
    } | null;
  };
}

interface PassData {
  id: string;
  name: string;
  email: string;
  phone: string;
  isTeamLead: boolean;
  badgeCode: string;
  foodTokenCode: string;
  foodPreference?: "VEG" | "NON_VEG";
  eventCheckedIn: boolean;
  foodTokenClaimed: boolean;
  qrData: string | null;
  foodQrData: string | null;
  badgeUrl: string;
}

interface DelegationData {
  id: string;
  collegeName: string;
  department: string | null;
  teamName: string | null;
  teamLeadName: string;
  teamLeadEmail: string;
  teamLeadPhone: string;
  staffInchargeName: string | null;
  staffInchargeEmail: string | null;
  totalFee: number;
  paymentStatus: string;
  memberCount: number;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  const [showStageMode, setShowStageMode] = useState(false);
  const [editionInfo, setEditionInfo] = useState<{
    startDate?: string | Date | null;
    participantFee?: number;
    institutionName?: string | null;
    name?: string;
    edition?: string;
    venue?: string | null;
  } | null>(null);
  const [pass, setPass] = useState<PassData | null>(null);
  const [delegation, setDelegation] = useState<DelegationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enlargedQr, setEnlargedQr] = useState<{
    title: string;
    subtitle: string;
    code: string;
    qrData: string;
    badgeType: "EVENT" | "FOOD";
    statusText?: string;
  } | null>(null);
  const [updatingFoodPref, setUpdatingFoodPref] = useState(false);

  const handleToggleFoodPreference = async () => {
    if (!pass || pass.foodTokenClaimed || updatingFoodPref) return;
    const currentPref = (pass.foodPreference || "VEG").toUpperCase();
    const nextPref = currentPref === "VEG" ? "NON_VEG" : "VEG";

    setUpdatingFoodPref(true);
    try {
      const res = await fetch("/api/student/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preference: nextPref }),
      });
      const data = await safeJson(res, { success: false });
      if (data.success) {
        setPass((prev) => (prev ? { ...prev, foodPreference: nextPref as "VEG" | "NON_VEG" } : null));
      } else {
        alert(data.message || "Failed to update dietary preference.");
      }
    } catch {
      alert("Network error while updating dietary preference.");
    } finally {
      setUpdatingFoodPref(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }

    if (status === "authenticated") {
      async function loadData() {
        try {
          const res = await fetch("/api/student/registrations");
          const data = await safeJson(res, {
            success: false,
            isApproved: false,
            showStageMode: false,
            registrations: [],
            pass: null,
            delegation: null,
            edition: null,
          });
          if (data.success) {
            setRegistrations(data.registrations || []);
            setIsApproved(!!data.isApproved);
            setShowStageMode(Boolean(data.showStageMode));
            if (data.edition) {
              setEditionInfo(data.edition);
            }
            setPass(data.pass || null);
            setDelegation(data.delegation || null);
          }
        } catch (err) {
          console.error("Failed to load student portal data:", err);
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <main className="dash-layout flex items-center justify-center p-8 min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading student portal...</p>
        </div>
      </main>
    );
  }

  const confirmed = registrations.filter((r) => r.status === "CONFIRMED");
  const pending = registrations.filter((r) => r.status === "PENDING");

  const formattedFestDate = editionInfo?.startDate
    ? new Date(editionInfo.startDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "September 17, 2026";

  const individualFee = editionInfo?.participantFee ?? 200;

  return (
    <main className="dash-layout flex flex-col min-h-screen">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="container-shine py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                S
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base">
                SHINE <span className="text-orange-600">26</span>
              </span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
              Student Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="tap-target px-3.5 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              + Register More
            </Link>
            {showStageMode && (
              <Link
                href="/leaderboard"
                className="tap-target px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-700" />
                <span>Stage Results</span>
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="tap-target px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="container-shine py-8 flex-1">
        {/* Stage Mode Live Announcement (Visible only when toggle is enabled in Admin) */}
        {showStageMode && (
          <div className="dash-card p-5 sm:p-6 mb-8 border-l-4 border-amber-500 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase tracking-wider">
                    Stage Mode Active
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Symposium Winners & Podium Announced!
                  </h3>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Official competition evaluations, rankings, and awards are now live on stage.
                </p>
              </div>
            </div>
            <Link
              href="/leaderboard"
              className="tap-target px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition inline-flex items-center gap-1.5 shrink-0"
            >
              <Trophy className="w-4 h-4" />
              <span>Explore Stage Winners</span>
            </Link>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="dash-card p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verified Participant Portal
                </span>
                {(session?.user?.college || delegation?.collegeName) && (
                  <span className="text-xs text-slate-500 font-medium inline-flex items-center gap-1">
                    • <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{session?.user?.college || delegation?.collegeName}</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome, {session?.user?.name || "Participant"}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-y-1 gap-x-2">
                <span>{editionInfo?.institutionName || "Sacred Heart College (Autonomous)"}</span>
                <span>•</span>
                <span>Fest Date: {formattedFestDate}</span>
                {editionInfo?.venue && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6B1A]" />
                      <span>{editionInfo.venue}</span>
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-500">Account ID</div>
              <div className="text-xs font-mono tabular-nums text-slate-900 font-bold">
                {session?.user?.id?.slice(-8).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Official Digital Pass & Contingent Dossier Section */}
        {pass && (
          <div className="bg-white border border-amber-200/90 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider border border-amber-300">
                    Contingent Pass & Dossier
                  </span>
                  {delegation?.collegeName && (
                    <span className="text-xs text-stone-500 font-medium flex items-center gap-1">
                      • <Building className="w-3.5 h-3.5 text-stone-400" />
                      <strong>{delegation.collegeName}</strong>
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  {delegation?.teamName || "College Delegation Roster"}
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  {delegation?.teamLeadName ? `Contingent Lead: ${delegation.teamLeadName}` : ""}
                  {delegation?.staffInchargeName ? ` • Faculty: ${delegation.staffInchargeName}` : ""}
                </p>
              </div>

              {/* Verification & Approval Status */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    Verification & Approval Status
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5 ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      {isApproved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Registration Approved & Badges Active</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
                          <span>Pending Coordinator / Admin Approval</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-right border-l border-stone-200 pl-4 hidden sm:block">
                  <div className="text-[10px] text-stone-500">Participant Fee</div>
                  <div className="text-base font-black text-stone-900 font-mono">
                    ₹{individualFee}
                  </div>
                  {delegation && delegation.memberCount > 1 && (
                    <div className="text-[10px] text-stone-400">
                      Team Total ({delegation.memberCount}): ₹{delegation.totalFee || individualFee * delegation.memberCount}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* IF NOT YET APPROVED: Render Pending Review Banner & Lock QR Passes */}
            {!isApproved ? (
              <div className="mt-6 bg-amber-50/80 border border-amber-200 rounded-2xl p-6 text-amber-950 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-amber-950">
                      Registration Under Review & Pending Approval
                    </h3>
                    <p className="text-xs leading-relaxed text-amber-900/90 max-w-2xl">
                      Your contingent registration for <strong>{delegation?.collegeName || "your college"}</strong> ({delegation?.memberCount || 1} participant(s)) has been submitted and is currently under verification by the Fest Admin & Event Coordinators.
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 border border-amber-200 rounded-xl p-4 text-xs space-y-2 text-stone-700">
                  <div className="flex items-center gap-2 font-bold text-stone-900">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Pass Activation Notice:</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    Your 2 official QR badges (<strong>Event Entry QR Code</strong> + <strong>Food Token QR Code</strong>) and <strong>Printable ID Card</strong> will automatically unlock right here in your portal as soon as an Admin or Event Coordinator approves your registration.
                  </p>
                  <div className="pt-2 border-t border-stone-200/80 flex flex-wrap items-center justify-between text-[11px] text-stone-500">
                    <span>Team Lead Contact: <strong>{delegation?.teamLeadName}</strong> ({delegation?.teamLeadPhone})</span>
                    <span>Fee per Participant: <strong>₹{individualFee}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              /* IF APPROVED: Render Official Digital Passes, QR Codes, Food Tokens, and Print Link */
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#FF6B1A]" />
                    <span>Official Activated Pass ({pass.badgeCode})</span>
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>APPROVED & VERIFIED</span>
                  </span>
                </div>

                <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-5 sm:p-6 hover:border-amber-400 transition-all shadow-2xs">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300">
                          {pass.badgeCode}
                        </span>
                        {pass.isTeamLead && (
                          <span className="text-[10px] font-extrabold bg-stone-900 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Team Lead
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xl font-extrabold text-stone-900">{pass.name}</h4>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {pass.email} • {pass.phone}
                        </div>
                      </div>

                      {/* Status badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                            pass.eventCheckedIn
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-stone-200/80 text-stone-700"
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {pass.eventCheckedIn ? "Event Checked In" : "Venue Pass Ready"}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                            pass.foodTokenClaimed
                              ? "bg-amber-200 text-amber-900 border border-amber-400"
                              : "bg-amber-100/70 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <Utensils className="w-3 h-3 text-amber-700" />
                          {pass.foodTokenClaimed ? "Lunch Token Claimed" : "Food Token Active"}
                        </span>
                      </div>

                      {/* Food & Lunch Token Box */}
                      <div className="bg-amber-100/70 border border-amber-300/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs max-w-md">
                        <div className="flex items-center gap-2 text-amber-950 font-bold">
                          <Utensils className="w-4 h-4 text-amber-700" />
                          <span>Lunch & Food Token</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={pass.foodTokenClaimed || updatingFoodPref}
                            onClick={handleToggleFoodPreference}
                            title={pass.foodTokenClaimed ? "Meal already redeemed" : "Click to switch dietary preference"}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
                              pass.foodTokenClaimed ? "cursor-default opacity-80" : "cursor-pointer hover:scale-105 active:scale-95"
                            } ${
                              (pass.foodPreference || "VEG") === "VEG"
                                ? "bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
                                : "bg-amber-600 text-white shadow-2xs hover:bg-amber-700"
                            }`}
                          >
                            <span>{(pass.foodPreference || "VEG") === "VEG" ? "🥗 Pure Veg" : "🍗 Non-Veg"}</span>
                            {!pass.foodTokenClaimed && (
                              <span className="text-[9px] opacity-80 font-medium ml-0.5 underline">
                                {updatingFoodPref ? "Saving..." : "Switch"}
                              </span>
                            )}
                          </button>
                          <span className="font-mono font-black text-stone-900 bg-white px-2.5 py-0.5 rounded border border-amber-300 shadow-2xs">
                            {pass.foodTokenCode}
                          </span>
                        </div>
                      </div>

                      {/* Events Enrolled */}
                      <div className="text-xs text-stone-600">
                        <div className="text-[10px] font-bold uppercase text-stone-400 mb-1">
                          Events Participating ({registrations.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {registrations.map((reg) => (
                            <span
                              key={reg.id}
                              className="text-[11px] bg-white border border-stone-200 rounded px-2.5 py-0.5 text-stone-800 font-bold shadow-2xs"
                            >
                              {reg.event.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* QR Codes & View & Print ID Card Action */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-stone-200">
                      <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                        {pass.qrData && (
                          <div
                            onClick={() =>
                              setEnlargedQr({
                                title: "Event Registration Entry Pass",
                                subtitle: pass.name,
                                code: pass.badgeCode,
                                qrData: pass.qrData!,
                                badgeType: "EVENT",
                                statusText: pass.eventCheckedIn ? "✓ Venue Entry Checked In" : "Ready for Gate Scan",
                              })
                            }
                            className="text-center group cursor-pointer p-2 rounded-2xl bg-white border border-stone-200 hover:border-stone-400 hover:shadow-md transition-all"
                            title="Tap to zoom Event Pass QR"
                          >
                            <div className="relative inline-block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={pass.qrData}
                                alt={`Event Pass QR for ${pass.badgeCode}`}
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl p-1 bg-white"
                                style={{ imageRendering: "pixelated" }}
                              />
                              <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Zoom</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-stone-800 block mt-1 uppercase tracking-wider">
                              1. Event Entry QR
                            </span>
                            <span className="font-mono text-[9px] text-stone-500 font-semibold block truncate">
                              {pass.badgeCode}
                            </span>
                          </div>
                        )}

                        {pass.foodQrData && (
                          <div
                            onClick={() =>
                              setEnlargedQr({
                                title: "Official Food & Meal Token",
                                subtitle: `${pass.name} • ${pass.foodPreference === "NON_VEG" ? "🍗 Non-Veg" : "🥗 Pure Veg"}`,
                                code: pass.foodTokenCode,
                                qrData: pass.foodQrData!,
                                badgeType: "FOOD",
                                statusText: pass.foodTokenClaimed ? "✓ Meal Already Redeemed" : "Ready for Food Counter Scan",
                              })
                            }
                            className="text-center group cursor-pointer p-2 rounded-2xl bg-amber-50/40 border border-amber-300/70 hover:border-amber-500 hover:shadow-md transition-all"
                            title="Tap to zoom Food Token QR"
                          >
                            <div className="relative inline-block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={pass.foodQrData}
                                alt={`Food QR for ${pass.foodTokenCode}`}
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl p-1 bg-white border border-amber-200"
                                style={{ imageRendering: "pixelated" }}
                              />
                              <div className="absolute inset-0 bg-amber-950/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Zoom</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-amber-900 block mt-1 uppercase tracking-wider">
                              2. Food Token QR
                            </span>
                            <span className="font-mono text-[9px] text-amber-700 font-semibold block truncate">
                              {pass.foodTokenCode}
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/badge/${encodeURIComponent(pass.badgeCode)}`}
                        target="_blank"
                        className="btn-ember w-full text-center text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>View & Print ID Card</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* High-Scannability Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="dash-card p-5 border-l-4 border-l-emerald-500">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Confirmed Entries
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {confirmed.length}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ready for venue check-in</span>
            </div>
          </div>

          <div className="dash-card p-5 border-l-4 border-l-amber-500">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Approval
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {pending.length}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1 inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Awaiting coordinator review</span>
            </div>
          </div>

          <div className="dash-card p-5 border-l-4 border-l-slate-400">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Registrations
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {registrations.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Across on-stage & off-stage
            </div>
          </div>
        </div>

        {/* Registrations List */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>My Registered Competitions</span>
            <span className="text-xs font-medium text-slate-500">
              {registrations.length} total event(s)
            </span>
          </h2>

          {registrations.length === 0 ? (
            <div className="dash-card p-12 text-center max-w-md mx-auto">
              <ClipboardList className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No Event Registrations Found
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                You have not registered for any SHINE 26 competitions yet. Browse the lineup and enroll today!
              </p>
              <Link
                href="/register"
                className="tap-target px-5 py-2.5 bg-orange-600 text-white rounded-lg text-xs font-bold"
              >
                Explore & Register Events
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => {
                const eventDate = new Date(reg.event.dateTime);
                const borderClass =
                  reg.status === "CONFIRMED"
                    ? "dash-row-confirmed"
                    : reg.status === "REJECTED"
                    ? "dash-row-rejected"
                    : "dash-row-pending";

                return (
                  <div
                    key={reg.id}
                    className={`dash-card p-5 sm:p-6 transition-all ${borderClass}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase inline-flex items-center gap-1.5">
                            {reg.event.category === "ON_STAGE" ? (
                              <>
                                <Theater className="w-3.5 h-3.5" />
                                <span>On-Stage</span>
                              </>
                            ) : (
                              <>
                                <Laptop className="w-3.5 h-3.5" />
                                <span>Off-Stage</span>
                              </>
                            )}
                          </span>

                          {reg.status === "CONFIRMED" && (
                            <span className="status-badge status-badge-confirmed inline-flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Confirmed</span>
                            </span>
                          )}
                          {reg.status === "PENDING" && (
                            <span className="status-badge status-badge-pending inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Pending Review</span>
                            </span>
                          )}
                          {reg.status === "REJECTED" && (
                            <span className="status-badge status-badge-rejected inline-flex items-center gap-1">
                              <X className="w-3 h-3" />
                              <span>Rejected</span>
                            </span>
                          )}

                          {reg.result && (
                            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                              <Trophy className="w-3.5 h-3.5 text-amber-700" />
                              <span>Award: {reg.result}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-slate-900">
                          {reg.event.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          {reg.event.venue && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>Venue: <strong className="text-slate-700">{reg.event.venue}</strong></span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Time:{" "}
                              <strong className="text-slate-700 tabular-nums">
                                {eventDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </strong>
                            </span>
                          </span>
                          {(reg.event.staffCoordinator || reg.event.coordinator) && (
                            <span>
                              Coordinator: <strong className="text-slate-700">{(reg.event.staffCoordinator || reg.event.coordinator)?.name}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-left md:text-right shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto">
                        <div className="text-[11px] text-slate-400">Registration Reference</div>
                        <div className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                          REG-{reg.id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(reg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tap-to-Zoom Large QR Modal for Optical Scanning */}
      {enlargedQr && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setEnlargedQr(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center relative border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEnlargedQr(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 bg-stone-100 text-stone-800 border border-stone-300">
              {enlargedQr.badgeType === "FOOD" ? (
                <>
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  <span>Official Food Voucher</span>
                </>
              ) : (
                <>
                  <QrCode className="w-3.5 h-3.5 text-stone-800" />
                  <span>Official Event Pass</span>
                </>
              )}
            </div>

            <h3 className="text-lg font-black text-stone-900 tracking-tight">
              {enlargedQr.title}
            </h3>
            <p className="text-xs text-stone-500 mb-4">{enlargedQr.subtitle}</p>

            {/* High-Contrast Large QR Container */}
            <div className="bg-white p-4 rounded-2xl border-2 border-stone-900 shadow-inner inline-block mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enlargedQr.qrData}
                alt={enlargedQr.title}
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                style={{ imageRendering: "pixelated" }}
              />
            </div>

            <div className="mt-4">
              <div className="font-mono text-sm font-black text-stone-900 bg-stone-100 px-4 py-2 rounded-xl border border-stone-300 inline-block tracking-wider shadow-2xs">
                {enlargedQr.code}
              </div>
            </div>

            {enlargedQr.statusText && (
              <div className="mt-3 text-xs font-semibold text-stone-600">
                {enlargedQr.statusText}
              </div>
            )}

            <p className="mt-4 text-[11px] text-stone-400 font-medium">
              Present this enlarged screen to the coordinator or food desk scanner.
            </p>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
