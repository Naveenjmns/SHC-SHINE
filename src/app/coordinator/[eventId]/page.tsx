"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Download, Theater, Laptop, MapPin, Clock, Check, X, QrCode, Utensils, Trophy, Save, Target } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
import CheckInModal from "@/components/CheckInModal";
import Footer from "@/components/Footer";

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
  delegationId?: string | null;
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
    paymentStatus?: string | null;
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

interface FinalistTeam {
  teamKey: string;
  primaryRegistration: RegistrationRow;
  members: RegistrationRow[];
  collegeName: string;
  teamName: string | null;
  isAttended: boolean;
  score: number | null;
  result: string | null;
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

  const [showPendingPrelims, setShowPendingPrelims] = useState(false);

  // Tab 2: Prelims Subsets (Only CONFIRMED and non-rejected registrations are eligible)
  const eligiblePrelims = registrations.filter(
    (r) =>
      r.isPrelimsParticipant &&
      r.status === "CONFIRMED" &&
      r.delegation?.paymentStatus !== "REJECTED"
  );

  // Present in Prelims (gate checked in / attended) -> Main evaluation table
  const presentPrelims = eligiblePrelims.filter(
    (r) => r.attended || r.delegationMember?.eventCheckedIn
  );

  // Absent / Gate-Pending in Prelims
  const pendingPrelims = eligiblePrelims.filter(
    (r) => !r.attended && !r.delegationMember?.eventCheckedIn
  );

  // Tab 3: Teams for "Scores & Awards Evaluation Table":
  // - If event has prelims: Team is eligible if at least one member is present/checked-in
  //   AND at least one member (e.g. prelims nominee) has QUALIFIED in Prelims.
  // - If event has NO prelims: Team is eligible if at least one member is present/checked-in.
  const finalsTeams: FinalistTeam[] = (() => {
    const approvedRegistrations = registrations.filter(
      (r) => r.status === "CONFIRMED" && r.delegation?.paymentStatus !== "REJECTED"
    );

    const groups = new Map<string, RegistrationRow[]>();
    for (const reg of approvedRegistrations) {
      const delId = reg.delegation?.id || reg.delegationId;
      const key = delId ? `del_${delId}` : `solo_${reg.id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(reg);
    }

    const resultList: FinalistTeam[] = [];

    for (const [key, teamMembers] of groups.entries()) {
      const isAttended = teamMembers.some(
        (m) => m.attended || m.delegationMember?.eventCheckedIn
      );
      if (!isAttended) continue;

      if (event?.hasPrelims) {
        const isQualified = teamMembers.some(
          (m) => (prelimsStatusInputs[m.id] || m.prelimsStatus) === "QUALIFIED"
        );
        if (!isQualified) continue;
      }

      const primaryRegistration =
        teamMembers.find((m) => m.isPrelimsParticipant) || teamMembers[0];

      const collegeName =
        primaryRegistration.delegation?.collegeName ||
        primaryRegistration.user.college ||
        "Independent";
      const teamName = primaryRegistration.delegation?.teamName || null;

      const score =
        primaryRegistration.score !== null && primaryRegistration.score !== undefined
          ? primaryRegistration.score
          : teamMembers.find((m) => m.score !== null && m.score !== undefined)?.score ?? null;

      const result =
        primaryRegistration.result ||
        teamMembers.find((m) => m.result)?.result ||
        null;

      resultList.push({
        teamKey: key,
        primaryRegistration,
        members: teamMembers,
        collegeName,
        teamName,
        isAttended,
        score,
        result,
      });
    }

    return resultList;
  })();

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

        const currentReg = registrations.find((r) => r.id === regId);
        const currentDelId = currentReg?.delegation?.id || currentReg?.delegationId;
        const teamMates = currentDelId
          ? registrations.filter(
              (r) => (r.delegation?.id || r.delegationId) === currentDelId && r.id !== regId
            )
          : [];

        if (pStatus === "QUALIFIED" && teamMates.length > 0) {
          toast.success(
            `Nominee qualified! Entire team (${teamMates.length + 1} members) promoted to Finals.`
          );
        } else {
          toast.success(`Prelims status updated to ${pStatus}.`);
        }
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

  const handleSaveResult = async (regId: string, customResult?: string) => {
    setSavingId(regId);
    const newResult = customResult !== undefined ? customResult : resultInputs[regId];
    try {
      const res = await fetch(`/api/coordinator/registrations/${regId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: newResult || null }),
      });

      const data = await safeJson(res, { success: false, message: "Network error occurred." });
      if (data.success) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === regId ? { ...r, result: newResult || null } : r))
        );
        setResultInputs((prev) => ({ ...prev, [regId]: newResult || "" }));
        toast.success(newResult ? `Award position set to ${newResult}.` : "Award cleared.");
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

  const handleSaveScore = async (team: FinalistTeam) => {
    const primaryId = team.primaryRegistration.id;
    setSavingId(primaryId);
    const newScore = scoreInputs[primaryId];
    const newResult = resultInputs[primaryId];

    try {
      const parsedScore = newScore !== "" && newScore !== undefined ? parseFloat(newScore) : null;
      const parsedResult = newResult || null;

      const updatePromises = team.members.map((m) =>
        fetch(`/api/coordinator/registrations/${m.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: parsedScore,
            result: parsedResult,
          }),
        })
      );

      const results = await Promise.all(updatePromises);
      const allOk = results.every((r) => r.ok);

      if (allOk) {
        const memberIdSet = new Set(team.members.map((m) => m.id));

        // If assigning a podium position, clear any previous holder in DB
        if (parsedResult) {
          const previousHolders = registrations.filter(
            (r) => !memberIdSet.has(r.id) && r.result === parsedResult
          );
          if (previousHolders.length > 0) {
            await Promise.all(
              previousHolders.map((ph) =>
                fetch(`/api/coordinator/registrations/${ph.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ result: null }),
                }).catch(() => {})
              )
            );
            const prevHolderIds = new Set(previousHolders.map((ph) => ph.id));
            setRegistrations((prev) =>
              prev.map((r) =>
                prevHolderIds.has(r.id)
                  ? { ...r, result: null }
                  : memberIdSet.has(r.id)
                  ? { ...r, score: parsedScore, result: parsedResult }
                  : r
              )
            );
          } else {
            setRegistrations((prev) =>
              prev.map((r) =>
                memberIdSet.has(r.id)
                  ? { ...r, score: parsedScore, result: parsedResult }
                  : r
              )
            );
          }
        } else {
          setRegistrations((prev) =>
            prev.map((r) =>
              memberIdSet.has(r.id)
                ? { ...r, score: parsedScore, result: parsedResult }
                : r
            )
          );
        }

        setScoreInputs((prev) => {
          const updated = { ...prev };
          team.members.forEach((m) => {
            if (newScore !== undefined) updated[m.id] = newScore;
          });
          return updated;
        });

        setResultInputs((prev) => {
          const updated = { ...prev };
          team.members.forEach((m) => {
            if (newResult !== undefined) updated[m.id] = newResult;
          });
          return updated;
        });

        toast.success(
          team.members.length > 1
            ? `Scores & Awards updated for Team (${team.members.length} members).`
            : "Score and Result updated successfully."
        );
      } else {
        toast.error("Failed to save score for all team members.");
      }
    } catch (err) {
      console.error("Save score error:", err);
      toast.error("Error saving score.");
    } finally {
      setSavingId(null);
    }
  };

  const handleTogglePodiumPosition = (team: FinalistTeam, targetPosition: string) => {
    const primaryId = team.primaryRegistration.id;
    const currentVal =
      resultInputs[primaryId] !== undefined ? resultInputs[primaryId] : (team.result ?? "");
    const isAlreadySelected = currentVal === targetPosition;
    const nextVal = isAlreadySelected ? "" : targetPosition;

    // Check if another team currently has this position
    let previousHolderName: string | null = null;
    if (nextVal !== "") {
      const prevTeam = finalsTeams.find(
        (t) =>
          t.teamKey !== team.teamKey &&
          ((resultInputs[t.primaryRegistration.id] !== undefined
            ? resultInputs[t.primaryRegistration.id]
            : t.result) === targetPosition)
      );
      if (prevTeam) {
        previousHolderName = prevTeam.teamName || prevTeam.primaryRegistration.user.name;
      }
    }

    setResultInputs((prev) => {
      const updated = { ...prev };

      // If assigning a position, clear it from all other participants in the event
      if (nextVal !== "") {
        Object.keys(updated).forEach((regId) => {
          if (updated[regId] === nextVal) {
            updated[regId] = "";
          }
        });
        registrations.forEach((r) => {
          if (r.result === nextVal && !team.members.some((m) => m.id === r.id)) {
            updated[r.id] = "";
          }
        });
      }

      // Assign to this team's members
      updated[primaryId] = nextVal;
      team.members.forEach((m) => {
        updated[m.id] = nextVal;
      });

      return updated;
    });

    if (previousHolderName) {
      toast.success(
        `${targetPosition} assigned to ${team.teamName || team.primaryRegistration.user.name} (moved from ${previousHolderName}).`
      );
    }
  };

  const handleBulkSaveScores = async () => {
    setIsSaving(true);
    let savedCount = 0;
    try {
      for (const team of finalsTeams) {
        const primaryId = team.primaryRegistration.id;
        const sc = scoreInputs[primaryId];
        const rs = resultInputs[primaryId];
        if (sc !== undefined || rs !== undefined) {
          const parsedScore = sc !== "" && sc !== undefined ? parseFloat(sc) : null;
          const parsedResult = rs || null;

          await Promise.all(
            team.members.map((m) =>
              fetch(`/api/coordinator/registrations/${m.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  score: parsedScore,
                  result: parsedResult,
                }),
              })
            )
          );
          savedCount++;
        }
      }
      toast.success(`Successfully saved marks and award rankings for ${savedCount} team(s).`);
      await loadEventData();
    } catch (err) {
      console.error("Bulk save error:", err);
      toast.error("An error occurred while saving scores.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportScoreSheetCSV = () => {
    if (!event || finalsTeams.length === 0) {
      toast.error("No evaluated teams or competitors to export.");
      return;
    }
    const headers = [
      "College",
      "Team Name",
      "Prelims Representative / Primary Member",
      "Other Team Members",
      "Attendance",
      "Score",
      "Award / Position",
    ];
    const rows = finalsTeams.map((team) => {
      const primary = team.primaryRegistration;
      const others = team.members
        .filter((m) => m.id !== primary.id)
        .map((m) => m.user.name)
        .join(", ");
      const primaryId = primary.id;
      return [
        `"${team.collegeName}"`,
        `"${team.teamName || "—"}"`,
        `"${primary.user.name}"`,
        `"${others || "—"}"`,
        `"${team.isAttended ? "PRESENT" : "ABSENT"}"`,
        `"${scoreInputs[primaryId] ?? team.score ?? ""}"`,
        `"${resultInputs[primaryId] ?? team.result ?? ""}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
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
              <span>QR Check-in</span>
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
                <span>
                  Prelims Evaluation ({presentPrelims.length} Present
                  {pendingPrelims.length > 0 ? ` • ${pendingPrelims.length} Pending` : ""})
                </span>
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
            <span>Scores & Awards Evaluation Table ({finalsTeams.length})</span>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-xs text-slate-500">
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
                      Approved Nominees: {eligiblePrelims.length}
                    </span>
                    <span className="font-bold text-emerald-800">
                      Present in Room: {presentPrelims.length}
                    </span>
                    {pendingPrelims.length > 0 && (
                      <span className="font-bold text-stone-500">
                        Gate Pending: {pendingPrelims.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-amber-300 rounded-xl p-3 text-right">
                  <div className="text-[10px] font-bold text-stone-500 uppercase">Qualified for Finals</div>
                  <div className="text-xl font-black text-emerald-700 tabular-nums">
                    {presentPrelims.filter((r) => (prelimsStatusInputs[r.id] || r.prelimsStatus) === "QUALIFIED").length}
                  </div>
                </div>
              </div>

              {event?.prelimsRules && (
                <div className="p-3 bg-white/80 border border-amber-200 rounded-xl text-xs text-amber-950 whitespace-pre-wrap font-mono leading-relaxed">
                  <strong>Evaluation Guidelines:</strong> {event.prelimsRules}
                </div>
              )}
            </div>

            {/* Main Prelims Participant Table: ONLY Present Competitors */}
            <div className="dash-card overflow-hidden">
              <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <span>Active Prelims Competitors in Room</span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                      {presentPrelims.length} Present & Checked-In
                    </span>
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Grade and qualify participants who are physically present and verified at the venue.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-50 text-stone-500 text-[11px] uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="p-4">Nominated Delegate</th>
                      <th className="p-4">College Delegation</th>
                      <th className="p-4">Qualification Status</th>
                      <th className="p-4">Score (Marks)</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {presentPrelims.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-xs text-stone-500 space-y-2">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-2">
                            <Target className="w-5 h-5" />
                          </div>
                          <p className="font-bold text-sm text-stone-800">No checked-in participants in the prelims room yet.</p>
                          <p className="text-stone-400 max-w-md mx-auto">
                            {pendingPrelims.length > 0
                              ? `${pendingPrelims.length} approved participant(s) are pending check-in. Scan their QR badges with the 'QR Check-in' button above, and they will immediately appear here for grading.`
                              : "No participants have been nominated for this prelims event yet."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      presentPrelims.map((reg) => {
                        const currentPStatus = prelimsStatusInputs[reg.id] || reg.prelimsStatus || "PENDING";
                        const isSaving = savingId === reg.id;

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
                              {(() => {
                                const delId = reg.delegation?.id || reg.delegationId;
                                const partners = delId
                                  ? registrations.filter(
                                      (r) => (r.delegation?.id || r.delegationId) === delId && r.id !== reg.id
                                    )
                                  : [];
                                if (partners.length > 0) {
                                  return (
                                    <div className="text-[10px] font-medium text-amber-800 bg-amber-50/80 border border-amber-200 rounded px-1.5 py-0.5 mt-1.5 w-fit">
                                      Represents team with: {partners.map((p) => p.user.name).join(", ")}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
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
                                className="h-9 w-28 bg-white border border-stone-300 rounded-lg px-2 text-xs text-stone-900 focus:outline-none focus:border-amber-500 font-bold"
                              />
                            </td>

                            {/* Action */}
                            <td className="p-4 text-right">
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleSavePrelims(reg.id)}
                                className="tap-target px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
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

            {/* Absent / Gate-Pending Nominated Participants Accordion */}
            {pendingPrelims.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowPendingPrelims((prev) => !prev)}
                  className="w-full p-4 px-5 flex items-center justify-between bg-stone-50 hover:bg-stone-100/80 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-bold text-stone-800">
                      Absent / Gate-Pending Nominees ({pendingPrelims.length})
                    </span>
                    <span className="text-[11px] text-stone-500 hidden sm:inline">
                      — Nominated for Prelims but not yet checked in at venue
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    {showPendingPrelims ? "Hide List ▲" : "View List ▼"}
                  </span>
                </button>

                {showPendingPrelims && (
                  <div className="overflow-x-auto border-t border-stone-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100/70 text-stone-500 text-[10px] uppercase font-bold tracking-wider">
                        <tr>
                          <th className="p-3.5">Participant</th>
                          <th className="p-3.5">College & Team</th>
                          <th className="p-3.5">Badge ID</th>
                          <th className="p-3.5">Gate Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {pendingPrelims.map((reg) => (
                          <tr key={reg.id} className="hover:bg-stone-50/50">
                            <td className="p-3.5">
                              <span className="font-bold text-stone-900">{reg.user.name}</span>
                              <div className="text-[10px] text-stone-500">{reg.user.email}</div>
                            </td>
                            <td className="p-3.5 font-medium text-stone-700">
                              {reg.delegation?.collegeName || reg.user.college || "N/A"}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-stone-600">
                              {reg.delegationMember?.badgeCode || "N/A"}
                            </td>
                            <td className="p-3.5">
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                Gate Pending
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
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
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    {finalsTeams.length} {event?.hasPrelims ? "Qualified Teams" : "Present Teams"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {event?.hasPrelims
                    ? "Official final jury sheet for qualified teams. Enter final scores and assign podium finishes (1st, 2nd, 3rd)."
                    : "Official jury sheet for verified attending teams. Enter event scores and assign podium finishes (1st, 2nd, 3rd)."}
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
                  disabled={isSaving || finalsTeams.length === 0}
                  onClick={handleBulkSaveScores}
                  className="tap-target flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Bulk Save All Scores"}</span>
                </button>
              </div>
            </div>

            {/* Scores Table */}
            <div className="dash-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Participant / Team Members</th>
                      <th className="p-4">College & Team</th>
                      <th className="p-4">Score (Marks)</th>
                      <th className="p-4">Award / Position</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {finalsTeams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <div className="max-w-md mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                              <Trophy className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-900">
                              {event?.hasPrelims ? "No Teams Qualified Yet" : "No Present Teams Yet"}
                            </p>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {event?.hasPrelims ? (
                                <>
                                  This event includes a preliminary round. When the prelims representative is marked as{" "}
                                  <strong className="text-emerald-700 font-bold">QUALIFIED</strong> in the{" "}
                                  <span className="font-semibold text-amber-700">Prelims Evaluation</span> tab,
                                  their whole team will automatically advance here to the finals evaluation sheet.
                                </>
                              ) : (
                                <>
                                  Only confirmed teams with verified attending members (<strong className="text-emerald-700 font-bold">Present</strong>) appear on this evaluation sheet.
                                  Use the <strong className="text-orange-600 font-semibold">QR Check-in</strong> button above to scan delegate badges.
                                </>
                              )}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      finalsTeams.map((team) => {
                        const primary = team.primaryRegistration;
                        const otherMembers = team.members.filter((m) => m.id !== primary.id);
                        const primaryId = primary.id;
                        const currentResult =
                          resultInputs[primaryId] !== undefined
                            ? resultInputs[primaryId]
                            : (team.result ?? "");

                        return (
                          <tr key={team.teamKey} className="hover:bg-slate-50/50 transition-colors">
                            {/* Participant & Team Members (No email, no badge) */}
                            <td className="p-4">
                              {team.members.length > 1 ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900 text-sm">{primary.user.name}</span>
                                    {event?.hasPrelims && primary.isPrelimsParticipant && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                        Prelims Rep
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      Teammates:
                                    </span>
                                    {otherMembers.map((om) => (
                                      <span
                                        key={om.id}
                                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                                      >
                                        {om.user.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="font-bold text-slate-900 text-sm">{primary.user.name}</div>
                              )}
                            </td>

                            {/* College & Team Name */}
                            <td className="p-4">
                              <div className="font-semibold text-slate-800 text-xs">
                                {team.collegeName}
                              </div>
                              {team.teamName && (
                                <div className="text-[11px] text-orange-600 font-medium mt-0.5">
                                  Team: {team.teamName}
                                </div>
                              )}
                            </td>

                            {/* Score Field */}
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  placeholder="0 - 100"
                                  value={
                                    scoreInputs[primaryId] !== undefined
                                      ? scoreInputs[primaryId]
                                      : (team.score ?? "")
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setScoreInputs((prev) => {
                                      const next = { ...prev, [primaryId]: val };
                                      team.members.forEach((m) => {
                                        next[m.id] = val;
                                      });
                                      return next;
                                    });
                                  }}
                                  className="h-9 w-24 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                                />
                                <span className="text-[11px] text-slate-400 font-medium">/ 100</span>
                              </div>
                            </td>

                            {/* 3 Podium Award Buttons */}
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePodiumPosition(team, "1st Place")}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                    currentResult === "1st Place"
                                      ? "bg-amber-400 text-amber-950 border-amber-500 shadow-md ring-2 ring-amber-400/50 scale-105"
                                      : "bg-amber-50/70 hover:bg-amber-100 text-amber-900 border-amber-200 hover:border-amber-300"
                                  }`}
                                  title="1st Place (Gold / Champion)"
                                >
                                  <span>🥇</span>
                                  <span>1st</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePodiumPosition(team, "2nd Place")}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                    currentResult === "2nd Place"
                                      ? "bg-slate-300 text-slate-900 border-slate-400 shadow-md ring-2 ring-slate-400/50 scale-105"
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-slate-300"
                                  }`}
                                  title="2nd Place (Silver / Runner Up)"
                                >
                                  <span>🥈</span>
                                  <span>2nd</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePodiumPosition(team, "3rd Place")}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                    currentResult === "3rd Place"
                                      ? "bg-amber-700 text-white border-amber-800 shadow-md ring-2 ring-amber-700/50 scale-105"
                                      : "bg-amber-50/50 hover:bg-amber-100 text-amber-900 border-amber-200 hover:border-amber-300"
                                  }`}
                                  title="3rd Place (Bronze / Second Runner Up)"
                                >
                                  <span>🥉</span>
                                  <span>3rd</span>
                                </button>

                                {currentResult && (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePodiumPosition(team, currentResult)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Clear Position"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Action */}
                            <td className="p-4 text-right">
                              <button
                                type="button"
                                disabled={isSaving || savingId === primaryId}
                                onClick={() => handleSaveScore(team)}
                                className="tap-target h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                              >
                                {savingId === primaryId ? "Saving..." : "Save"}
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

      <Footer />

      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        activeEventId={eventId}
        onCheckInComplete={loadEventData}
        mode="event_only"
      />
    </main>
  );
}
