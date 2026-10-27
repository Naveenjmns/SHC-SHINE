"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Printer,
  Download,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trophy,
  Users,
  Calendar,
  MapPin,
  Landmark,
  GraduationCap,
  ShieldCheck,
  Medal,
  Theater,
  Laptop,
  Mail,
  Phone,
  Building2,
  AlertCircle,
  Award,
  ChevronDown,
  Target,
  Utensils,
  Leaf,
  Flame,
} from "lucide-react";
import { safeJson } from "@/lib/safeFetch";
import { parseDateSafe } from "@/lib/dateUtils";
import { downloadEventParticipantsCSV } from "@/lib/exportEventCsv";

interface ReportData {
  edition?: {
    id?: string | null;
    name?: string | null;
    edition?: string | null;
    floorPlanUrl?: string | null;
    waypointGraph?: any;
  } | null;
  summary: {
    festName: string;
    festEdition: string;
    tagline: string;
    institutionName: string;
    accreditationText: string;
    hostDepartment: string;
    venue: string;
    startDate?: string | null;
    endDate?: string | null;
    contactEmail: string;
    contactPhone: string;
    totalEvents: number;
    onStageEventsCount: number;
    offStageEventsCount: number;
    eventsWithPrelimsCount: number;
    totalCollegesCount: number;
    totalUniqueStudentsCount: number;
    totalRegistrationsCount: number;
    attendedStudentsCount: number;
    attendancePercentage: number;
    prelimsNomineesCount: number;
    prelimsClearedCount: number;
    totalWinnersCount: number;
    overallChampionCollege?: { collegeName: string; totalPoints: number; goldCount: number } | null;
    overallRunnerUpCollege?: { collegeName: string; totalPoints: number; goldCount: number } | null;
    generatedAt: string;
    generatedBy: { name: string; email: string; role: string };
  };
  events: Array<{
    id: string;
    name: string;
    category: "ON_STAGE" | "OFF_STAGE";
    description: string | null;
    venue: string;
    venueZoneId?: string | null;
    prelimsVenueZoneId?: string | null;
    dateTime: string;
    rules: string | null;
    fee: number;
    capacity: number | null;
    hasPrelims: boolean;
    prelimsDateTime: string | null;
    prelimsVenue: string | null;
    prelimsRules: string | null;
    staffCoordinator: { name: string; email: string; phone: string };
    studentCoordinator: { name: string; email: string; phone: string };
    registrationsCount: number;
    attendedCount: number;
    prelimsCount: number;
    winnersCount: number;
  }>;
  delegations: Array<{
    id: string;
    collegeName: string;
    department: string | null;
    teamName: string | null;
    teamLeadName: string;
    teamLeadEmail: string;
    teamLeadPhone: string;
    staffInchargeName: string | null;
    staffInchargePhone: string | null;
    staffInchargeEmail: string | null;
    memberCount: number;
    paymentStatus: string;
    totalFee: number;
    checkedInCount: number;
    foodClaimedCount: number;
  }>;
  masterStudentRoster: Array<{
    userId: string;
    name: string;
    email: string;
    phone: string;
    college: string;
    department: string | null;
    teamName: string | null;
    isTeamLead: boolean;
    badgeCode: string | null;
    foodTokenCode: string | null;
    foodPreference?: "VEG" | "NON_VEG" | string;
    attended: boolean;
    checkedInAt: string | null;
    events: Array<{
      eventId: string;
      eventName: string;
      category: string;
      venue: string | null;
      status: string;
      isPrelimsParticipant: boolean;
      prelimsStatus: string | null;
      prelimsScore: number | null;
      score: number | null;
      result: string | null;
    }>;
  }>;
  prelimsProgression: Array<{
    registrationId: string;
    eventId: string;
    eventName: string;
    eventCategory: string;
    prelimsVenue: string | null;
    prelimsDateTime: string | null;
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    collegeName: string;
    prelimsStatus: string;
    prelimsScore: number | null;
    prelimsNotes: string | null;
    clearedToMains: boolean;
    mainsScore: number | null;
    finalResult: string | null;
  }>;
  finalResults: Array<{
    registrationId: string;
    eventId: string;
    eventName: string;
    eventCategory: string;
    studentName: string;
    studentEmail: string;
    collegeName: string;
    score: number | null;
    result: string;
    rank: number;
  }>;
  championshipLeaderboard: Array<{
    collegeName: string;
    goldCount: number;
    silverCount: number;
    bronzeCount: number;
    otherAwardsCount: number;
    totalPoints: number;
    participantsCount: number;
    eventsEnrolledCount: number;
  }>;
  cateringSummary?: {
    totalEligible: number;
    totalClaimed: number;
    totalRemaining: number;
    claimPercentage: number;
    veg: { requested: number; claimed: number; remaining: number };
    nonVeg: { requested: number; claimed: number; remaining: number };
  };
  cateringRoster?: Array<{
    sNo: number;
    id: string;
    name: string;
    email: string;
    phone: string;
    collegeName: string;
    foodPreference: "VEG" | "NON_VEG";
    foodTokenCode: string;
    badgeCode: string;
    foodTokenClaimed: boolean;
    foodClaimedAt: string | null;
    foodClaimedBy: string | null;
  }>;
}

function formatReportDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = parseDateSafe(dateStr);
    if (!d || isNaN(d.getTime())) return "—";
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  } catch {
    return "—";
  }
}

function formatReportTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = parseDateSafe(dateStr);
    if (!d || isNaN(d.getTime())) return "—";
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  } catch {
    return "—";
  }
}


export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeSection, setActiveSection] = useState<
    "all" | "summary" | "catering" | "events" | "venue" | "delegations" | "roster" | "prelims" | "results" | "championship"
  >("all");
  const [downloadingEventId, setDownloadingEventId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventFilter, setSelectedEventFilter] = useState("ALL");
  const [printOrientation, setPrintOrientation] = useState<"portrait" | "landscape">("portrait");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/reports");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reports");
      const json = await safeJson(res);
      if (json?.success && json.report) {
        setData(json.report);
      } else {
        setError(json?.message || "Failed to load report data.");
      }
    } catch (err: any) {
      setError(err.message || "Network error fetching reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchReports();
    }
  }, [session]);

  // Helper to trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Helper to download a string as a CSV file
  const downloadCsv = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handler to download an individual event's participant CSV roster
  const handleDownloadEventCSV = async (eventId: string, eventName?: string) => {
    setDownloadingEventId(eventId);
    try {
      const ev = data?.events?.find((e: any) => e.id === eventId);
      await downloadEventParticipantsCSV({
        eventId,
        eventName: ev?.name || eventName,
        eventData: ev
          ? {
              id: ev.id,
              name: ev.name,
              category: ev.category,
              venue: ev.venue,
              dateTime: ev.dateTime,
            }
          : undefined,
      });
    } catch (err: any) {
      console.error("Export event participants CSV error:", err);
    } finally {
      setDownloadingEventId(null);
    }
  };

  // 1. Export Master Student Roster CSV
  const exportMasterRosterCSV = () => {
    if (!data) return;
    const headers = [
      "S.No",
      "Student Name",
      "Email Address",
      "Mobile Number",
      "College / Institution",
      "Department",
      "Contingent Team",
      "Is Team Lead",
      "Dietary Choice",
      "Badge Code",
      "Food Token Code",
      "Attendance Status",
      "Check-in Timestamp",
      "Total Events Enrolled",
      "Events List",
    ];

    const rows = data.masterStudentRoster.map((s, idx) => [
      idx + 1,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.phone}"`,
      `"${s.college.replace(/"/g, '""')}"`,
      `"${(s.department || "").replace(/"/g, '""')}"`,
      `"${(s.teamName || "").replace(/"/g, '""')}"`,
      s.isTeamLead ? "YES" : "NO",
      s.foodPreference === "NON_VEG" ? "NON-VEGETARIAN" : "VEGETARIAN",
      `"${s.badgeCode || "—"}"`,
      `"${s.foodTokenCode || "—"}"`,
      s.attended ? "PRESENT" : "ABSENT",
      `"${s.checkedInAt ? new Date(s.checkedInAt).toLocaleString() : "—"}"`,
      s.events.length,
      `"${s.events.map((e) => e.eventName).join("; ")}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCsv(`${data.summary.festName}_${data.summary.festEdition}_Master_Student_Roster.csv`, csv);
  };

  // 2. Export Prelims to Mains Progression CSV
  const exportPrelimsProgressionCSV = () => {
    if (!data) return;
    const headers = [
      "S.No",
      "Event Name",
      "Event Category",
      "Prelims Venue",
      "Prelims Date Time",
      "Student Name",
      "Email Address",
      "Phone",
      "College / Institution",
      "Prelims Status",
      "Prelims Score",
      "Prelims Remarks",
      "Advanced to Mains",
      "Mains Score",
      "Final Result / Award",
    ];

    const rows = data.prelimsProgression.map((p, idx) => [
      idx + 1,
      `"${p.eventName.replace(/"/g, '""')}"`,
      p.eventCategory,
      `"${(p.prelimsVenue || "").replace(/"/g, '""')}"`,
      `"${p.prelimsDateTime ? new Date(p.prelimsDateTime).toLocaleString() : "—"}"`,
      `"${p.studentName.replace(/"/g, '""')}"`,
      `"${p.studentEmail}"`,
      `"${p.studentPhone}"`,
      `"${p.collegeName.replace(/"/g, '""')}"`,
      p.prelimsStatus,
      p.prelimsScore ?? "—",
      `"${(p.prelimsNotes || "").replace(/"/g, '""')}"`,
      p.clearedToMains ? "QUALIFIED" : "ELIMINATED / PENDING",
      p.mainsScore ?? "—",
      `"${(p.finalResult || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCsv(`${data.summary.festName}_${data.summary.festEdition}_Prelims_Mains_Progression.csv`, csv);
  };

  // 3. Export Final Results & Winners CSV
  const exportFinalResultsCSV = () => {
    if (!data) return;
    const headers = [
      "S.No",
      "Event Name",
      "Category",
      "Award / Result",
      "Place Rank",
      "Student Name",
      "Email Address",
      "College / Institution",
      "Final Score",
    ];

    const rows = data.finalResults.map((r, idx) => [
      idx + 1,
      `"${r.eventName.replace(/"/g, '""')}"`,
      r.eventCategory,
      `"${r.result.replace(/"/g, '""')}"`,
      r.rank === 99 ? "Mention" : `${r.rank}`,
      `"${r.studentName.replace(/"/g, '""')}"`,
      `"${r.studentEmail}"`,
      `"${r.collegeName.replace(/"/g, '""')}"`,
      r.score ?? "—",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCsv(`${data.summary.festName}_${data.summary.festEdition}_Final_Results_Winners.csv`, csv);
  };

  // 4. Export Complete Events & Coordinators Directory CSV
  const exportEventsCoordinatorsCSV = () => {
    if (!data) return;
    const headers = [
      "S.No",
      "Event Name",
      "Category",
      "Venue",
      "Date & Time",
      "Registration Fee",
      "College Capacity Limit",
      "Has Prelims",
      "Prelims Venue",
      "Prelims Date & Time",
      "Staff Coordinator Name",
      "Staff Coordinator Email",
      "Staff Coordinator Phone",
      "Student Coordinator Name",
      "Student Coordinator Email",
      "Student Coordinator Phone",
      "Total Registrations",
      "Attended Count",
      "Prelims Candidates Count",
      "Winners Count",
    ];

    const rows = data.events.map((ev, idx) => [
      idx + 1,
      `"${ev.name.replace(/"/g, '""')}"`,
      ev.category,
      `"${ev.venue.replace(/"/g, '""')}"`,
      `"${new Date(ev.dateTime).toLocaleString()}"`,
      ev.fee,
      ev.capacity ?? "Unlimited",
      ev.hasPrelims ? "YES" : "NO",
      `"${(ev.prelimsVenue || "").replace(/"/g, '""')}"`,
      `"${ev.prelimsDateTime ? new Date(ev.prelimsDateTime).toLocaleString() : "—"}"`,
      `"${ev.staffCoordinator.name.replace(/"/g, '""')}"`,
      `"${ev.staffCoordinator.email}"`,
      `"${ev.staffCoordinator.phone}"`,
      `"${ev.studentCoordinator.name.replace(/"/g, '""')}"`,
      `"${ev.studentCoordinator.email}"`,
      `"${ev.studentCoordinator.phone}"`,
      ev.registrationsCount,
      ev.attendedCount,
      ev.prelimsCount,
      ev.winnersCount,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCsv(`${data.summary.festName}_${data.summary.festEdition}_Events_Coordinators_Directory.csv`, csv);
  };

  // 5. Export College Championship Leaderboard CSV
  const exportChampionshipCSV = () => {
    if (!data) return;
    const headers = [
      "Rank",
      "College / Institution Name",
      "1st Place (Gold / 10pts)",
      "2nd Place (Silver / 7pts)",
      "3rd Place (Bronze / 5pts)",
      "Special Awards (2pts)",
      "Total Championship Points",
      "Registered Participants",
      "Total Events Enrolled",
    ];

    const rows = data.championshipLeaderboard.map((c, idx) => [
      idx + 1,
      `"${c.collegeName.replace(/"/g, '""')}"`,
      c.goldCount,
      c.silverCount,
      c.bronzeCount,
      c.otherAwardsCount,
      c.totalPoints,
      c.participantsCount,
      c.eventsEnrolledCount,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCsv(`${data.summary.festName}_${data.summary.festEdition}_College_Championship_Standings.csv`, csv);
  };

  // 6. Export Catering & Food Vendor List CSV
  const exportCateringVendorCSV = () => {
    if (!data || !data.cateringRoster) return;
    const headers = [
      "S.No",
      "Student Delegate Name",
      "College / Institution",
      "Dietary Preference",
      "Meal Token Code",
      "Delegate Badge Code",
      "Claim Status",
      "Claim Timestamp",
      "Claimed By Staff",
    ];

    const rows = data.cateringRoster.map((r, idx) => [
      idx + 1,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.collegeName.replace(/"/g, '""')}"`,
      r.foodPreference === "NON_VEG" ? "NON-VEGETARIAN (🍗)" : "VEGETARIAN (🥗)",
      `"${r.foodTokenCode}"`,
      `"${r.badgeCode}"`,
      r.foodTokenClaimed ? "SERVED" : "PENDING",
      `"${r.foodClaimedAt ? new Date(r.foodClaimedAt).toLocaleString() : "—"}"`,
      `"${r.foodClaimedBy || "—"}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCsv(`${data.summary.festName}_${data.summary.festEdition}_Catering_Vendor_List.csv`, csv);
  };

  // Filtered master student list based on search and event filter
  const filteredRoster = useMemo(() => {
    if (!data) return [];
    return data.masterStudentRoster.filter((s) => {
      const matchesSearch =
        searchTerm === "" ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm) ||
        (s.badgeCode && s.badgeCode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesEvent =
        selectedEventFilter === "ALL" ||
        s.events.some((e) => e.eventId === selectedEventFilter);

      return matchesSearch && matchesEvent;
    });
  }, [data, searchTerm, selectedEventFilter]);

  // Memoized zone-to-events directory for the Venue Map Section
  const zoneAllocations = useMemo(() => {
    if (!data?.events) return [];

    const zoneMap = new Map<
      string,
      {
        zoneId: string;
        zoneLabel: string;
        mainEvents: Array<{ id: string; name: string; category: string; venue: string; coordinator: string }>;
        prelimsEvents: Array<{ id: string; name: string; category: string; venue: string; coordinator: string }>;
      }
    >();

    // From graph nodes if available
    const graphNodes: Array<{ id: string }> = data.edition?.waypointGraph?.nodes || [];
    for (const node of graphNodes) {
      if (node.id && !node.id.startsWith("wp-")) {
        const label = node.id
          .replace(/^hall-|^lab-|^room-|^amenity-/, "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        zoneMap.set(node.id, {
          zoneId: node.id,
          zoneLabel: label,
          mainEvents: [],
          prelimsEvents: [],
        });
      }
    }

    // From events
    for (const ev of data.events) {
      if (ev.venueZoneId) {
        if (!zoneMap.has(ev.venueZoneId)) {
          const label = ev.venueZoneId
            .replace(/^hall-|^lab-|^room-|^amenity-/, "")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          zoneMap.set(ev.venueZoneId, {
            zoneId: ev.venueZoneId,
            zoneLabel: label,
            mainEvents: [],
            prelimsEvents: [],
          });
        }
        zoneMap.get(ev.venueZoneId)!.mainEvents.push({
          id: ev.id,
          name: ev.name,
          category: ev.category,
          venue: ev.venue,
          coordinator: ev.staffCoordinator?.name || ev.studentCoordinator?.name || "Faculty / Student Incharge",
        });
      }

      if (ev.prelimsVenueZoneId) {
        if (!zoneMap.has(ev.prelimsVenueZoneId)) {
          const label = ev.prelimsVenueZoneId
            .replace(/^hall-|^lab-|^room-|^amenity-/, "")
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          zoneMap.set(ev.prelimsVenueZoneId, {
            zoneId: ev.prelimsVenueZoneId,
            zoneLabel: label,
            mainEvents: [],
            prelimsEvents: [],
          });
        }
        zoneMap.get(ev.prelimsVenueZoneId)!.prelimsEvents.push({
          id: ev.id,
          name: ev.name,
          category: ev.category,
          venue: ev.prelimsVenue || ev.venue,
          coordinator: ev.staffCoordinator?.name || ev.studentCoordinator?.name || "Faculty / Student Incharge",
        });
      }
    }

    return Array.from(zoneMap.values()).sort((a, b) => a.zoneLabel.localeCompare(b.zoneLabel));
  }, [data]);

  if (status === "loading" || loading || !mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p suppressHydrationWarning className="text-xs font-semibold text-ink-muted">
          Loading Event Reports...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="dash-card max-w-md p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-danger mx-auto" />
          <h2 className="text-lg font-bold text-ink">Failed to Load Reports</h2>
          <p className="text-xs text-ink-muted">{error || "No data available."}</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/admin"
              className="px-4 py-2 bg-surface-raised text-ink-muted text-xs font-bold rounded-[8px] hover:bg-surface-sunken transition"
            >
              Return to Admin
            </Link>
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-[8px] hover:bg-accent-hover transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="min-h-screen bg-canvas text-ink print:bg-surface print:text-ink">
      {/* Dynamic Print Stylesheet & Page Setup */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${printOrientation === "landscape" ? "A4 landscape" : "A4 portrait"};
            margin: 5mm 5mm 8mm 5mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          html, body {
            background-color: #ffffff !important;
            color: #0B3558 !important;
            font-size: 7.5pt !important;
            line-height: 1.2 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          /* Absolute suppression of all buttons, inputs, dropdowns, and screen-only elements */
          button,
          input,
          select,
          textarea,
          [role="button"],
          .no-print,
          .print\\:hidden,
          [class*="print:hidden"],
          [class*="no-print"],
          nav {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          /* Flatten all section cards so they don't clip tables */
          .bg-surface,
          [class*="rounded-3xl"],
          [class*="rounded-2xl"],
          [class*="shadow-card"] {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            background: transparent !important;
          }
          .official-certification-block {
            border: 1px solid #B4C7DB !important;
            border-radius: 4px !important;
            padding: 10px !important;
            margin-top: 16px !important;
          }
          /* Table containers and tables */
          .overflow-x-auto, .overflow-y-auto, .overflow-hidden {
            overflow: visible !important;
            width: 100% !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            margin: 0 !important;
          }
          thead {
            display: table-header-group !important;
          }
          tbody {
            page-break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            break-inside: avoid-page !important;
          }
          th, td {
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
            white-space: normal !important;
            padding: 2.5px 3px !important;
            font-size: 7pt !important;
            line-height: 1.15 !important;
            border: 1px solid #D4E0ED !important;
            box-sizing: border-box !important;
          }
          th {
            background-color: #F0F3F8 !important;
            color: #0B3558 !important;
            font-weight: 800 !important;
            font-size: 6.5pt !important;
            text-transform: uppercase !important;
            letter-spacing: 0.02em !important;
          }
        }
      `}} />

      {/* SCREEN ONLY: Top Control Navigation Bar */}
      <div className="print:hidden sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border px-3 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-[8px] text-ink-muted hover:text-ink hover:bg-surface-raised transition"
              title="Return to Admin Console"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-accent bg-accent-muted px-2 py-0.5 rounded border border-accent/30">
                  Official Event Report
                </span>
                <span className="text-[10px] text-ink-muted font-semibold">
                  Edition: {summary.festName} {summary.festEdition}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-ink flex items-center gap-1.5">
                <span>Official Comprehensive Event Report</span>
              </h1>
            </div>
          </div>

          {/* Action Export & Print Setup Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Print Orientation Selector */}
            <div className="flex items-center bg-surface-raised p-1 rounded-[8px] border border-border text-xs">
              <button
                type="button"
                onClick={() => setPrintOrientation("portrait")}
                className={`px-2.5 py-1 rounded-[8px] font-bold transition cursor-pointer ${
                  printOrientation === "portrait"
                    ? "bg-surface text-ink shadow-card"
                    : "text-ink-muted hover:text-ink"
                }`}
                title="Print in Portrait (Standard A4)"
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setPrintOrientation("landscape")}
                className={`px-2.5 py-1 rounded-[8px] font-bold transition cursor-pointer ${
                  printOrientation === "landscape"
                    ? "bg-surface text-ink shadow-card"
                    : "text-ink-muted hover:text-ink"
                }`}
                title="Print in Landscape (Wide Table Layout)"
              >
                Landscape
              </button>
            </div>

            <button
              onClick={fetchReports}
              className="p-2 bg-surface-raised hover:bg-surface-sunken text-ink-muted rounded-[8px] transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Print Official Report */}
            <button
              onClick={handlePrint}
              className="px-3.5 sm:px-4 py-2 bg-surface border border-border text-ink hover:border-accent hover:text-accent rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-accent" />
              <span>Print Official Report (PDF)</span>
            </button>

            {/* CSV Dropdown / Actions */}
            <div className="relative group">
              <button className="px-3.5 sm:px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer">
                <Download className="w-4 h-4" />
                <span>Export CSVs</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>
              <div className="absolute right-0 mt-1 w-64 bg-surface border border-border rounded-2xl shadow-popover py-2 hidden group-hover:block z-50 animate-in fade-in duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-subtle border-b border-border">
                  Download Datasets
                </div>
                <button
                  onClick={exportMasterRosterCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-ink-muted hover:bg-accent-muted hover:text-accent-hover transition flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Master Student Roster ({data.masterStudentRoster.length})</span>
                </button>
                <button
                  onClick={exportPrelimsProgressionCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-ink-muted hover:bg-accent-muted hover:text-accent-hover transition flex items-center gap-2 cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Prelims & Mains Scores ({data.prelimsProgression.length})</span>
                </button>
                <button
                  onClick={exportFinalResultsCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-ink-muted hover:bg-accent-muted hover:text-accent-hover transition flex items-center gap-2 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>Final Results & Winners ({data.finalResults.length})</span>
                </button>
                <button
                  onClick={exportEventsCoordinatorsCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-ink-muted hover:bg-accent-muted hover:text-accent-hover transition flex items-center gap-2 cursor-pointer"
                >
                  <Theater className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Events & Coordinators ({data.events.length})</span>
                </button>
                <button
                  onClick={exportChampionshipCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-ink-muted hover:bg-accent-muted hover:text-accent-hover transition flex items-center gap-2 border-t border-border cursor-pointer"
                >
                  <Medal className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>College Championship Standings</span>
                </button>
                <button
                  onClick={exportCateringVendorCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-ink-muted hover:bg-accent-muted hover:text-accent-hover transition flex items-center gap-2 border-t border-border cursor-pointer"
                >
                  <Utensils className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Catering & Food Vendor List ({data.cateringRoster?.length || 0})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs (Screen Only - Responsive Wrap) */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-border flex flex-wrap items-center gap-2 pb-1">
          {[
            { id: "all", label: "Full Report (All Sections)" },
            { id: "summary", label: "Executive Summary" },
            { id: "catering", label: `🍱 Catering & Dietary (${data.cateringSummary?.totalClaimed ?? 0}/${data.cateringSummary?.totalEligible ?? 0})` },
            { id: "events", label: `Events & Coordinators (${data.events.length})` },
            { id: "venue", label: "🗺️ Venue Map & Zones" },
            { id: "delegations", label: `College Delegations (${data.delegations.length})` },
            { id: "roster", label: `Master Student Roster (${data.masterStudentRoster.length})` },
            { id: "prelims", label: `Prelims Progression (${data.prelimsProgression.length})` },
            { id: "results", label: `Final Results (${data.finalResults.length})` },
            { id: "championship", label: "Championship Standings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-bold shrink-0 transition cursor-pointer ${
                activeSection === tab.id
                  ? "bg-surface-inverse text-white"
                  : "bg-surface-raised text-ink-muted hover:bg-surface-sunken"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* REPORT CONTENT CANVAS (Formatted for both screen & print) */}
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 print:p-0 print:m-0 print:max-w-full">
        
        {/* =========================================================================
            OFFICIAL INSTITUTIONAL LETTERHEAD & HEADER (Visible on Print & Screen)
            ========================================================================= */}
        <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card print:border-none print:shadow-none print:p-0 print:mb-6 text-center space-y-3">
          {/* Institutional Crest & Details */}
          <div className="border-b-2 border-surface-inverse pb-4">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-muted mb-1">
              <Landmark className="w-4 h-4 text-accent" />
              <span>Official Institutional Event Documentation</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-ink tracking-tight">
              {summary.institutionName}
            </h1>
            <p className="text-[11px] sm:text-xs text-ink-muted font-medium max-w-3xl mx-auto mt-1 leading-relaxed">
              {summary.accreditationText}
            </p>
            <div className="mt-2 inline-block px-4 py-1 rounded-full bg-surface-raised text-ink text-xs font-bold uppercase tracking-wider">
              {summary.hostDepartment}
            </div>
          </div>

          {/* Event Wordmark & Metadata Title */}
          <div className="pt-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-accent">
              OFFICIAL EVENT REPORT & ANNUAL DOCUMENTATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink mt-1">
              {summary.festName} {summary.festEdition} — Consolidated Report
            </h2>
            <p className="text-xs italic text-ink-muted mt-0.5">
              &ldquo;{summary.tagline}&rdquo;
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-ink-muted font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-ink-subtle" />
                <span>Venue: <strong>{summary.venue}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-ink-subtle" />
                <span>
                  Date:{" "}
                  <strong>
                    {summary.startDate
                      ? formatReportDate(summary.startDate)
                      : "Annual Symposium 2026"}
                  </strong>
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-ink-subtle" />
                <span>{summary.contactEmail}</span>
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 1: EXECUTIVE FEST METRICS & KPI SUMMARY
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "summary") && (
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card print:border-none print:shadow-none print:p-0 print:m-0 print:break-inside-avoid">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-ink">
                  1. Executive Summary & Fest Participation Metrics
                </h3>
              </div>
              <span className="text-[10px] text-ink-subtle font-bold uppercase no-print print:hidden">
                Key Performance Indicators
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 sm:gap-4 print:gap-2">
              <div className="p-4 rounded-2xl bg-surface-raised border border-border print:p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Colleges Represented
                </span>
                <span className="text-2xl sm:text-3xl print:text-xl font-bold text-ink tabular-nums">
                  {summary.totalCollegesCount}
                </span>
                <span className="text-[10px] text-ink-subtle block mt-0.5">Institutions registered</span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-raised border border-border print:p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Total Student Delegates
                </span>
                <span className="text-2xl sm:text-3xl print:text-xl font-bold text-ink tabular-nums">
                  {summary.totalUniqueStudentsCount}
                </span>
                <span className="text-[10px] text-ink-subtle block mt-0.5">Unique participants</span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-raised border border-border print:p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Verified Attendance
                </span>
                <span className="text-2xl sm:text-3xl print:text-xl font-bold text-success-ink tabular-nums">
                  {summary.attendedStudentsCount}
                </span>
                <span className="text-[10px] text-ink-subtle block mt-0.5">
                  {summary.attendancePercentage}% Check-in Rate
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-raised border border-border print:p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Total Competitions
                </span>
                <span className="text-2xl sm:text-3xl print:text-xl font-bold text-ink tabular-nums">
                  {summary.totalEvents}
                </span>
                <span className="text-[10px] text-ink-subtle block mt-0.5">
                  {summary.onStageEventsCount} On-Stage • {summary.offStageEventsCount} Off-Stage
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 sm:gap-4 print:gap-2 mt-3 print:mt-2">
              <div className="p-3.5 rounded-[16px] bg-surface-raised border border-border print:p-2">
                <span className="text-[10px] font-bold text-ink-muted uppercase block">
                  Total Registrations
                </span>
                <span className="text-xl print:text-base font-bold text-ink tabular-nums">
                  {summary.totalRegistrationsCount}
                </span>
              </div>

              <div className="p-3.5 rounded-[16px] bg-surface-raised border border-border print:p-2">
                <span className="text-[10px] font-bold text-ink-muted uppercase block">
                  Prelims Candidates
                </span>
                <span className="text-xl print:text-base font-bold text-ink tabular-nums">
                  {summary.prelimsNomineesCount}
                </span>
              </div>

              <div className="p-3.5 rounded-[16px] bg-surface-raised border border-border print:p-2">
                <span className="text-[10px] font-bold text-ink-muted uppercase block">
                  Mains Finalists
                </span>
                <span className="text-xl print:text-base font-bold text-success-ink tabular-nums">
                  {summary.prelimsClearedCount}
                </span>
              </div>

              <div className="p-3.5 rounded-[16px] bg-surface-raised border border-border print:p-2">
                <span className="text-[10px] font-bold text-ink-muted uppercase block">
                  Podium Winners Awarded
                </span>
                <span className="text-xl print:text-base font-bold text-accent tabular-nums">
                  {summary.totalWinnersCount}
                </span>
              </div>
            </div>

            {/* Championship Spotlight in Summary */}
            {summary.overallChampionCollege && (
              <div className="mt-4 p-4 rounded-2xl border border-gold/40 bg-gold-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-gold text-gold-ink flex items-center justify-center font-bold">
                    <Trophy className="w-5 h-5 text-gold-ink" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold-ink block">
                      Overall Symposium Champion Institution
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-ink">
                      {summary.overallChampionCollege.collegeName}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-ink">
                  <span>Score: <strong className="text-gold-ink text-base">{summary.overallChampionCollege.totalPoints} pts</strong></span>
                  <span>1st Places: <strong className="text-gold-ink">{summary.overallChampionCollege.goldCount}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SECTION 2: EVENTS DIRECTORY & COORDINATORS LIST
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "events") && (
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Theater className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-ink">
                  2. Competitions Catalogue & Coordinators Directory
                </h3>
              </div>
              <button
                onClick={exportEventsCoordinatorsCSV}
                className="no-print print:hidden text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse border border-border print:text-[7pt] print:table-fixed">
                <thead>
                  <tr className="bg-surface-raised text-ink font-bold border-b border-border print:bg-surface-raised">
                    <th className="p-2 border border-border w-8 print:w-[4%] text-center">#</th>
                    <th className="p-2 border border-border print:w-[21%]">Event Name</th>
                    <th className="p-2 border border-border print:w-[10%]">Category</th>
                    <th className="p-2 border border-border print:w-[15%]">Venue & Schedule</th>
                    <th className="p-2 border border-border print:w-[18%]">Faculty In-Charge</th>
                    <th className="p-2 border border-border print:w-[18%]">Student Coordinator</th>
                    <th className="p-2 border border-border print:w-[7%] text-center">Prelims</th>
                    <th className="p-2 border border-border print:w-[7%] text-center">Enrolled</th>
                    <th className="p-2 border border-border print:hidden no-print text-center w-20">CSV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.events.map((ev, idx) => (
                    <tr key={ev.id} className="hover:bg-surface-raised/80 print:break-inside-avoid print:hover:bg-transparent">
                      <td className="p-2 border border-border text-center font-bold text-ink-muted">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-border">
                        <strong className="text-ink block text-xs print:text-[7.5pt] break-words">{ev.name}</strong>
                        {ev.rules && (
                          <span className="text-[10px] text-ink-muted line-clamp-1 no-print print:hidden">
                            {ev.rules}
                          </span>
                        )}
                      </td>
                      <td className="p-2 border border-border">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase print:text-[6.5pt] ${
                            ev.category === "ON_STAGE"
                              ? "bg-accent-muted text-accent-strong border border-accent/30"
                              : "bg-surface-raised text-ink-muted border border-border"
                          }`}
                        >
                          {ev.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
                        </span>
                      </td>
                      <td className="p-2 border border-border">
                        <div className="font-semibold text-ink break-words">{ev.venue}</div>
                        <div className="text-[10px] text-ink-muted print:text-[6.5pt]">
                          {formatReportTime(ev.dateTime)}
                        </div>
                      </td>
                      <td className="p-2 border border-border">
                        <div className="font-bold text-ink break-words">{ev.staffCoordinator.name}</div>
                        <div className="text-[10px] text-ink-muted break-words print:text-[6.5pt]">
                          {ev.staffCoordinator.phone !== "—" ? ev.staffCoordinator.phone : ev.staffCoordinator.email}
                        </div>
                      </td>
                      <td className="p-2 border border-border">
                        <div className="font-bold text-ink break-words">{ev.studentCoordinator.name}</div>
                        <div className="text-[10px] text-ink-muted break-words print:text-[6.5pt]">
                          {ev.studentCoordinator.phone !== "—" ? ev.studentCoordinator.phone : ev.studentCoordinator.email}
                        </div>
                      </td>
                      <td className="p-2 border border-border text-center font-bold print:text-[7pt]">
                        {ev.hasPrelims ? (
                          <span className="text-accent-strong font-bold">Yes</span>
                        ) : (
                          <span className="text-ink-subtle">Direct</span>
                        )}
                      </td>
                      <td className="p-2 border border-border text-center font-bold tabular-nums print:text-[7pt]">
                        {ev.registrationsCount}
                      </td>
                      <td className="p-2 border border-border print:hidden no-print text-center">
                        <button
                          onClick={() => handleDownloadEventCSV(ev.id, ev.name)}
                          disabled={downloadingEventId === ev.id}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-accent hover:text-white hover:bg-accent rounded-[8px] border border-accent/30 transition cursor-pointer disabled:opacity-50"
                          title={`Download ${ev.name} participant CSV roster`}
                        >
                          {downloadingEventId === ev.id ? (
                            <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          <span>CSV</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 2B: INDOOR VENUE FLOOR PLAN & COMPETITION ZONES DIRECTORY
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "venue") && (
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-ink">
                  2B. Indoor Venue Floor Plan & Competition Zones Directory
                </h3>
              </div>
              <span className="text-xs font-bold text-ink-muted no-print print:hidden">
                Campus Wayfinding & Arenas
              </span>
            </div>

            {/* Visual Floor Plan Display */}
            <div className="mb-6 rounded-2xl border border-border bg-surface-raised p-4 print:bg-surface print:border-border-strong print:p-2 print:break-inside-avoid">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    Official Indoor Floor Plan — Sacred Heart College Campus
                  </h4>
                  <p className="text-[11px] text-ink-muted print:text-[7pt]">
                    Active map layout with delineated competition halls, preliminary screening rooms, amenities, and wayfinding checkpoints.
                  </p>
                </div>
                <div className="no-print print:hidden flex items-center gap-2">
                  <Link
                    href={data.edition?.floorPlanUrl || "/uploads/campus-floorplan.svg"}
                    target="_blank"
                    className="text-[11px] font-bold text-accent hover:text-accent-hover bg-accent-muted px-2.5 py-1 rounded-[8px] border border-accent/30"
                  >
                    View Raw Vector SVG
                  </Link>
                  <Link
                    href="/loc/wp-entrance"
                    target="_blank"
                    className="text-[11px] font-bold text-ink hover:text-accent bg-surface px-2.5 py-1 rounded-[8px] border border-border hover:border-accent"
                  >
                    Open Live Interactive Map →
                  </Link>
                </div>
              </div>

              {/* Map Image rendering */}
              <div className="w-full flex items-center justify-center bg-surface-raised rounded-[16px] p-3 overflow-hidden border border-border print:bg-surface print:border-border-strong print:p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.edition?.floorPlanUrl || "/uploads/campus-floorplan.svg"}
                  alt="Official Fest Floor Plan Map"
                  className="max-h-[360px] w-auto max-w-full object-contain print:max-h-[300px]"
                />
              </div>
            </div>

            {/* Zones & Hall Assignment Legend Table */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-ink">
                  Zone & Hall Allocation Legend ({zoneAllocations.length} Active Zones)
                </h4>
              </div>

              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left text-xs border-collapse border border-border print:text-[7pt] print:table-fixed">
                  <thead>
                    <tr className="bg-surface-raised text-ink font-bold border-b border-border print:bg-surface-raised">
                      <th className="p-2 border border-border w-8 print:w-[5%] text-center">#</th>
                      <th className="p-2 border border-border print:w-[15%]">Zone ID / Code</th>
                      <th className="p-2 border border-border print:w-[18%]">Human-Readable Label</th>
                      <th className="p-2 border border-border print:w-[27%]">Allocated Competitions</th>
                      <th className="p-2 border border-border print:w-[20%]">Physical Venue Text</th>
                      <th className="p-2 border border-border print:w-[15%]">Navigation Checkpoint</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {zoneAllocations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-ink-muted text-xs">
                          No indoor map zones currently allocated to competitions. Assign zone IDs under Admin Events.
                        </td>
                      </tr>
                    ) : (
                      zoneAllocations.map((z, idx) => (
                        <tr key={z.zoneId} className="hover:bg-surface-raised/80 print:break-inside-avoid print:hover:bg-transparent">
                          <td className="p-2 border border-border text-center font-bold text-ink-muted">
                            {idx + 1}
                          </td>
                          <td className="p-2 border border-border">
                            <span className="font-mono font-bold text-xs print:text-[7pt] text-accent bg-accent-muted px-1.5 py-0.5 rounded border border-accent/30 print:border-none print:p-0 print:bg-transparent">
                              {z.zoneId}
                            </span>
                          </td>
                          <td className="p-2 border border-border">
                            <strong className="text-ink block">{z.zoneLabel}</strong>
                          </td>
                          <td className="p-2 border border-border">
                            {z.mainEvents.length === 0 && z.prelimsEvents.length === 0 ? (
                              <span className="text-ink-subtle italic">General Campus Zone / Facility</span>
                            ) : (
                              <div className="space-y-1">
                                {z.mainEvents.map((ev) => (
                                  <div key={ev.id} className="text-ink text-[11px] print:text-[7pt]">
                                    <span className="font-bold text-ink">{ev.name}</span>
                                    <span className="ml-1 text-[9px] font-bold text-accent uppercase bg-accent-muted px-1 rounded">Main</span>
                                    <div className="text-[10px] text-ink-muted">{ev.coordinator}</div>
                                  </div>
                                ))}
                                {z.prelimsEvents.map((ev) => (
                                  <div key={`prelim-${ev.id}`} className="text-ink text-[11px] print:text-[7pt]">
                                    <span className="font-bold text-ink">{ev.name}</span>
                                    <span className="ml-1 text-[9px] font-bold text-ink-muted uppercase bg-surface-raised px-1 rounded">Prelims</span>
                                    <div className="text-[10px] text-ink-muted">{ev.coordinator}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-2 border border-border text-ink-muted">
                            {z.mainEvents[0]?.venue || z.prelimsEvents[0]?.venue || "Sacred Heart College Campus"}
                          </td>
                          <td className="p-2 border border-border">
                            <div className="font-mono text-[10px] print:text-[6.5pt] text-ink-muted">
                              /loc/{z.zoneId}
                            </div>
                            <div className="text-[9px] text-ink-subtle print:text-[6pt]">
                              QR Scannable Waypoint
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Campus Facilities & Amenities Directory */}
            <div className="border-t border-border pt-4 print:break-inside-avoid">
              <h4 className="text-xs font-bold text-ink mb-2">
                Campus Facilities & Services Directory
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs print:text-[7pt]">
                <div className="border border-border rounded-[16px] p-2.5 bg-surface-raised print:bg-transparent">
                  <div className="font-bold text-ink">Restrooms / Washrooms</div>
                  <div className="text-ink-muted text-[10px] print:text-[6.5pt] mt-0.5">Ground & 1st Floor Corridors</div>
                  <div className="font-mono text-[9px] text-accent mt-1">amenity-restroom-*</div>
                </div>
                <div className="border border-border rounded-[16px] p-2.5 bg-surface-raised print:bg-transparent">
                  <div className="font-bold text-ink">Drinking Water Stations</div>
                  <div className="text-ink-muted text-[10px] print:text-[6.5pt] mt-0.5">RO Water Purifiers (All Wings)</div>
                  <div className="font-mono text-[9px] text-accent mt-1">amenity-water-*</div>
                </div>
                <div className="border border-border rounded-[16px] p-2.5 bg-surface-raised print:bg-transparent">
                  <div className="font-bold text-ink">Dining & Refreshments</div>
                  <div className="text-ink-muted text-[10px] print:text-[6.5pt] mt-0.5">Main College Canteen & Counters</div>
                  <div className="font-mono text-[9px] text-accent mt-1">amenity-food-*</div>
                </div>
                <div className="border border-border rounded-[16px] p-2.5 bg-surface-raised print:bg-transparent">
                  <div className="font-bold text-ink">Helpdesk & First Aid</div>
                  <div className="text-ink-muted text-[10px] print:text-[6.5pt] mt-0.5">Auditorium Main Lobby</div>
                  <div className="font-mono text-[9px] text-accent mt-1">amenity-helpdesk-*</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3: COLLEGE DELEGATIONS TALLY
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "delegations") && (
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-accent" />
                <h3 className="text-base font-bold text-ink">
                  3. Participating College Delegations Representation Tally
                </h3>
              </div>
              <span className="text-xs font-bold text-ink-muted no-print print:hidden">
                Total Colleges: {data.delegations.length}
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse border border-border print:text-[7pt] print:table-fixed">
                <thead>
                  <tr className="bg-surface-raised text-ink font-bold border-b border-border print:bg-surface-raised">
                    <th className="p-2 border border-border w-8 print:w-[4%] text-center">#</th>
                    <th className="p-2 border border-border print:w-[26%]">College / Institution Name</th>
                    <th className="p-2 border border-border print:w-[14%]">Department</th>
                    <th className="p-2 border border-border print:w-[18%]">Contingent Team Lead</th>
                    <th className="p-2 border border-border print:w-[18%]">Accompanying Faculty</th>
                    <th className="p-2 border border-border print:w-[11%] text-center">Delegates</th>
                    <th className="p-2 border border-border print:w-[9%] text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.delegations.map((del, idx) => (
                    <tr key={del.id} className="hover:bg-surface-raised/80 print:break-inside-avoid print:hover:bg-transparent">
                      <td className="p-2 border border-border text-center font-bold text-ink-muted">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-border">
                        <strong className="text-ink text-xs print:text-[8pt] break-words block">{del.collegeName}</strong>
                        {del.teamName && (
                          <span className="text-[10px] text-ink-muted block break-words print:text-[7.5pt]">Team: {del.teamName}</span>
                        )}
                      </td>
                      <td className="p-2 border border-border text-ink-muted break-words">
                        {del.department || "General"}
                      </td>
                      <td className="p-2 border border-border">
                        <div className="font-semibold text-ink break-words">{del.teamLeadName}</div>
                        <div className="text-[10px] text-ink-muted break-words print:text-[7.5pt]">{del.teamLeadPhone}</div>
                      </td>
                      <td className="p-2 border border-border">
                        {del.staffInchargeName ? (
                          <div>
                            <div className="font-semibold text-ink break-words">{del.staffInchargeName}</div>
                            <div className="text-[10px] text-ink-muted break-words print:text-[7.5pt]">{del.staffInchargePhone || "—"}</div>
                          </div>
                        ) : (
                          <span className="text-ink-subtle italic">None</span>
                        )}
                      </td>
                      <td className="p-2 border border-border text-center font-bold tabular-nums print:text-[8pt]">
                        {del.checkedInCount} / {del.memberCount}
                      </td>
                      <td className="p-2 border border-border text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase print:border ${
                            del.paymentStatus === "PAID"
                              ? "bg-success-surface text-success-ink border-success-border"
                              : "bg-warning-surface text-warning-ink border-warning-border"
                          }`}
                        >
                          {del.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 4: MASTER STUDENT REGISTRATION ROSTER
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "roster") && (
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-base font-bold text-ink">
                    4. Master Student Registration & Enrollment Roster
                  </h3>
                  <span className="text-xs text-ink-muted">
                    Showing {filteredRoster.length} of {data.masterStudentRoster.length} participants
                  </span>
                </div>
              </div>

              {/* Screen Filters */}
              <div className="no-print print:hidden flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, college, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-8 pr-3 bg-surface-raised border border-border rounded-[8px] text-xs text-ink placeholder-ink-subtle focus:outline-none focus:border-accent"
                  />
                </div>

                <select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  className="h-9 px-3 bg-surface-raised border border-border rounded-[8px] text-xs text-ink font-semibold focus:outline-none focus:border-accent"
                >
                  <option value="ALL">All Competitions</option>
                  {data.events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={exportMasterRosterCSV}
                  className="px-3 py-2 bg-surface-raised hover:bg-surface-sunken text-ink-muted rounded-[8px] text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse border border-border print:text-[7pt] print:table-fixed">
                <thead>
                  <tr className="bg-surface-raised text-ink font-bold border-b border-border print:bg-surface-raised">
                    <th className="p-2 border border-border w-8 print:w-[4%] text-center">#</th>
                    <th className="p-2 border border-border print:w-[18%]">Delegate Name</th>
                    <th className="p-2 border border-border print:w-[22%]">College / Institution</th>
                    <th className="p-2 border border-border print:w-[16%]">Contact Details</th>
                    <th className="p-2 border border-border print:w-[10%]">Gate Pass</th>
                    <th className="p-2 border border-border print:w-[20%]">Enrolled Competitions</th>
                    <th className="p-2 border border-border print:w-[10%] text-center">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRoster.map((s, idx) => (
                    <tr key={s.userId} className="hover:bg-surface-raised/80 print:break-inside-avoid print:hover:bg-transparent">
                      <td className="p-2 border border-border text-center font-bold text-ink-muted">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-border">
                        <div className="font-bold text-ink flex items-center gap-1 flex-wrap">
                          <span className="break-words">{s.name}</span>
                          {s.isTeamLead && (
                            <span className="text-[9px] bg-accent-muted text-accent-strong px-1 py-0.2 rounded font-bold print:text-[6.5pt] print:border print:border-accent/30">
                              LEAD
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 border border-border text-ink font-medium">
                        <div className="break-words">{s.college}</div>
                        {s.department && <span className="text-[10px] text-ink-muted block break-words print:text-[6.5pt]">({s.department})</span>}
                      </td>
                      <td className="p-2 border border-border">
                        <div className="text-ink font-semibold break-words">{s.phone}</div>
                        <div className="text-[10px] text-ink-muted truncate print:text-clip break-all max-w-[140px] print:max-w-none print:text-[6.5pt]">{s.email}</div>
                      </td>
                      <td className="p-2 border border-border font-mono text-[10px] text-ink-muted break-words print:text-[7pt]">
                        {s.badgeCode || "—"}
                      </td>
                      <td className="p-2 border border-border">
                        {/* Interactive badges for screen */}
                        <div className="flex flex-wrap gap-1 print:hidden">
                          {s.events.map((ev) => (
                            <span
                              key={ev.eventId}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                ev.category === "ON_STAGE"
                              ? "bg-accent-muted text-accent-strong border border-accent/30"
                              : "bg-surface-raised text-ink-muted border border-border"
                            }`}
                          >
                            {ev.eventName}
                          </span>
                        ))}
                      </div>
                      {/* Compact text list for PDF/Print to prevent row splitting */}
                      <div className="hidden print:block text-[7pt] text-ink leading-tight font-medium">
                        {s.events.map((ev) => ev.eventName).join(", ") || "—"}
                      </div>
                    </td>
                    <td className="p-2 border border-border text-center">
                      {s.attended ? (
                        <span className="text-success-ink font-bold text-[9px] bg-success-surface px-1.5 py-0.5 rounded border border-success-border inline-block print:text-[6.5pt] print:px-1">
                          PRESENT
                        </span>
                      ) : (
                        <span className="text-ink-subtle text-[9px] font-bold inline-block print:text-[6.5pt]">
                          ABSENT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* =========================================================================
            SECTION 5: PRELIMS TO MAINS PROGRESSION & SCORES
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "prelims") && (
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-base font-bold text-ink">
                    5. Prelims Screening, Evaluation Scores & Mains Progression
                  </h3>
                  <span className="text-xs text-ink-muted">
                    Detailed record of prelims nominees, scores, qualification remarks, and advancement to mains
                  </span>
                </div>
              </div>
              <button
                onClick={exportPrelimsProgressionCSV}
                className="no-print print:hidden text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            {data.prelimsProgression.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-muted border border-dashed border-border rounded-2xl">
                No preliminary rounds configured or no participants registered for prelims yet.
              </div>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left text-xs border-collapse border border-border print:text-[7pt] print:table-fixed">
                  <thead>
                    <tr className="bg-surface-raised text-ink font-bold border-b border-border print:bg-surface-raised">
                      <th className="p-2 border border-border w-8 print:w-[4%] text-center">#</th>
                      <th className="p-2 border border-border print:w-[18%]">Competition</th>
                      <th className="p-2 border border-border print:w-[18%]">Participant Name</th>
                      <th className="p-2 border border-border print:w-[20%]">College / Institution</th>
                      <th className="p-2 border border-border print:w-[8%] text-center">Score</th>
                      <th className="p-2 border border-border print:w-[10%] text-center">Status</th>
                      <th className="p-2 border border-border print:w-[14%]">Remarks</th>
                      <th className="p-2 border border-border print:w-[8%] text-center">Mains</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.prelimsProgression.map((p, idx) => (
                      <tr key={p.registrationId} className="hover:bg-surface-raised/80 print:break-inside-avoid print:hover:bg-transparent">
                        <td className="p-2 border border-border text-center font-bold text-ink-muted">
                          {idx + 1}
                        </td>
                        <td className="p-2 border border-border">
                          <strong className="text-ink block break-words print:text-[8pt]">{p.eventName}</strong>
                          <span className="text-[10px] text-ink-muted print:text-[7pt]">{p.eventCategory}</span>
                        </td>
                        <td className="p-2 border border-border">
                          <div className="font-bold text-ink break-words">{p.studentName}</div>
                          <div className="text-[10px] text-ink-muted print:text-[7pt]">{p.studentPhone}</div>
                        </td>
                        <td className="p-2 border border-border text-ink-muted font-medium break-words">
                          {p.collegeName}
                        </td>
                        <td className="p-2 border border-border text-center font-bold text-ink tabular-nums print:text-[8pt]">
                          {p.prelimsScore ?? "—"}
                        </td>
                        <td className="p-2 border border-border text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase print:border ${
                              p.clearedToMains
                                ? "bg-success-surface text-success-ink border-success-border"
                                : p.prelimsStatus === "ELIMINATED"
                                ? "bg-danger-surface text-danger-ink border-danger-border"
                                : "bg-warning-surface text-warning-ink border-warning-border"
                            }`}
                          >
                            {p.prelimsStatus}
                          </span>
                        </td>
                        <td className="p-2 border border-border text-[10px] text-ink-muted italic break-words print:text-[7.5pt]">
                          {p.prelimsNotes || "—"}
                        </td>
                        <td className="p-2 border border-border text-center">
                          {p.clearedToMains ? (
                            <span className="text-success-ink font-bold text-[8pt] flex items-center justify-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-success print:hidden" />
                              <span>CLEARED</span>
                            </span>
                          ) : (
                            <span className="text-ink-subtle font-medium text-[8pt]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SECTION 6: OFFICIAL FINAL RESULTS & WINNERS
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "results") && (
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                <h3 className="text-base font-bold text-ink">
                  6. Official Competition Results & Winners Podium
                </h3>
              </div>
              <button
                onClick={exportFinalResultsCSV}
                className="no-print print:hidden text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            {data.finalResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-muted border border-dashed border-border rounded-2xl">
                No competition results published yet. Coordinators will publish scores and winners via their Event Consoles.
              </div>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left text-xs border-collapse border border-border print:text-[7pt] print:table-fixed">
                  <thead>
                    <tr className="bg-surface-raised text-ink font-bold border-b border-border print:bg-surface-raised">
                      <th className="p-2 border border-border w-8 print:w-[4%] text-center">#</th>
                      <th className="p-2 border border-border print:w-[22%]">Competition</th>
                      <th className="p-2 border border-border print:w-[18%] text-center">Award / Standing</th>
                      <th className="p-2 border border-border print:w-[24%]">Winning Student Name</th>
                      <th className="p-2 border border-border print:w-[24%]">College / Institution</th>
                      <th className="p-2 border border-border print:w-[8%] text-center">Final Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.finalResults.map((res, idx) => (
                      <tr key={res.registrationId} className="hover:bg-surface-raised/80 print:break-inside-avoid print:hover:bg-transparent">
                        <td className="p-2 border border-border text-center font-bold text-ink-muted">
                          {idx + 1}
                        </td>
                        <td className="p-2 border border-border font-bold text-ink break-words">
                          {res.eventName}
                        </td>
                        <td className="p-2 border border-border text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs print:text-[7pt] font-bold inline-flex items-center gap-1 ${
                              res.rank === 1
                                ? "bg-gold text-gold-ink border border-gold"
                                : res.rank === 2
                                ? "bg-surface-sunken text-ink border border-border-strong"
                                : res.rank === 3
                                ? "bg-gold-muted text-gold-ink border border-gold/40"
                                : "bg-surface-raised text-ink"
                            }`}
                          >
                            {res.rank === 1 ? (
                              <>
                                <Medal className="w-3.5 h-3.5 text-gold-ink print:hidden" />
                                <span>1st Place</span>
                              </>
                            ) : res.rank === 2 ? (
                              <>
                                <Medal className="w-3.5 h-3.5 text-ink print:hidden" />
                                <span>2nd Place</span>
                              </>
                            ) : res.rank === 3 ? (
                              <>
                                <Medal className="w-3.5 h-3.5 text-gold-ink print:hidden" />
                                <span>3rd Place</span>
                              </>
                            ) : (
                              <span>{res.result}</span>
                            )}
                          </span>
                        </td>
                        <td className="p-2 border border-border font-bold text-ink break-words">
                          {res.studentName}
                        </td>
                        <td className="p-2 border border-border font-medium text-ink break-words">
                          {res.collegeName}
                        </td>
                        <td className="p-2 border border-border text-center font-bold text-ink tabular-nums print:text-[7pt]">
                          {res.score ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SECTION 7: OVERALL COLLEGE CHAMPIONSHIP STANDINGS
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "championship") && (
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-gold" />
                <div>
                  <h3 className="text-base font-bold text-ink">
                    7. Overall Intercollegiate Championship Trophy Leaderboard
                  </h3>
                  <span className="text-xs text-ink-muted">
                    Points Weightage: 1st Place = 10 pts, 2nd Place = 7 pts, 3rd Place = 5 pts
                  </span>
                </div>
              </div>
              <button
                onClick={exportChampionshipCSV}
                className="no-print print:hidden text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse border border-border print:text-[7pt] print:table-fixed">
                <thead>
                  <tr className="bg-surface-raised text-ink font-bold border-b border-border print:bg-surface-raised">
                    <th className="p-2 border border-border w-12 print:w-[6%] text-center">Rank</th>
                    <th className="p-2 border border-border print:w-[36%]">College / Institution Name</th>
                    <th className="p-2 border border-border print:w-[9%] text-center">Golds (10)</th>
                    <th className="p-2 border border-border print:w-[9%] text-center">Silvers (7)</th>
                    <th className="p-2 border border-border print:w-[9%] text-center">Bronzes (5)</th>
                    <th className="p-2 border border-border print:w-[14%] text-center">Total Points</th>
                    <th className="p-2 border border-border print:w-[17%] text-center">Trophy Title</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.championshipLeaderboard.map((col, idx) => (
                    <tr
                      key={col.collegeName}
                      className={`print:break-inside-avoid print:hover:bg-transparent ${
                        idx === 0 && col.totalPoints > 0
                          ? "bg-gold-muted font-bold print:bg-gold-muted"
                          : idx === 1 && col.totalPoints > 0
                          ? "bg-surface-raised font-bold"
                          : "hover:bg-surface-raised/80"
                      }`}
                    >
                      <td className="p-2 border border-border text-center font-bold">
                        {idx === 0 && col.totalPoints > 0 ? (
                          <span className="w-5 h-5 rounded-full bg-gold text-gold-ink font-bold inline-flex items-center justify-center text-xs">
                            1
                          </span>
                        ) : idx === 1 && col.totalPoints > 0 ? (
                          <span className="w-5 h-5 rounded-full bg-border-strong text-ink font-bold inline-flex items-center justify-center text-xs">
                            2
                          </span>
                        ) : (
                          <span className="text-ink-muted font-bold">{idx + 1}</span>
                        )}
                      </td>
                      <td className="p-2 border border-border font-bold text-ink break-words">
                        {col.collegeName}
                      </td>
                      <td className="p-2 border border-border text-center font-bold text-gold-ink tabular-nums print:text-[7pt]">
                        {col.goldCount}
                      </td>
                      <td className="p-2 border border-border text-center font-bold text-ink-muted tabular-nums print:text-[7pt]">
                        {col.silverCount}
                      </td>
                      <td className="p-2 border border-border text-center font-bold text-gold-ink tabular-nums print:text-[7pt]">
                        {col.bronzeCount}
                      </td>
                      <td className="p-2 border border-border text-center font-bold text-sm print:text-[7.5pt] text-accent tabular-nums">
                        {col.totalPoints} pts
                      </td>
                      <td className="p-2 border border-border text-center">
                        {idx === 0 && col.totalPoints > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-gold text-gold-ink font-bold text-[9px] uppercase inline-flex items-center gap-1 print:border print:border-gold print:text-[6.5pt]">
                            <Trophy className="w-3 h-3 text-gold-ink print:hidden" />
                            <span>Champion</span>
                          </span>
                        ) : idx === 1 && col.totalPoints > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-surface-sunken text-ink font-bold text-[9px] uppercase inline-flex items-center gap-1 print:border print:border-border-strong print:text-[6.5pt]">
                            <Medal className="w-3 h-3 text-ink-muted print:hidden" />
                            <span>Runner-Up</span>
                          </span>
                        ) : (
                          <span className="text-ink-subtle text-[9px] print:text-[6.5pt]">Participant</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION: CATERING LOGISTICS & DIETARY DISTRIBUTION REPORT
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "catering") && (
          <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card print:border-none print:shadow-none print:p-0 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent block mb-0.5">
                  Dining & Hospitality Services
                </span>
                <h3 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-accent print:hidden" />
                  <span>Catering Logistics & Dietary Distribution Report</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Official meal tally & dietary preference roster for food contractors, catering vendors, and dining hall audit.
                </p>
              </div>

              <div className="flex items-center gap-2 no-print print:hidden">
                <Link
                  href="/food"
                  className="px-3.5 py-1.5 rounded-[8px] bg-surface border border-border text-xs font-bold text-ink hover:border-accent hover:text-accent transition flex items-center gap-1.5"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Open Food Console</span>
                </Link>
                <button
                  onClick={exportCateringVendorCSV}
                  className="px-3.5 py-1.5 rounded-[8px] bg-accent hover:bg-accent-hover text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Vendor CSV</span>
                </button>
              </div>
            </div>

            {/* Catering Breakdown KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:grid-cols-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-raised border border-border">
                <div className="text-[10px] font-bold uppercase text-ink-muted tracking-wider">Total Meals Ordered</div>
                <div className="text-xl sm:text-2xl font-bold text-ink mt-1 tabular-nums">
                  {data.cateringSummary?.totalEligible ?? 0}
                </div>
                <div className="text-[11px] text-ink-muted mt-1">
                  {data.cateringSummary?.totalClaimed ?? 0} served ({data.cateringSummary?.claimPercentage ?? 0}%)
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-success-surface border border-success-border">
                <div className="text-[10px] font-bold uppercase text-success-ink tracking-wider flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-success print:hidden" />
                  <span>Vegetarian Meals</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-success-ink mt-1 tabular-nums">
                  {data.cateringSummary?.veg.requested ?? 0}
                </div>
                <div className="text-[11px] text-success-ink mt-1">
                  {data.cateringSummary?.veg.claimed ?? 0} served • {data.cateringSummary?.veg.remaining ?? 0} pending
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-warning-surface border border-warning-border">
                <div className="text-[10px] font-bold uppercase text-warning-ink tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-warning print:hidden" />
                  <span>Non-Vegetarian Meals</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-warning-ink mt-1 tabular-nums">
                  {data.cateringSummary?.nonVeg.requested ?? 0}
                </div>
                <div className="text-[11px] text-warning-ink mt-1">
                  {data.cateringSummary?.nonVeg.claimed ?? 0} served • {data.cateringSummary?.nonVeg.remaining ?? 0} pending
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-surface-raised border border-border">
                <div className="text-[10px] font-bold uppercase text-ink-muted tracking-wider">Queue Remaining</div>
                <div className="text-xl sm:text-2xl font-bold text-ink mt-1 tabular-nums">
                  {data.cateringSummary?.totalRemaining ?? 0}
                </div>
                <div className="text-[11px] text-ink-muted mt-1">
                  Delegates yet to claim lunch token
                </div>
              </div>
            </div>

            {/* Detailed Catering Roster Table */}
            <div className="overflow-x-auto print:overflow-visible pt-2">
              <table className="w-full text-left text-xs border-collapse border border-border print:text-[7pt] print:table-fixed">
                <thead>
                  <tr className="bg-surface-raised text-ink font-bold border-b border-border">
                    <th className="p-2 border border-border w-10 text-center print:w-[5%]">S.No</th>
                    <th className="p-2 border border-border print:w-[25%]">Student Delegate Name</th>
                    <th className="p-2 border border-border print:w-[25%]">College / Institution</th>
                    <th className="p-2 border border-border print:w-[15%] text-center">Dietary Choice</th>
                    <th className="p-2 border border-border print:w-[15%] text-center font-mono">Token Code</th>
                    <th className="p-2 border border-border print:w-[15%] text-center">Claim Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(data.cateringRoster || []).map((c) => (
                    <tr key={c.id} className="hover:bg-surface-raised/70 print:break-inside-avoid">
                      <td className="p-2 border border-border text-center font-mono text-ink-muted">
                        {c.sNo}
                      </td>
                      <td className="p-2 border border-border font-bold text-ink">
                        {c.name}
                        {c.phone && (
                          <span className="block text-[10px] font-normal text-ink-subtle font-mono">
                            {c.phone}
                          </span>
                        )}
                      </td>
                      <td className="p-2 border border-border text-ink-muted">
                        {c.collegeName}
                      </td>
                      <td className="p-2 border border-border text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            c.foodPreference === "VEG"
                              ? "bg-success-surface text-success-ink border border-success-border"
                              : "bg-warning-surface text-warning-ink border border-warning-border"
                          }`}
                        >
                          <span>{c.foodPreference === "VEG" ? "🥗 VEG" : "🍗 NON-VEG"}</span>
                        </span>
                      </td>
                      <td className="p-2 border border-border text-center font-mono font-bold text-ink">
                        {c.foodTokenCode}
                      </td>
                      <td className="p-2 border border-border text-center">
                        {c.foodTokenClaimed ? (
                          <span className="text-[10px] font-bold text-success-ink inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-success print:hidden" />
                            <span>SERVED</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-ink-subtle">
                            PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 8: FORMAL ACADEMIC CERTIFICATION & SIGNATURES BLOCK
            ========================================================================= */}
        <div className="official-certification-block bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-card print:shadow-none print:break-inside-avoid space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle block mb-1">
              Official Institutional Validation
            </span>
            <h4 className="text-sm sm:text-base font-bold text-ink">
              Certification & Endorsement Declaration
            </h4>
            <p className="text-xs text-ink-muted leading-relaxed mt-1">
              This is to officially certify that the data, competition rosters, prelims progression evaluation, and
              final results recorded in this document have been validated against official symposium records for{" "}
              <strong>{summary.festName} {summary.festEdition}</strong> organized by the{" "}
              <strong>{summary.hostDepartment}</strong>, {summary.institutionName}. This document constitutes the
              official verified record for submission to the <strong>Internal Quality Assurance Cell (IQAC)</strong>,{" "}
              <strong>College Annual Report & Academic Portfolios</strong>, and Institutional Quality Audits.
            </p>
          </div>

          {/* 4 Formal Academic Signature Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-6 pt-6 border-t border-border text-center">
            <div className="space-y-12">
              <div className="h-10" />
              <div className="border-t border-border-strong pt-2">
                <div className="text-xs font-bold text-ink uppercase">Staff Coordinator</div>
                <div className="text-[10px] text-ink-muted font-semibold">{summary.hostDepartment}</div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="h-10" />
              <div className="border-t border-border-strong pt-2">
                <div className="text-xs font-bold text-ink uppercase">Student Coordinator</div>
                <div className="text-[10px] text-ink-muted font-semibold">{summary.festName} {summary.festEdition}</div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="h-10" />
              <div className="border-t border-border-strong pt-2">
                <div className="text-xs font-bold text-ink uppercase">Head of Department</div>
                <div className="text-[10px] text-ink-muted font-semibold">{summary.hostDepartment}</div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="h-10" />
              <div className="border-t border-border-strong pt-2">
                <div className="text-xs font-bold text-ink uppercase">Principal / Secretary</div>
                <div className="text-[10px] text-ink-muted font-semibold">{summary.institutionName}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-ink-subtle font-medium">
            <span>
              Report Generated Electronically: {summary.generatedAt ? `${formatReportDate(summary.generatedAt)} at ${formatReportTime(summary.generatedAt)}` : "Live Session"}
            </span>
            <span>Authorized by: {summary.generatedBy.name} ({summary.generatedBy.email})</span>
          </div>
        </div>

      </div>
    </div>
  );
}
