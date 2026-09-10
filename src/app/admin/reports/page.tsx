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

interface ReportData {
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
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
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
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
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
    "all" | "summary" | "catering" | "events" | "delegations" | "roster" | "prelims" | "results" | "championship"
  >("all");
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

  if (status === "loading" || loading || !mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p suppressHydrationWarning className="text-xs font-bold text-slate-600 uppercase tracking-widest">
          Loading Event Reports...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="dash-card max-w-md p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Failed to Load Reports</h2>
          <p className="text-xs text-slate-500">{error || "No data available."}</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/admin"
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
            >
              Return to Admin
            </Link>
            <button
              onClick={fetchReports}
              className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition"
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] print:bg-white print:text-black">
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
            color: #0f172a !important;
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
          .bg-white,
          [class*="rounded-3xl"],
          [class*="rounded-2xl"],
          [class*="shadow-xs"],
          [class*="shadow-sm"] {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            background: transparent !important;
          }
          .official-certification-block {
            border: 1px solid #94a3b8 !important;
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
            border: 1px solid #cbd5e1 !important;
            box-sizing: border-box !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 800 !important;
            font-size: 6.5pt !important;
            text-transform: uppercase !important;
            letter-spacing: 0.02em !important;
          }
        }
      `}} />

      {/* SCREEN ONLY: Top Control Navigation Bar */}
      <div className="print:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-3 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Return to Admin Console"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  Official Event Report
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Edition: {summary.festName} {summary.festEdition}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>Official Comprehensive Event Report</span>
              </h1>
            </div>
          </div>

          {/* Action Export & Print Setup Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Print Orientation Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setPrintOrientation("portrait")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  printOrientation === "portrait"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Print in Portrait (Standard A4)"
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setPrintOrientation("landscape")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  printOrientation === "landscape"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Print in Landscape (Wide Table Layout)"
              >
                Landscape
              </button>
            </div>

            <button
              onClick={fetchReports}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Print Official Report */}
            <button
              onClick={handlePrint}
              className="px-3.5 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Print Official Report (PDF)</span>
            </button>

            {/* CSV Dropdown / Actions */}
            <div className="relative group">
              <button className="px-3.5 sm:px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer">
                <Download className="w-4 h-4" />
                <span>Export CSVs</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 hidden group-hover:block z-50 animate-in fade-in duration-150">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Download Datasets
                </div>
                <button
                  onClick={exportMasterRosterCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Master Student Roster ({data.masterStudentRoster.length})</span>
                </button>
                <button
                  onClick={exportPrelimsProgressionCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-2 cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Prelims & Mains Scores ({data.prelimsProgression.length})</span>
                </button>
                <button
                  onClick={exportFinalResultsCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-2 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Final Results & Winners ({data.finalResults.length})</span>
                </button>
                <button
                  onClick={exportEventsCoordinatorsCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-2 cursor-pointer"
                >
                  <Theater className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Events & Coordinators ({data.events.length})</span>
                </button>
                <button
                  onClick={exportChampionshipCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-2 border-t border-slate-100 cursor-pointer"
                >
                  <Medal className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>College Championship Standings</span>
                </button>
                <button
                  onClick={exportCateringVendorCSV}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-700 transition flex items-center gap-2 border-t border-slate-100 cursor-pointer"
                >
                  <Utensils className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Catering & Food Vendor List ({data.cateringRoster?.length || 0})</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs (Screen Only - Responsive Wrap) */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 pb-1">
          {[
            { id: "all", label: "Full Report (All Sections)" },
            { id: "summary", label: "Executive Summary" },
            { id: "catering", label: `🍱 Catering & Dietary (${data.cateringSummary?.totalClaimed ?? 0}/${data.cateringSummary?.totalEligible ?? 0})` },
            { id: "events", label: `Events & Coordinators (${data.events.length})` },
            { id: "delegations", label: `College Delegations (${data.delegations.length})` },
            { id: "roster", label: `Master Student Roster (${data.masterStudentRoster.length})` },
            { id: "prelims", label: `Prelims Progression (${data.prelimsProgression.length})` },
            { id: "results", label: `Final Results (${data.finalResults.length})` },
            { id: "championship", label: "Championship Standings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                activeSection === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:mb-6 text-center space-y-3">
          {/* Institutional Crest & Details */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-center justify-center gap-2 text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1">
              <Landmark className="w-4 h-4 text-orange-600" />
              <span>Official Institutional Event Documentation</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight uppercase">
              {summary.institutionName}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium max-w-3xl mx-auto mt-1 leading-relaxed">
              {summary.accreditationText}
            </p>
            <div className="mt-2 inline-block px-4 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
              {summary.hostDepartment}
            </div>
          </div>

          {/* Event Wordmark & Metadata Title */}
          <div className="pt-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-orange-600">
              OFFICIAL EVENT REPORT & ANNUAL DOCUMENTATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {summary.festName} {summary.festEdition} — Consolidated Report
            </h2>
            <p className="text-xs italic text-slate-500 mt-0.5">
              &ldquo;{summary.tagline}&rdquo;
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Venue: <strong>{summary.venue}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{summary.contactEmail}</span>
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 1: EXECUTIVE FEST METRICS & KPI SUMMARY
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "summary") && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:break-inside-avoid">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                  1. Executive Summary & Fest Participation Metrics
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase no-print print:hidden">
                Key Performance Indicators
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 sm:gap-4 print:gap-2">
              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 print:p-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 block">
                  Colleges Represented
                </span>
                <span className="text-2xl sm:text-3xl print:text-xl font-black text-orange-950 tabular-nums">
                  {summary.totalCollegesCount}
                </span>
                <span className="text-[10px] text-orange-700/80 block mt-0.5">Institutions registered</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 print:p-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                  Total Student Delegates
                </span>
                <span className="text-2xl sm:text-3xl print:text-xl font-black text-amber-950 tabular-nums">
                  {summary.totalUniqueStudentsCount}
                </span>
                <span className="text-[10px] text-amber-700/80 block mt-0.5">Unique participants</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 print:p-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                  Verified Attendance
                </span>
                <span className="text-2xl sm:text-3xl print:text-xl font-black text-emerald-950 tabular-nums">
                  {summary.attendedStudentsCount}
                </span>
                <span className="text-[10px] text-emerald-700/80 block mt-0.5">
                  {summary.attendancePercentage}% Check-in Rate
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 print:p-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                  Total Competitions
                </span>
                <span className="text-2xl sm:text-3xl print:text-xl font-black text-blue-950 tabular-nums">
                  {summary.totalEvents}
                </span>
                <span className="text-[10px] text-blue-700/80 block mt-0.5">
                  {summary.onStageEventsCount} On-Stage • {summary.offStageEventsCount} Off-Stage
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 sm:gap-4 print:gap-2 mt-3 print:mt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 print:p-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Total Registrations
                </span>
                <span className="text-xl print:text-base font-black text-slate-900 tabular-nums">
                  {summary.totalRegistrationsCount}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 print:p-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Prelims Candidates
                </span>
                <span className="text-xl print:text-base font-black text-slate-900 tabular-nums">
                  {summary.prelimsNomineesCount}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 print:p-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Mains Finalists
                </span>
                <span className="text-xl print:text-base font-black text-emerald-700 tabular-nums">
                  {summary.prelimsClearedCount}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 print:p-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Podium Winners Awarded
                </span>
                <span className="text-xl print:text-base font-black text-orange-600 tabular-nums">
                  {summary.totalWinnersCount}
                </span>
              </div>
            </div>

            {/* Championship Spotlight in Summary */}
            {summary.overallChampionCollege && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-sm">
                    <Trophy className="w-5 h-5 text-amber-950" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                      Overall Symposium Champion Institution
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-slate-950">
                      {summary.overallChampionCollege.collegeName}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-800">
                  <span>Score: <strong className="text-amber-700 text-base">{summary.overallChampionCollege.totalPoints} pts</strong></span>
                  <span>1st Places: <strong className="text-amber-700">{summary.overallChampionCollege.goldCount}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SECTION 2: EVENTS DIRECTORY & COORDINATORS LIST
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "events") && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Theater className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                  2. Competitions Catalogue & Coordinators Directory
                </h3>
              </div>
              <button
                onClick={exportEventsCoordinatorsCSV}
                className="no-print print:hidden text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse border border-slate-200 print:text-[7pt] print:table-fixed">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200 print:bg-slate-100">
                    <th className="p-2 border border-slate-200 w-8 print:w-[4%] text-center">#</th>
                    <th className="p-2 border border-slate-200 print:w-[21%]">Event Name</th>
                    <th className="p-2 border border-slate-200 print:w-[10%]">Category</th>
                    <th className="p-2 border border-slate-200 print:w-[15%]">Venue & Schedule</th>
                    <th className="p-2 border border-slate-200 print:w-[18%]">Faculty In-Charge</th>
                    <th className="p-2 border border-slate-200 print:w-[18%]">Student Coordinator</th>
                    <th className="p-2 border border-slate-200 print:w-[7%] text-center">Prelims</th>
                    <th className="p-2 border border-slate-200 print:w-[7%] text-center">Enrolled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.events.map((ev, idx) => (
                    <tr key={ev.id} className="hover:bg-slate-50/80 print:break-inside-avoid print:hover:bg-transparent">
                      <td className="p-2 border border-slate-200 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-slate-200">
                        <strong className="text-slate-900 block text-xs print:text-[7.5pt] break-words">{ev.name}</strong>
                        {ev.rules && (
                          <span className="text-[10px] text-slate-500 line-clamp-1 no-print print:hidden">
                            {ev.rules}
                          </span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-200">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase print:text-[6.5pt] ${
                            ev.category === "ON_STAGE"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {ev.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
                        </span>
                      </td>
                      <td className="p-2 border border-slate-200">
                        <div className="font-semibold text-slate-800 break-words">{ev.venue}</div>
                        <div className="text-[10px] text-slate-500 print:text-[6.5pt]">
                          {formatReportTime(ev.dateTime)}
                        </div>
                      </td>
                      <td className="p-2 border border-slate-200">
                        <div className="font-bold text-slate-900 break-words">{ev.staffCoordinator.name}</div>
                        <div className="text-[10px] text-slate-500 break-words print:text-[6.5pt]">
                          {ev.staffCoordinator.phone !== "—" ? ev.staffCoordinator.phone : ev.staffCoordinator.email}
                        </div>
                      </td>
                      <td className="p-2 border border-slate-200">
                        <div className="font-bold text-slate-900 break-words">{ev.studentCoordinator.name}</div>
                        <div className="text-[10px] text-slate-500 break-words print:text-[6.5pt]">
                          {ev.studentCoordinator.phone !== "—" ? ev.studentCoordinator.phone : ev.studentCoordinator.email}
                        </div>
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-bold print:text-[7pt]">
                        {ev.hasPrelims ? (
                          <span className="text-amber-700 font-extrabold">Yes</span>
                        ) : (
                          <span className="text-slate-400">Direct</span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-extrabold tabular-nums print:text-[7pt]">
                        {ev.registrationsCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECTION 3: COLLEGE DELEGATIONS TALLY
            ========================================================================= */}
        {(activeSection === "all" || activeSection === "delegations") && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                  3. Participating College Delegations Representation Tally
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500 no-print print:hidden">
                Total Colleges: {data.delegations.length}
              </span>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse border border-slate-200 print:text-[7pt] print:table-fixed">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200 print:bg-slate-100">
                    <th className="p-2 border border-slate-200 w-8 print:w-[4%] text-center">#</th>
                    <th className="p-2 border border-slate-200 print:w-[26%]">College / Institution Name</th>
                    <th className="p-2 border border-slate-200 print:w-[14%]">Department</th>
                    <th className="p-2 border border-slate-200 print:w-[18%]">Contingent Team Lead</th>
                    <th className="p-2 border border-slate-200 print:w-[18%]">Accompanying Faculty</th>
                    <th className="p-2 border border-slate-200 print:w-[11%] text-center">Delegates</th>
                    <th className="p-2 border border-slate-200 print:w-[9%] text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.delegations.map((del, idx) => (
                    <tr key={del.id} className="hover:bg-slate-50/80 print:break-inside-avoid print:hover:bg-transparent">
                      <td className="p-2 border border-slate-200 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-slate-200">
                        <strong className="text-slate-900 text-xs print:text-[8pt] break-words block">{del.collegeName}</strong>
                        {del.teamName && (
                          <span className="text-[10px] text-slate-500 block break-words print:text-[7.5pt]">Team: {del.teamName}</span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 text-slate-700 break-words">
                        {del.department || "General"}
                      </td>
                      <td className="p-2 border border-slate-200">
                        <div className="font-semibold text-slate-900 break-words">{del.teamLeadName}</div>
                        <div className="text-[10px] text-slate-500 break-words print:text-[7.5pt]">{del.teamLeadPhone}</div>
                      </td>
                      <td className="p-2 border border-slate-200">
                        {del.staffInchargeName ? (
                          <div>
                            <div className="font-semibold text-slate-900 break-words">{del.staffInchargeName}</div>
                            <div className="text-[10px] text-slate-500 break-words print:text-[7.5pt]">{del.staffInchargePhone || "—"}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-extrabold tabular-nums print:text-[8pt]">
                        {del.checkedInCount} / {del.memberCount}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase print:border ${
                            del.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                    4. Master Student Registration & Enrollment Roster
                  </h3>
                  <span className="text-xs text-slate-500">
                    Showing {filteredRoster.length} of {data.masterStudentRoster.length} participants
                  </span>
                </div>
              </div>

              {/* Screen Filters */}
              <div className="no-print print:hidden flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, college, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-orange-500"
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
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse border border-slate-200 print:text-[7pt] print:table-fixed">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200 print:bg-slate-100">
                    <th className="p-2 border border-slate-200 w-8 print:w-[4%] text-center">#</th>
                    <th className="p-2 border border-slate-200 print:w-[18%]">Delegate Name</th>
                    <th className="p-2 border border-slate-200 print:w-[22%]">College / Institution</th>
                    <th className="p-2 border border-slate-200 print:w-[16%]">Contact Details</th>
                    <th className="p-2 border border-slate-200 print:w-[10%]">Gate Pass</th>
                    <th className="p-2 border border-slate-200 print:w-[20%]">Enrolled Competitions</th>
                    <th className="p-2 border border-slate-200 print:w-[10%] text-center">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRoster.map((s, idx) => (
                    <tr key={s.userId} className="hover:bg-slate-50/80 print:break-inside-avoid print:hover:bg-transparent">
                      <td className="p-2 border border-slate-200 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-slate-200">
                        <div className="font-bold text-slate-900 flex items-center gap-1 flex-wrap">
                          <span className="break-words">{s.name}</span>
                          {s.isTeamLead && (
                            <span className="text-[9px] bg-orange-100 text-orange-800 px-1 py-0.2 rounded font-black print:text-[6.5pt] print:border print:border-orange-300">
                              LEAD
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 border border-slate-200 text-slate-800 font-medium">
                        <div className="break-words">{s.college}</div>
                        {s.department && <span className="text-[10px] text-slate-500 block break-words print:text-[6.5pt]">({s.department})</span>}
                      </td>
                      <td className="p-2 border border-slate-200">
                        <div className="text-slate-800 font-semibold break-words">{s.phone}</div>
                        <div className="text-[10px] text-slate-500 truncate print:text-clip break-all max-w-[140px] print:max-w-none print:text-[6.5pt]">{s.email}</div>
                      </td>
                      <td className="p-2 border border-slate-200 font-mono text-[10px] text-slate-700 break-words print:text-[7pt]">
                        {s.badgeCode || "—"}
                      </td>
                      <td className="p-2 border border-slate-200">
                        {/* Interactive badges for screen */}
                        <div className="flex flex-wrap gap-1 print:hidden">
                          {s.events.map((ev) => (
                            <span
                              key={ev.eventId}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                ev.category === "ON_STAGE"
                              ? "bg-purple-50 text-purple-800 border border-purple-200"
                              : "bg-blue-50 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {ev.eventName}
                          </span>
                        ))}
                      </div>
                      {/* Compact text list for PDF/Print to prevent row splitting */}
                      <div className="hidden print:block text-[7pt] text-slate-900 leading-tight font-medium">
                        {s.events.map((ev) => ev.eventName).join(", ") || "—"}
                      </div>
                    </td>
                    <td className="p-2 border border-slate-200 text-center">
                      {s.attended ? (
                        <span className="text-emerald-700 font-black text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block print:text-[6.5pt] print:px-1">
                          PRESENT
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[9px] font-bold inline-block print:text-[6.5pt]">
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                    5. Prelims Screening, Evaluation Scores & Mains Progression
                  </h3>
                  <span className="text-xs text-slate-500">
                    Detailed record of prelims nominees, scores, qualification remarks, and advancement to mains
                  </span>
                </div>
              </div>
              <button
                onClick={exportPrelimsProgressionCSV}
                className="no-print print:hidden text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            {data.prelimsProgression.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl">
                No preliminary rounds configured or no participants registered for prelims yet.
              </div>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left text-xs border-collapse border border-slate-200 print:text-[7pt] print:table-fixed">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200 print:bg-slate-100">
                      <th className="p-2 border border-slate-200 w-8 print:w-[4%] text-center">#</th>
                      <th className="p-2 border border-slate-200 print:w-[18%]">Competition</th>
                      <th className="p-2 border border-slate-200 print:w-[18%]">Participant Name</th>
                      <th className="p-2 border border-slate-200 print:w-[20%]">College / Institution</th>
                      <th className="p-2 border border-slate-200 print:w-[8%] text-center">Score</th>
                      <th className="p-2 border border-slate-200 print:w-[10%] text-center">Status</th>
                      <th className="p-2 border border-slate-200 print:w-[14%]">Remarks</th>
                      <th className="p-2 border border-slate-200 print:w-[8%] text-center">Mains</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.prelimsProgression.map((p, idx) => (
                      <tr key={p.registrationId} className="hover:bg-slate-50/80 print:break-inside-avoid print:hover:bg-transparent">
                        <td className="p-2 border border-slate-200 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2 border border-slate-200">
                          <strong className="text-slate-900 block break-words print:text-[8pt]">{p.eventName}</strong>
                          <span className="text-[10px] text-slate-500 print:text-[7pt]">{p.eventCategory}</span>
                        </td>
                        <td className="p-2 border border-slate-200">
                          <div className="font-bold text-slate-900 break-words">{p.studentName}</div>
                          <div className="text-[10px] text-slate-500 print:text-[7pt]">{p.studentPhone}</div>
                        </td>
                        <td className="p-2 border border-slate-200 text-slate-700 font-medium break-words">
                          {p.collegeName}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-black text-slate-900 tabular-nums print:text-[8pt]">
                          {p.prelimsScore ?? "—"}
                        </td>
                        <td className="p-2 border border-slate-200 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase print:border ${
                              p.clearedToMains
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : p.prelimsStatus === "ELIMINATED"
                                ? "bg-rose-100 text-rose-800 border-rose-200"
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                          >
                            {p.prelimsStatus}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-200 text-[10px] text-slate-600 italic break-words print:text-[7.5pt]">
                          {p.prelimsNotes || "—"}
                        </td>
                        <td className="p-2 border border-slate-200 text-center">
                          {p.clearedToMains ? (
                            <span className="text-emerald-700 font-extrabold text-[8pt] flex items-center justify-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 print:hidden" />
                              <span>CLEARED</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-[8pt]">—</span>
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                  6. Official Competition Results & Winners Podium
                </h3>
              </div>
              <button
                onClick={exportFinalResultsCSV}
                className="no-print print:hidden text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            {data.finalResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl">
                No competition results published yet. Coordinators will publish scores and winners via their Event Consoles.
              </div>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left text-xs border-collapse border border-slate-200 print:text-[7pt] print:table-fixed">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200 print:bg-slate-100">
                      <th className="p-2 border border-slate-200 w-8 print:w-[4%] text-center">#</th>
                      <th className="p-2 border border-slate-200 print:w-[22%]">Competition</th>
                      <th className="p-2 border border-slate-200 print:w-[18%] text-center">Award / Standing</th>
                      <th className="p-2 border border-slate-200 print:w-[24%]">Winning Student Name</th>
                      <th className="p-2 border border-slate-200 print:w-[24%]">College / Institution</th>
                      <th className="p-2 border border-slate-200 print:w-[8%] text-center">Final Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.finalResults.map((res, idx) => (
                      <tr key={res.registrationId} className="hover:bg-slate-50/80 print:break-inside-avoid print:hover:bg-transparent">
                        <td className="p-2 border border-slate-200 text-center font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900 break-words">
                          {res.eventName}
                        </td>
                        <td className="p-2 border border-slate-200 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs print:text-[7pt] font-black inline-flex items-center gap-1 ${
                              res.rank === 1
                                ? "bg-amber-400 text-amber-950 border border-amber-500"
                                : res.rank === 2
                                ? "bg-slate-200 text-slate-900 border border-slate-400"
                                : res.rank === 3
                                ? "bg-amber-700/20 text-amber-900 border border-amber-600/40"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {res.rank === 1 ? (
                              <>
                                <Medal className="w-3.5 h-3.5 text-amber-950 print:hidden" />
                                <span>1st Place</span>
                              </>
                            ) : res.rank === 2 ? (
                              <>
                                <Medal className="w-3.5 h-3.5 text-slate-800 print:hidden" />
                                <span>2nd Place</span>
                              </>
                            ) : res.rank === 3 ? (
                              <>
                                <Medal className="w-3.5 h-3.5 text-amber-800 print:hidden" />
                                <span>3rd Place</span>
                              </>
                            ) : (
                              <span>{res.result}</span>
                            )}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-200 font-extrabold text-slate-900 break-words">
                          {res.studentName}
                        </td>
                        <td className="p-2 border border-slate-200 font-medium text-slate-800 break-words">
                          {res.collegeName}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-black text-slate-900 tabular-nums print:text-[7pt]">
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:break-before-page">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Medal className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                    7. Overall Intercollegiate Championship Trophy Leaderboard
                  </h3>
                  <span className="text-xs text-slate-500">
                    Points Weightage: 1st Place = 10 pts, 2nd Place = 7 pts, 3rd Place = 5 pts
                  </span>
                </div>
              </div>
              <button
                onClick={exportChampionshipCSV}
                className="no-print print:hidden text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse border border-slate-200 print:text-[7pt] print:table-fixed">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200 print:bg-slate-100">
                    <th className="p-2 border border-slate-200 w-12 print:w-[6%] text-center">Rank</th>
                    <th className="p-2 border border-slate-200 print:w-[36%]">College / Institution Name</th>
                    <th className="p-2 border border-slate-200 print:w-[9%] text-center">Golds (10)</th>
                    <th className="p-2 border border-slate-200 print:w-[9%] text-center">Silvers (7)</th>
                    <th className="p-2 border border-slate-200 print:w-[9%] text-center">Bronzes (5)</th>
                    <th className="p-2 border border-slate-200 print:w-[14%] text-center">Total Points</th>
                    <th className="p-2 border border-slate-200 print:w-[17%] text-center">Trophy Title</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.championshipLeaderboard.map((col, idx) => (
                    <tr
                      key={col.collegeName}
                      className={`print:break-inside-avoid print:hover:bg-transparent ${
                        idx === 0 && col.totalPoints > 0
                          ? "bg-amber-50/70 font-bold print:bg-amber-50/50"
                          : idx === 1 && col.totalPoints > 0
                          ? "bg-slate-50 font-bold"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="p-2 border border-slate-200 text-center font-black">
                        {idx === 0 && col.totalPoints > 0 ? (
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-black inline-flex items-center justify-center text-xs">
                            1
                          </span>
                        ) : idx === 1 && col.totalPoints > 0 ? (
                          <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-900 font-black inline-flex items-center justify-center text-xs">
                            2
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold">{idx + 1}</span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 font-bold text-slate-900 break-words">
                        {col.collegeName}
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-extrabold text-amber-700 tabular-nums print:text-[7pt]">
                        {col.goldCount}
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-extrabold text-slate-600 tabular-nums print:text-[7pt]">
                        {col.silverCount}
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-extrabold text-amber-900 tabular-nums print:text-[7pt]">
                        {col.bronzeCount}
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-black text-sm print:text-[7.5pt] text-orange-600 tabular-nums">
                        {col.totalPoints} pts
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        {idx === 0 && col.totalPoints > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[9px] uppercase inline-flex items-center gap-1 print:border print:border-amber-600 print:text-[6.5pt]">
                            <Trophy className="w-3 h-3 text-amber-950 print:hidden" />
                            <span>Champion</span>
                          </span>
                        ) : idx === 1 && col.totalPoints > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-900 font-black text-[9px] uppercase inline-flex items-center gap-1 print:border print:border-slate-400 print:text-[6.5pt]">
                            <Medal className="w-3 h-3 text-slate-700 print:hidden" />
                            <span>Runner-Up</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[9px] print:text-[6.5pt]">Participant</span>
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
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs print:border-none print:shadow-none print:p-0 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block mb-0.5">
                  Dining & Hospitality Services
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-950 uppercase flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-600 print:hidden" />
                  <span>Catering Logistics & Dietary Distribution Report</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official meal tally & dietary preference roster for food contractors, catering vendors, and dining hall audit.
                </p>
              </div>

              <div className="flex items-center gap-2 no-print print:hidden">
                <Link
                  href="/food"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100 transition flex items-center gap-1.5"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Open Food Console</span>
                </Link>
                <button
                  onClick={exportCateringVendorCSV}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Vendor CSV</span>
                </button>
              </div>
            </div>

            {/* Catering Breakdown KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:grid-cols-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Total Meals Ordered</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
                  {data.cateringSummary?.totalEligible ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {data.cateringSummary?.totalClaimed ?? 0} served ({data.cateringSummary?.claimPercentage ?? 0}%)
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-emerald-600 print:hidden" />
                  <span>Vegetarian Meals</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1 tabular-nums">
                  {data.cateringSummary?.veg.requested ?? 0}
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">
                  {data.cateringSummary?.veg.claimed ?? 0} served • {data.cateringSummary?.veg.remaining ?? 0} pending
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-[10px] font-bold uppercase text-amber-900 tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-600 print:hidden" />
                  <span>Non-Vegetarian Meals</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1 tabular-nums">
                  {data.cateringSummary?.nonVeg.requested ?? 0}
                </div>
                <div className="text-[11px] text-amber-800 mt-1">
                  {data.cateringSummary?.nonVeg.claimed ?? 0} served • {data.cateringSummary?.nonVeg.remaining ?? 0} pending
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Queue Remaining</div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
                  {data.cateringSummary?.totalRemaining ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Delegates yet to claim lunch token
                </div>
              </div>
            </div>

            {/* Detailed Catering Roster Table */}
            <div className="overflow-x-auto print:overflow-visible pt-2">
              <table className="w-full text-left text-xs border-collapse border border-slate-200 print:text-[7pt] print:table-fixed">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-200">
                    <th className="p-2 border border-slate-200 w-10 text-center print:w-[5%]">S.No</th>
                    <th className="p-2 border border-slate-200 print:w-[25%]">Student Delegate Name</th>
                    <th className="p-2 border border-slate-200 print:w-[25%]">College / Institution</th>
                    <th className="p-2 border border-slate-200 print:w-[15%] text-center">Dietary Choice</th>
                    <th className="p-2 border border-slate-200 print:w-[15%] text-center font-mono">Token Code</th>
                    <th className="p-2 border border-slate-200 print:w-[15%] text-center">Claim Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(data.cateringRoster || []).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 print:break-inside-avoid">
                      <td className="p-2 border border-slate-200 text-center font-mono text-slate-500">
                        {c.sNo}
                      </td>
                      <td className="p-2 border border-slate-200 font-bold text-slate-900">
                        {c.name}
                        {c.phone && (
                          <span className="block text-[10px] font-normal text-slate-400 font-mono">
                            {c.phone}
                          </span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 text-slate-700">
                        {c.collegeName}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                            c.foodPreference === "VEG"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          <span>{c.foodPreference === "VEG" ? "🥗 VEG" : "🍗 NON-VEG"}</span>
                        </span>
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-mono font-bold text-slate-800">
                        {c.foodTokenCode}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        {c.foodTokenClaimed ? (
                          <span className="text-[10px] font-bold text-emerald-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 print:hidden" />
                            <span>SERVED</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
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
        <div className="official-certification-block bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs print:shadow-none print:break-inside-avoid space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Official Institutional Validation
            </span>
            <h4 className="text-sm sm:text-base font-black text-slate-950 uppercase">
              Certification & Endorsement Declaration
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              This is to officially certify that the data, competition rosters, prelims progression evaluation, and
              final results recorded in this document have been validated against official symposium records for{" "}
              <strong>{summary.festName} {summary.festEdition}</strong> organized by the{" "}
              <strong>{summary.hostDepartment}</strong>, {summary.institutionName}. This document constitutes the
              official verified record for submission to the <strong>Internal Quality Assurance Cell (IQAC)</strong>,{" "}
              <strong>College Annual Report & Academic Portfolios</strong>, and Institutional Quality Audits.
            </p>
          </div>

          {/* 4 Formal Academic Signature Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-6 pt-6 border-t border-slate-200 text-center">
            <div className="space-y-12">
              <div className="h-10" />
              <div className="border-t border-slate-400 pt-2">
                <div className="text-xs font-black text-slate-900 uppercase">Staff Coordinator</div>
                <div className="text-[10px] text-slate-500 font-semibold">{summary.hostDepartment}</div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="h-10" />
              <div className="border-t border-slate-400 pt-2">
                <div className="text-xs font-black text-slate-900 uppercase">Student Coordinator</div>
                <div className="text-[10px] text-slate-500 font-semibold">{summary.festName} {summary.festEdition}</div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="h-10" />
              <div className="border-t border-slate-400 pt-2">
                <div className="text-xs font-black text-slate-900 uppercase">Head of Department</div>
                <div className="text-[10px] text-slate-500 font-semibold">{summary.hostDepartment}</div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="h-10" />
              <div className="border-t border-slate-400 pt-2">
                <div className="text-xs font-black text-slate-900 uppercase">Principal / Secretary</div>
                <div className="text-[10px] text-slate-500 font-semibold">{summary.institutionName}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 font-medium">
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
