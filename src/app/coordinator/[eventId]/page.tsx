"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Download, Theater, Laptop, MapPin, Clock, Check, X, QrCode, Utensils, Trophy, Save, Target } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
import CheckInModal from "@/components/CheckInModal";

interface RegistrationRow {
  id: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  result: string | null;
  score: number | null;
  createdAt: string;
  attended?: boolean;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  isPrelimsParticipant?: boolean;
  prelimsStatus?: string | null;
  prelimsScore?: number | null;
  prelimsNotes?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    college: string | null;
  };
  delegation?: {
    id: string;
    collegeName: string;
    teamName: string | null;
    teamLeadName: string;
    teamLeadPhone: string;
    staffInchargeName: string | null;
    staffInchargePhone: string | null;
  } | null;
  delegationMember?: {
    id: string;
    badgeCode: string;
    foodTokenCode: string;
    eventCheckedIn?: boolean;
    eventCheckedInAt?: string | null;
    foodTokenClaimed?: boolean;
    foodClaimedAt?: string | null;
  } | null;
}

interface EventMeta {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  venue: string | null;
  dateTime: string;
  capacity: number | null;
  rules?: string | null;
  hasPrelims?: boolean;
  prelimsDateTime?: string | null;
  prelimsVenue?: string | null;
  prelimsRules?: string | null;
  staffCoordinator?: {
    name: string;
    email: string;
  } | null;
  studentCoordinator?: {
    name: string;
    email: string;
  } | null;
  coordinator?: {
    name: string;
    email: string;
  } | null;
}

export default function CoordinatorEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;

  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventMeta | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"participants" | "prelims" | "scores">("participants");

  // Search & filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Editing results & scores state
  const [resultInputs, setResultInputs] = useState<{ [regId: string]: string }>({});
  const [scoreInputs, setScoreInputs] = useState<{ [regId: string]: string }>({});

  // Editing prelims state
  const [prelimsStatusInputs, setPrelimsStatusInputs] = useState<{ [regId: string]: string }>({});
  const [prelimsScoreInputs, setPrelimsScoreInputs] = useState<{ [regId: string]: string }>({});
  const [prelimsNotesInputs, setPrelimsNotesInputs] = useState<{ [regId: string]: string }>({});

  const loadEventData = useCallback(async () => {
    try {
      const res = await fetch(`/api/coordinator/events/${eventId}/registrations`);
      const data = await safeJson(res, { success: false, message: "Network error loading data." });
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to load event registrations.");
        setLoading(false);
        return;
      }

      setEvent(data.event);
      setRegistrations(data.registrations || []);

      const initialResults: { [regId: string]: string } = {};
      const initialScores: { [regId: string]: string } = {};
      const initialPrelimsStatus: { [regId: string]: string } = {};
      const initialPrelimsScores: { [regId: string]: string } = {};
      const initialPrelimsNotes: { [regId: string]: string } = {};

      (data.registrations || []).forEach((r: RegistrationRow) => {
        initialResults[r.id] = r.result || "";
        initialScores[r.id] = r.score !== null && r.score !== undefined ? String(r.score) : "";
        initialPrelimsStatus[r.id] = r.prelimsStatus || "PENDING";
        initialPrelimsScores[r.id] = r.prelimsScore !== null && r.prelimsScore !== undefined ? String(r.prelimsScore) : "";
        initialPrelimsNotes[r.id] = r.prelimsNotes || "";
      });
      setResultInputs(initialResults);
      setScoreInputs(initialScores);
      setPrelimsStatusInputs(initialPrelimsStatus);
      setPrelimsScoreInputs(initialPrelimsScores);
      setPrelimsNotesInputs(initialPrelimsNotes);
    } catch (err) {
      console.error("Error loading event participants:", err);
      setErrorMsg("Could not connect to the database.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/coordinator/${eventId}`);
      return;
    }

    if (status === "authenticated") {
      loadEventData();
    }
  }, [status, eventId, router, loadEventData]);

  const handleSavePrelims = async (regId: string, customStatus?: string) => {
    setSavingId(regId);
    const pStatus = customStatus || prelimsStatusInputs[regId] || "PENDING";
    const pScore = prelimsScoreInputs[regId];
    const pNotes = prelimsNotesInputs[regId];

    try {
      const res = await fetch(`/api/coordinator/registrations/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prelimsStatus: pStatus,
          prelimsScore: pScore !== "" && pScore !== undefined ? parseFloat(pScore) : null,
          prelimsNotes: pNotes || null,
        }),
      });

      const data = await safeJson(res, { success: false, message: "Network error occurred." });
      if (data.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === regId
              ? {
                  ...r,
                  prelimsStatus: pStatus,
                  prelimsScore: pScore !== "" && pScore !== undefined ? parseFloat(pScore) : null,
                  prelimsNotes: pNotes || null,
                }
              : r
          )
        );
        setPrelimsStatusInputs((prev) => ({ ...prev, [regId]: pStatus }));
        toast.success(`Prelims status updated to ${pStatus}.`);
      } else {
        toast.error(data.message || "Failed to update prelims status.");
      }
    } catch (err) {
      console.error("Save prelims error:", err);
      toast.error("Error saving prelims status.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveResult = async (regId: string) => {
    setSavingId(regId);
    const newResult = resultInputs[regId];
    try {
      const res = await fetch(`/api/coordinator/registrations/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: newResult }),
      });

      const data = await safeJson(res, { success: false, message: "Network error occurred." });
      if (data.success) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === regId ? { ...r, result: newResult } : r))
        );
        toast.success("Award / position updated successfully.");
      } else {
        toast.error(data.message || "Failed to save award result.");
      }
    } catch (err) {
      console.error("Save result error:", err);
      toast.error("Error saving result.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveScore = async (regId: string) => {
    setSavingId(regId);
    const newScore = scoreInputs[regId];
    const newResult = resultInputs[regId];
    try {
      const res = await fetch(`/api/coordinator/registrations/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: newScore !== "" && newScore !== undefined ? parseFloat(newScore) : null,
          result: newResult || null,
        }),
      });

      const data = await safeJson(res, { success: false, message: "Network error occurred." });
      if (data.success) {
        setRegistrations((prev) =>
          prev.map((r) =>
            r.id === regId
              ? {
                  ...r,
                  score: newScore !== "" && newScore !== undefined ? parseFloat(newScore) : null,
                  result: newResult || null,
                }
              : r
          )
        );
        toast.success("Score and Result updated successfully.");
      } else {
        toast.error(data.message || "Failed to save score.");
      }
    } catch (err) {
      console.error("Save score error:", err);
      toast.error("Error saving score.");
    } finally {
      setSavingId(null);
    }
  };

  const handleBulkSaveScores = async () => {
    setIsSaving(true);
    let savedCount = 0;
    try {
      for (const reg of registrations) {
        const sc = scoreInputs[reg.id];
        const rs = resultInputs[reg.id];
        if (sc !== undefined || rs !== undefined) {
          try {
            await fetch(`/api/coordinator/registrations/${reg.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                score: sc !== "" && sc !== undefined ? parseFloat(sc) : null,
                result: rs || null,
              }),
            });
            savedCount++;
          } catch {}
        }
      }
      toast.success(`Successfully saved scores for ${savedCount} participants.`);
      await loadEventData();
    } catch (err) {
      console.error("Bulk save error:", err);
      toast.error("An error occurred while saving scores.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportScoreSheetCSV = () => {
    if (!event || registrations.length === 0) return;
    const headers = ["Badge ID", "Student Name", "Email", "Phone", "College", "Team", "Attendance", "Score", "Award / Position"];
    const rows = registrations.map((r) => [
      `"${r.delegationMember?.badgeCode || ""}"`,
      `"${r.user.name}"`,
      `"${r.user.email}"`,
      `"${r.user.phone || ""}"`,
      `"${r.delegation?.collegeName || r.user.college || ""}"`,
      `"${r.delegation?.teamName || ""}"`,
      `"${r.attended || r.delegationMember?.eventCheckedIn ? "PRESENT" : "ABSENT"}"`,
      `"${scoreInputs[r.id] ?? r.score ?? ""}"`,
      `"${resultInputs[r.id] ?? r.result ?? ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${event.name.replace(/\s+/g, "_")}_Official_Score_Sheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCSV = () => {
    if (!event || registrations.length === 0) return;
    const headers = ["Name", "Email", "Phone", "College", "Status", "Attendance", "Score", "Result", "Registration Date"];
    const rows = registrations.map((r) => [
      `"${r.user.name}"`,
      `"${r.user.email}"`,
      `"${r.user.phone || ""}"`,
      `"${r.user.college || ""}"`,
      `"${r.status}"`,
      `"${r.attended || r.delegationMember?.eventCheckedIn ? "PRESENT" : "ABSENT"}"`,
      `"${scoreInputs[r.id] ?? r.score ?? ""}"`,
      `"${r.result || ""}"`,
      `"${new Date(r.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${event.name.replace(/\s+/g, "_")}_Participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === "loading" || loading) {
    return (
      <main className="dash-layout flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading registrations...</p>
        </div>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="dash-layout p-8 flex items-center justify-center">
        <div className="dash-card p-10 max-w-md text-center">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Forbidden</h2>
          <p className="text-xs text-slate-600 mb-6">{errorMsg}</p>
          <Link href="/coordinator" className="tap-target px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">
            ← Back to Assigned Events
          </Link>
        </div>
      </main>
    );
  }

  const filtered = registrations.filter((r) => {
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const college = r.delegation?.collegeName || r.user.college || "";
    const team = r.delegation?.teamName || "";
    const badge = r.delegationMember?.badgeCode || "";
    const matchesSearch =
      r.user.name.toLowerCase().includes(search.toLowerCase()) ||
      r.user.email.toLowerCase().includes(search.toLowerCase()) ||
      college.toLowerCase().includes(search.toLowerCase()) ||
      team.toLowerCase().includes(search.toLowerCase()) ||
      badge.toLowerCase().includes(search.toLowerCase()) ||
      (r.user.phone && r.user.phone.includes(search));
    return matchesStatus && matchesSearch;
  });

  return (
    <main className="dash-layout flex flex-col min-h-screen">
      {/* Light Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="container-shine py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/coordinator" className="hover:text-slate-900">
              Coordinator Console
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">{event?.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCheckInModal(true)}
              className="tap-target px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Check-In & Food</span>
            </button>
            <button
              onClick={exportCSV}
              className="tap-target px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/coordinator"
              className="tap-target px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              ← Console
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="container-shine py-8 flex-1">
        {/* Event Meta Banner */}
        <div className="dash-card p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase inline-flex items-center gap-1.5">
                  {event?.category === "ON_STAGE" ? (
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
                {event?.capacity ? (
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded tabular-nums">
                    Max: {event.capacity} Slots
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Unlimited Capacity
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {event?.name} — Participant Triage
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                {event?.venue && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    Venue: <strong className="text-slate-700">{event.venue}</strong>
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Scheduled:{" "}
                  <strong className="text-slate-700 tabular-nums">
                    {event?.dateTime ? new Date(event.dateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "TBD"}
                  </strong>
                </span>
                {(event?.staffCoordinator || event?.coordinator) && (
                  <span className="inline-flex items-center gap-1">
                    Staff: <strong className="text-slate-700">{event.staffCoordinator?.name || event.coordinator?.name}</strong>
                  </span>
                )}
                {event?.studentCoordinator && (
                  <span className="inline-flex items-center gap-1">
                    Student: <strong className="text-blue-700">{event.studentCoordinator.name}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-500">Total Registered</div>
              <div className="text-3xl font-black text-slate-900 tabular-nums">
                {registrations.length}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Horizontal swipeable on mobile) */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("participants")}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === "participants"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Participant Triage & Check-In ({registrations.length})</span>
          </button>
          {event?.hasPrelims && (
            <button
              type="button"
              onClick={() => setActiveTab("prelims")}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === "prelims"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Prelims Evaluation ({registrations.filter((r) => r.isPrelimsParticipant).length} Nominated)</span>
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("scores")}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "scores"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Scores & Awards Evaluation Table</span>
          </button>
        </div>

        {activeTab === "participants" && (
          <>
            {/* Triage Search & Filters (44px min tap targets) */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by student name, college, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-11 bg-white border border-slate-300 rounded-xl px-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex bg-white border border-slate-200 rounded-xl p-1 shrink-0 self-start sm:self-auto">
                {["ALL", "PENDING", "CONFIRMED", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`tap-target px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === st
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Participant Table with Status Left Borders */}
            <div className="dash-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Student Participant</th>
                  <th className="p-4">College</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Event Check-In & Food</th>
                  <th className="p-4">Approval Status</th>
                  <th className="p-4">Competition Award / Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-xs text-slate-500">
                      No participants found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((reg) => {
                    const isSaving = savingId === reg.id;
                    const borderClass =
                      reg.status === "CONFIRMED"
                        ? "dash-row-confirmed"
                        : reg.status === "REJECTED"
                        ? "dash-row-rejected"
                        : "dash-row-pending";

                    return (
                      <tr key={reg.id} className={`hover:bg-slate-50/70 transition-colors ${borderClass}`}>
                        {/* Student Name & Badge */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{reg.user.name}</span>
                            {reg.delegationMember?.badgeCode && (
                              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                {reg.delegationMember.badgeCode}
                              </span>
                            )}
                          </div>
                          {reg.delegation?.teamName && (
                            <div className="text-[11px] font-medium text-slate-600">
                              Team: <strong className="text-slate-800">{reg.delegation.teamName}</strong>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400">
                            Reg: {new Date(reg.createdAt).toLocaleDateString("en-IN")}
                          </div>
                        </td>

                        {/* College & Contingent Lead / Faculty */}
                        <td className="p-4 max-w-[200px]">
                          <div className="text-slate-900 font-semibold text-xs sm:text-sm truncate">
                            {reg.delegation?.collegeName || reg.user.college || "N/A"}
                          </div>
                          {reg.delegation?.staffInchargeName ? (
                            <div className="text-[11px] text-amber-800 font-medium truncate mt-0.5">
                              Faculty: {reg.delegation.staffInchargeName}
                              {reg.delegation.staffInchargePhone && ` (${reg.delegation.staffInchargePhone})`}
                            </div>
                          ) : reg.delegation?.teamLeadName ? (
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              Lead: {reg.delegation.teamLeadName}
                            </div>
                          ) : null}
                        </td>

                        {/* Contact */}
                        <td className="p-4 text-xs space-y-0.5">
                          <div className="text-slate-900">{reg.user.email}</div>
                          <div className="text-slate-500 font-mono tabular-nums">{reg.user.phone || "—"}</div>
                        </td>

                        {/* Event Check-In & Food Claim Badges */}
                        <td className="p-4">
                          <div className="flex flex-col gap-1.5">
                            {(reg.attended || reg.delegationMember?.eventCheckedIn) ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded w-fit">
                                <Check className="w-3 h-3" />
                                Present
                                {reg.delegationMember?.eventCheckedInAt && (
                                  <span className="text-[9px] font-normal text-emerald-600 ml-1">
                                    {new Date(reg.delegationMember.eventCheckedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit">
                                Absent
                              </span>
                            )}

                            {reg.delegationMember?.foodTokenClaimed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded w-fit">
                                <Utensils className="w-3 h-3" />
                                Food Received
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded w-fit">
                                Meal Pending
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Approval Status Badge (Read-Only for Coordinator, Admin holds approval authority) */}
                        <td className="p-4">
                          <span
                            className={`status-badge ${
                              reg.status === "CONFIRMED"
                                ? "status-badge-confirmed"
                                : reg.status === "PENDING"
                                ? "status-badge-pending"
                                : "status-badge-rejected"
                            }`}
                          >
                            {reg.status}
                          </span>
                        </td>

                        {/* Award Result Input */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="e.g. 1st Place / Distinction"
                              value={resultInputs[reg.id] || ""}
                              onChange={(e) =>
                                setResultInputs((prev) => ({
                                  ...prev,
                                  [reg.id]: e.target.value,
                                }))
                              }
                              className="h-9 w-32 sm:w-40 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                            />
                            <button
                              disabled={isSaving}
                              onClick={() => handleSaveResult(reg.id)}
                              className="tap-target h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              {isSaving ? "..." : "Save"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}

    {activeTab === "prelims" && (
          <div className="space-y-6">
            {/* Prelims Header Callout */}
            <div className="bg-[#FAF8F5] border border-amber-300 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full border border-amber-400 inline-flex items-center gap-1.5">
                      <Target className="w-3 h-3 text-amber-900" />
                      <span>Preliminary Evaluation Desk</span>
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-stone-900">
                    {event?.name} — Prelims Round
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-1">
                    {event?.prelimsVenue && (
                      <span>Venue: <strong className="text-stone-900">{event.prelimsVenue}</strong></span>
                    )}
                    <span>
                      Schedule:{" "}
                      <strong className="text-stone-900 tabular-nums">
                        {event?.prelimsDateTime ? new Date(event.prelimsDateTime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "TBD"}
                      </strong>
                    </span>
                    <span className="font-bold text-amber-900">
                      Nominated Participants: {registrations.filter((r) => r.isPrelimsParticipant).length}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-amber-300 rounded-xl p-3 text-right">
                  <div className="text-[10px] font-bold text-stone-500 uppercase">Qualified for Finals</div>
                  <div className="text-xl font-black text-emerald-700 tabular-nums">
                    {registrations.filter((r) => r.isPrelimsParticipant && r.prelimsStatus === "QUALIFIED").length}
                  </div>
                </div>
              </div>

              {event?.prelimsRules && (
                <div className="p-3 bg-white/80 border border-amber-200 rounded-xl text-xs text-amber-950 whitespace-pre-wrap font-mono leading-relaxed">
                  <strong>Evaluation Guidelines:</strong> {event.prelimsRules}
                </div>
              )}
            </div>

            {/* Prelims Participant Table */}
            <div className="dash-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-50 text-stone-500 text-[11px] uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-4">Nominated Delegate</th>
                      <th className="p-4">College Delegation</th>
                      <th className="p-4">Prelims Attendance</th>
                      <th className="p-4">Qualification Status</th>
                      <th className="p-4">Score (Marks)</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {registrations.filter((r) => r.isPrelimsParticipant).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-xs text-stone-400">
                          No student participants have been nominated for the Prelims round of this competition yet.
                        </td>
                      </tr>
                    ) : (
                      registrations
                        .filter((r) => r.isPrelimsParticipant)
                        .map((reg) => {
                          const currentPStatus = prelimsStatusInputs[reg.id] || reg.prelimsStatus || "PENDING";
                          const isSaving = savingId === reg.id;
                          const isAttended = reg.attended || reg.delegationMember?.eventCheckedIn;

                          return (
                            <tr key={reg.id} className="hover:bg-stone-50/70 transition-colors">
                              {/* Delegate Info */}
                              <td className="p-4">
                                <div className="font-bold text-stone-900 text-sm">{reg.user.name}</div>
                                <div className="text-[11px] text-stone-500">{reg.user.email}</div>
                                {reg.delegationMember?.badgeCode && (
                                  <span className="inline-block mt-1 text-[10px] font-mono font-bold bg-amber-100/80 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                                    Badge: {reg.delegationMember.badgeCode}
                                  </span>
                                )}
                              </td>

                              {/* College & Team */}
                              <td className="p-4">
                                <div className="font-bold text-stone-900 text-xs">
                                  {reg.delegation?.collegeName || reg.user.college || "N/A"}
                                </div>
                                {reg.delegation?.teamName && (
                                  <div className="text-[11px] text-amber-800 font-medium mt-0.5">
                                    Team: {reg.delegation.teamName}
                                  </div>
                                )}
                              </td>

                              {/* Attendance Status */}
                              <td className="p-4">
                                {isAttended ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Present
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                                    Gate Pending
                                  </span>
                                )}
                              </td>

                              {/* Qualification Toggle Buttons */}
                              <td className="p-4">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleSavePrelims(reg.id, "QUALIFIED")}
                                    className={`tap-target px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                      currentPStatus === "QUALIFIED"
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>QUALIFIED</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleSavePrelims(reg.id, "ELIMINATED")}
                                    className={`tap-target px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                      currentPStatus === "ELIMINATED"
                                        ? "bg-rose-600 text-white shadow-xs"
                                        : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
                                    }`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>ELIMINATED</span>
                                  </button>

                                  {currentPStatus === "PENDING" && (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                      PENDING
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Score Field */}
                              <td className="p-4">
                                <input
                                  type="number"
                                  placeholder="Marks / 100"
                                  value={prelimsScoreInputs[reg.id] || ""}
                                  onChange={(e) =>
                                    setPrelimsScoreInputs((prev) => ({
                                      ...prev,
                                      [reg.id]: e.target.value,
                                    }))
                                  }
                                  className="h-9 w-28 bg-white border border-stone-300 rounded-lg px-2 text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                                />
                              </td>

                              {/* Action */}
                              <td className="p-4 text-right">
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleSavePrelims(reg.id)}
                                  className="tap-target px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  {isSaving ? "Saving..." : "Save Prelims"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "scores" && (
      <div className="space-y-4">
        {/* Score Table Header Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Official Marks & Awards Evaluation Sheet
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Enter jury marks and assign rankings for {event?.name}. Changes can be saved individually or in bulk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={exportScoreSheetCSV}
              className="tap-target flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleBulkSaveScores}
              className="tap-target flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Bulk Save All Scores</span>
            </button>
          </div>
        </div>

        {/* Scores Table */}
        <div className="dash-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Participant / Badge</th>
                  <th className="p-4">College & Team</th>
                  <th className="p-4">Attendance</th>
                  <th className="p-4">Score (Marks)</th>
                  <th className="p-4">Award / Position</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No registered participants found for this event.
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg) => {
                    const isAttended = reg.attended || reg.delegationMember?.eventCheckedIn;
                    return (
                      <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{reg.user.name}</div>
                          <div className="text-[11px] text-slate-500">{reg.user.email}</div>
                          {reg.delegationMember?.badgeCode && (
                            <span className="inline-block mt-1 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                              {reg.delegationMember.badgeCode}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {reg.delegation?.collegeName || reg.user.college || "Independent"}
                          </div>
                          {reg.delegation?.teamName && (
                            <div className="text-[11px] text-orange-600 font-medium">
                              Team: {reg.delegation.teamName}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {isAttended ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Absent
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              placeholder="0 - 100"
                              value={scoreInputs[reg.id] !== undefined ? scoreInputs[reg.id] : (reg.score ?? "")}
                              onChange={(e) =>
                                setScoreInputs((prev) => ({
                                  ...prev,
                                  [reg.id]: e.target.value,
                                }))
                              }
                              className="h-9 w-24 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                            />
                            <span className="text-[11px] text-slate-400 font-medium">/ 100</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <input
                            type="text"
                            placeholder="e.g. 1st Place / Distinction"
                            value={resultInputs[reg.id] !== undefined ? resultInputs[reg.id] : (reg.result ?? "")}
                            onChange={(e) =>
                              setResultInputs((prev) => ({
                                ...prev,
                                [reg.id]: e.target.value,
                              }))
                            }
                            className="h-9 w-44 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                          />
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveScore(reg.id)}
                            className="tap-target h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
  </div>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        SHINE 26 Event Management System • Sacred Heart College (Autonomous)
      </footer>

      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        activeEventId={eventId}
        onCheckInComplete={loadEventData}
      />
    </main>
  );
}
