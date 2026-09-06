"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Users,
  Trophy,
  CheckCircle2,
  Clock,
  Theater,
  Laptop,
  Check,
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Palette,
  Eye,
  ArrowRight,
  Landmark,
} from "lucide-react";

interface StatsData {
  totalUsers: number;
  totalStudents: number;
  totalCoordinators: number;
  totalRegistrations: number;
  pendingRegistrations: number;
  confirmedRegistrations: number;
  rejectedRegistrations: number;
  totalEvents: number;
  totalRevenue: number;
}

interface EventBreakdown {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  venue: string | null;
  coordinatorName: string;
  registrationsCount: number;
}

interface RegistrationRecord {
  id: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  result: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    college: string | null;
    phone: string | null;
  };
  event: {
    name: string;
    category: string;
    fee: number;
  };
}

interface EventEditionItem {
  id: string;
  name: string;
  edition: string;
  slug: string;
  isActive: boolean;
  status: string;
  tagline: string | null;
  metadataText: string | null;
  description: string | null;
  venue: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  logoUrl: string | null;
  primaryCtaText: string | null;
  primaryCtaLink: string | null;
  themePrimaryAccent: string | null;
  themeSecondaryAccent: string | null;
  themeBgColor: string | null;

  institutionName?: string | null;
  institutionCrestUrl?: string | null;
  accreditationText?: string | null;
  jubileeBadgeUrl?: string | null;
  hostDepartment?: string | null;
  acronymExpansion?: string | null;
  deptLogoUrl?: string | null;
  stageHeaderBannerUrl?: string | null;

  navItems: { id: string; label: string; url: string; order: number; isEnabled: boolean }[];
  scheduleItems?: { id: string; time: string; title: string; venue?: string | null; description?: string | null; tag?: string | null; order: number }[];
  _count?: { events: number };
}

function toLocalDatetimeInput(dateVal?: Date | string | null) {
  if (!dateVal) return "2026-09-17T09:30";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "2026-09-17T09:30";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AdminOverviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"overview" | "editions" | "branding" | "registrations">("overview");

  const [stats, setStats] = useState<StatsData | null>(null);
  const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [editions, setEditions] = useState<EventEditionItem[]>([]);
  const [activeEdition, setActiveEdition] = useState<EventEditionItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // New Edition Modal Form State
  const [showNewEditionModal, setShowNewEditionModal] = useState(false);
  const [newEditionData, setNewEditionData] = useState({
    name: "SHINE",
    edition: "2027",
    tagline: "Where Ideas Begin to Shine",
    metadataText: "TECHNOLOGY • INNOVATION • CREATIVITY",
    venue: "SGB Main Auditorium, Sacred Heart College",
    makeActive: false,
  });

  // Branding & Stage Banner Form State
  const [brandingForm, setBrandingForm] = useState({
    name: "",
    edition: "",
    tagline: "",
    metadataText: "",
    venue: "",
    startDate: "2026-09-17T09:30",
    logoUrl: "",
    primaryCtaText: "",
    primaryCtaLink: "",
    themePrimaryAccent: "#FF6B1A",
    themeSecondaryAccent: "#D9A441",
    themeBgColor: "#FAF8F5",

    // Stage Header Banner CMS fields
    institutionName: "SACRED HEART COLLEGE (AUTONOMOUS), TIRUPATTUR",
    institutionCrestUrl: "",
    accreditationText: "ACCREDITED BY NAAC (5TH CYCLE - UNDER RAF) WITH A CGPA OF 3.53/4 AT 'A++' GRADE, AFFILIATED TO THIRUVALLUVAR UNIVERSITY TIRUPATTUR - 635 601",
    jubileeBadgeUrl: "",
    hostDepartment: "DEPARTMENT OF COMPUTER APPLICATIONS(PG)",
    acronymExpansion: "SACRED HEART INFORMATICS NETWORK FOR ENTERPRISES",
    deptLogoUrl: "",
    stageHeaderBannerUrl: "",
  });

  // Navigation Items State
  const [newNavLabel, setNewNavLabel] = useState("");
  const [newNavUrl, setNewNavUrl] = useState("");

  // Schedule Items State
  const [newScheduleTime, setNewScheduleTime] = useState("");
  const [newScheduleTitle, setNewScheduleTitle] = useState("");
  const [newScheduleVenue, setNewScheduleVenue] = useState("");
  const [newScheduleDescription, setNewScheduleDescription] = useState("");
  const [newScheduleTag, setNewScheduleTag] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session && session.user.role === "ADMIN") {
      loadAdminData();
    }
  }, [session]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Load Stats
      const statsRes = await fetch("/api/admin/stats");
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
        setEventBreakdown(statsData.eventBreakdown);
      }

      // 2. Load Registrations
      const regRes = await fetch("/api/admin/registrations");
      const regData = await regRes.json();
      if (regData.success) {
        setRegistrations(regData.registrations);
      }

      // 3. Load Event Editions
      const edRes = await fetch("/api/admin/edition");
      const edData = await edRes.json();
      if (edData.success && edData.editions) {
        setEditions(edData.editions);
        const currentActive = edData.editions.find((e: EventEditionItem) => e.isActive) || edData.editions[0];
        if (currentActive) {
          setActiveEdition(currentActive);
          setBrandingForm({
            name: currentActive.name || "",
            edition: currentActive.edition || "",
            tagline: currentActive.tagline || "",
            metadataText: currentActive.metadataText || "",
            venue: currentActive.venue || "",
            startDate: toLocalDatetimeInput(currentActive.startDate),
            logoUrl: currentActive.logoUrl || "",
            primaryCtaText: currentActive.primaryCtaText || "EXPLORE SHINE →",
            primaryCtaLink: currentActive.primaryCtaLink || "#events",
            themePrimaryAccent: currentActive.themePrimaryAccent || "#FF6B1A",
            themeSecondaryAccent: currentActive.themeSecondaryAccent || "#D9A441",
            themeBgColor: currentActive.themeBgColor || "#FAF8F5",

            institutionName: currentActive.institutionName || "SACRED HEART COLLEGE (AUTONOMOUS), TIRUPATTUR",
            institutionCrestUrl: currentActive.institutionCrestUrl || "",
            accreditationText: currentActive.accreditationText || "Accredited by NAAC (5th Cycle - Under RAF) with a CGPA of 3.53/4 at 'A++' Grade, Affiliated to Thiruvalluvar University Tirupattur - 635 601",
            jubileeBadgeUrl: currentActive.jubileeBadgeUrl || "",
            hostDepartment: currentActive.hostDepartment || "DEPARTMENT OF COMPUTER APPLICATIONS(PG)",
            acronymExpansion: currentActive.acronymExpansion || "SACRED HEART INFORMATICS NETWORK FOR ENTERPRISES",
            deptLogoUrl: currentActive.deptLogoUrl || "",
            stageHeaderBannerUrl: currentActive.stageHeaderBannerUrl || "",
          });
        }
      }
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEdition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEditionData),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewEditionModal(false);
        await loadAdminData();
      } else {
        alert("Failed to create edition: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMakeEditionActive = async (editionId: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edition", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editionId, makeActive: true }),
      });
      const data = await res.json();
      if (data.success) {
        await loadAdminData();
      }
    } catch (err: any) {
      alert("Error setting active edition: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEdition) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edition", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeEdition.id, ...brandingForm }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Branding and Stage Header settings saved successfully!");
        await loadAdminData();
      } else {
        alert("Failed to save branding: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (targetField: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setSaving(true);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setBrandingForm((prev) => ({ ...prev, [targetField]: data.url }));
      } else {
        alert("File upload failed: " + data.error);
      }
    } catch (err: any) {
      alert("Upload error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNavItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEdition || !newNavLabel.trim() || !newNavUrl.trim()) {
      alert("Please enter both Label and URL for the navigation item.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editionId: activeEdition.id,
          label: newNavLabel,
          url: newNavUrl,
          order: (activeEdition.navItems?.length || 0) + 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewNavLabel("");
        setNewNavUrl("");
        alert("✅ Navigation item added successfully!");
        await loadAdminData();
      } else {
        alert("❌ Failed to add navigation item: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Add nav item error:", err);
      alert("❌ Error adding navigation item: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNavItem = async (itemId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/navigation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, isEnabled: !currentStatus }),
      });
      if (res.ok) await loadAdminData();
    } catch (err) {
      console.error("Toggle nav item error:", err);
    }
  };

  const handleDeleteNavItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/admin/navigation?id=${itemId}`, { method: "DELETE" });
      if (res.ok) await loadAdminData();
    } catch (err) {
      console.error("Delete nav item error:", err);
    }
  };

  const handleAddScheduleItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEdition) {
      alert("No active edition selected.");
      return;
    }
    if (!newScheduleTime.trim() || !newScheduleTitle.trim()) {
      alert("Please provide both Time and Title for the schedule entry.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editionId: activeEdition.id,
          time: newScheduleTime,
          title: newScheduleTitle,
          venue: newScheduleVenue || null,
          description: newScheduleDescription || null,
          tag: newScheduleTag || null,
          order: (activeEdition.scheduleItems?.length || 0) + 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewScheduleTime("");
        setNewScheduleTitle("");
        setNewScheduleVenue("");
        setNewScheduleDescription("");
        setNewScheduleTag("");
        alert("✅ Schedule entry added successfully!");
        await loadAdminData();
      } else {
        alert("❌ Failed to add schedule item: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Add schedule item error:", err);
      alert("❌ Error adding schedule item: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScheduleItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this schedule entry?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/schedule?id=${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("✅ Schedule entry deleted.");
        await loadAdminData();
      } else {
        alert("❌ Failed to delete schedule item: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Delete schedule item error:", err);
      alert("❌ Error deleting item: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateRegistrationStatus = async (regId: string, newStatus: "CONFIRMED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, status: newStatus }),
      });
      if (res.ok) await loadAdminData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#FF6B1A] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#64748B] font-semibold">Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  const filteredRegistrations = registrations.filter((r) => {
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesSearch =
      r.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.event.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Admin Header */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              S
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                <span>SHINE Event Platform</span>
                <span className="text-xs bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/30 px-2 py-0.5 rounded-full font-mono">
                  {activeEdition ? `${activeEdition.name} ${activeEdition.edition}` : "ACTIVE"}
                </span>
              </h1>
              <p className="text-xs text-[#64748B]">Multi-Edition Reusable CMS Architecture</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Public Frontend</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-[#CBD5E1] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === "overview"
                  ? "bg-[#0F172A] text-white shadow-md"
                  : "bg-white text-[#64748B] hover:text-[#0F172A] border border-stone-200"
              }`}
            >
              Analytics Overview
            </button>

            <button
              onClick={() => setActiveTab("editions")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                activeTab === "editions"
                  ? "bg-[#0F172A] text-white shadow-md"
                  : "bg-white text-[#64748B] hover:text-[#0F172A] border border-stone-200"
              }`}
            >
              <Layers className="w-4 h-4 text-[#D9A441]" />
              <span>Event Editions ({editions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("branding")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                activeTab === "branding"
                  ? "bg-[#0F172A] text-white shadow-md"
                  : "bg-white text-[#64748B] hover:text-[#0F172A] border border-stone-200"
              }`}
            >
              <Palette className="w-4 h-4 text-[#FF6B1A]" />
              <span>Branding & Hero Manager</span>
            </button>

            <button
              onClick={() => setActiveTab("registrations")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === "registrations"
                  ? "bg-[#0F172A] text-white shadow-md"
                  : "bg-white text-[#64748B] hover:text-[#0F172A] border border-stone-200"
              }`}
            >
              Registrations ({registrations.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/events"
              className="px-3.5 py-2 bg-white border border-[#CBD5E1] text-[#0F172A] font-semibold text-xs rounded-xl hover:bg-stone-50 transition"
            >
              Manage Events Catalog →
            </Link>
            <Link
              href="/admin/users"
              className="px-3.5 py-2 bg-white border border-[#CBD5E1] text-[#0F172A] font-semibold text-xs rounded-xl hover:bg-stone-50 transition"
            >
              Manage Users →
            </Link>
          </div>
        </div>

        {/* TAB 1: ANALYTICS OVERVIEW */}
        {activeTab === "overview" && stats && (
          <div className="space-y-8 animate-fade-in">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="dash-card p-5">
                <div className="flex items-center justify-between text-[#64748B] mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                  <Trophy className="w-4 h-4 text-[#D9A441]" />
                </div>
                <div className="text-3xl font-black text-[#0F172A] tabular-nums">
                  ₹{stats.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1 font-medium">From verified registrations</p>
              </div>

              <div className="dash-card p-5">
                <div className="flex items-center justify-between text-[#64748B] mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Registrations</span>
                  <Users className="w-4 h-4 text-[#FF6B1A]" />
                </div>
                <div className="text-3xl font-black text-[#0F172A] tabular-nums">
                  {stats.totalRegistrations}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1 font-medium">
                  Confirmed: {stats.confirmedRegistrations} | Pending: {stats.pendingRegistrations}
                </p>
              </div>

              <div className="dash-card p-5">
                <div className="flex items-center justify-between text-[#64748B] mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Competitions</span>
                  <Theater className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="text-3xl font-black text-[#0F172A] tabular-nums">
                  {stats.totalEvents}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1 font-medium">Across On-Stage & Off-Stage</p>
              </div>

              <div className="dash-card p-5">
                <div className="flex items-center justify-between text-[#64748B] mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Platform Accounts</span>
                  <Users className="w-4 h-4 text-[#3B82F6]" />
                </div>
                <div className="text-3xl font-black text-[#0F172A] tabular-nums">
                  {stats.totalUsers}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1 font-medium">
                  {stats.totalStudents} Students | {stats.totalCoordinators} Coordinators
                </p>
              </div>
            </div>

            {/* Competition Breakdown Table */}
            <div className="dash-card p-6">
              <h3 className="text-lg font-bold text-[#0F172A] mb-4">Competitions Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase">
                      <th className="py-3 px-4">Event Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Coordinator</th>
                      <th className="py-3 px-4">Fee</th>
                      <th className="py-3 px-4">Registrations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {eventBreakdown.map((ev) => (
                      <tr key={ev.id} className="hover:bg-stone-50 transition">
                        <td className="py-3 px-4 font-bold text-[#0F172A]">{ev.name}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              ev.category === "ON_STAGE"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-purple-100 text-purple-800 border border-purple-300"
                            }`}
                          >
                            {ev.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">{ev.coordinatorName}</td>
                        <td className="py-3 px-4 font-mono font-semibold">₹{ev.fee}</td>
                        <td className="py-3 px-4 font-bold text-[#0F172A] tabular-nums">
                          {ev.registrationsCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-EDITION MANAGEMENT */}
        {activeTab === "editions" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-[#0F172A]">Event Editions Architecture</h3>
                <p className="text-xs text-[#64748B]">
                  Manage annual editions (e.g. SHINE 2026, SHINE 2027). Only 1 edition can be marked ACTIVE.
                </p>
              </div>

              <button
                onClick={() => setShowNewEditionModal(true)}
                className="btn-ember !py-2.5 !px-4 text-xs font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Edition (e.g., SHINE 2027)</span>
              </button>
            </div>

            {/* Editions List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {editions.map((ed) => (
                <div
                  key={ed.id}
                  className={`dash-card p-6 border-2 transition relative ${
                    ed.isActive ? "border-[#FF6B1A] bg-orange-50/20" : "border-[#E2E8F0]"
                  }`}
                >
                  {ed.isActive && (
                    <span className="absolute top-4 right-4 bg-[#FF6B1A] text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full shadow-xs">
                      CURRENTLY ACTIVE
                    </span>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white font-black text-lg">
                      {ed.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#0F172A]">
                        {ed.name} {ed.edition}
                      </h4>
                      <span className="text-xs text-[#64748B] font-mono">Slug: {ed.slug}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#57534E] italic mb-4 font-medium">"{ed.tagline}"</p>

                  <div className="space-y-1 text-xs text-[#64748B] mb-5">
                    <p>📍 Venue: {ed.venue || "Default Auditorium"}</p>
                    <p>🎯 Category Stats: {ed._count?.events || 0} events attached</p>
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                    {!ed.isActive ? (
                      <button
                        onClick={() => handleMakeEditionActive(ed.id)}
                        disabled={saving}
                        className="btn-ember !py-1.5 !px-3 text-xs"
                      >
                        Set as Active Edition
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Serving Live Website
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setActiveEdition(ed);
                        setBrandingForm({
                          name: ed.name || "",
                          edition: ed.edition || "",
                          tagline: ed.tagline || "",
                          metadataText: ed.metadataText || "",
                          venue: ed.venue || "",
                          startDate: toLocalDatetimeInput(ed.startDate),
                          logoUrl: ed.logoUrl || "",
                          primaryCtaText: ed.primaryCtaText || "EXPLORE SHINE →",
                          primaryCtaLink: ed.primaryCtaLink || "#events",
                          themePrimaryAccent: ed.themePrimaryAccent || "#FF6B1A",
                          themeSecondaryAccent: ed.themeSecondaryAccent || "#D9A441",
                          themeBgColor: ed.themeBgColor || "#FAF8F5",
                        });
                        setActiveTab("branding");
                      }}
                      className="text-xs font-semibold text-[#0F172A] hover:text-[#FF6B1A] underline"
                    >
                      Edit Branding & Config →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BRANDING & HERO MANAGER */}
        {activeTab === "branding" && activeEdition && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#0F172A]">
                  Branding & Hero Manager ({activeEdition.name} {activeEdition.edition})
                </h3>
                <p className="text-xs text-[#64748B]">
                  Configure logo, typography, tagline, metadata, CTAs, and color identity without editing code.
                </p>
              </div>

              <span className="text-xs bg-[#FF6B1A]/10 text-[#FF6B1A] font-bold px-3 py-1 rounded-full border border-[#FF6B1A]/30">
                {activeEdition.isActive ? "ACTIVE EDITION" : "INACTIVE EDITION"}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Column 1 & 2: Branding Controls */}
              <div className="lg:col-span-2 space-y-6">
                {/* Event Name & Edition */}
                <div className="dash-card p-6 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] border-b pb-2">
                    1. Event Identity
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">Event Name</label>
                      <input
                        type="text"
                        value={brandingForm.name}
                        onChange={(e) => setBrandingForm({ ...brandingForm, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">Edition / Year</label>
                      <input
                        type="text"
                        value={brandingForm.edition}
                        onChange={(e) => setBrandingForm({ ...brandingForm, edition: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">
                      Event Metadata Subtitle
                    </label>
                    <input
                      type="text"
                      value={brandingForm.metadataText}
                      onChange={(e) => setBrandingForm({ ...brandingForm, metadataText: e.target.value })}
                      placeholder="e.g. TECHNOLOGY • INNOVATION • CREATIVITY"
                      className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">Tagline</label>
                    <input
                      type="text"
                      value={brandingForm.tagline}
                      onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                      placeholder='e.g. "Where Ideas Begin to Shine"'
                      className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">Venue Location</label>
                    <input
                      type="text"
                      value={brandingForm.venue}
                      onChange={(e) => setBrandingForm({ ...brandingForm, venue: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">
                      Symposium Start Date & Countdown Target (Date & Time)
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type="datetime-local"
                        value={brandingForm.startDate}
                        onChange={(e) => setBrandingForm({ ...brandingForm, startDate: e.target.value })}
                        className="w-full sm:w-auto px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none font-mono flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleSaveBranding}
                        disabled={saving}
                        className="bg-[#FF6B1A] hover:bg-[#E8551F] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span>{saving ? "Saving..." : "Save Countdown Date"}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1.5">
                      The countdown timer in the #schedule section dynamically counts down to this exact date and time. Click <strong>Save Countdown Date</strong> to lock it into the database permanently.
                    </p>
                  </div>
                </div>

                {/* Primary CTA Config */}
                <div className="dash-card p-6 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] border-b pb-2">
                    2. Primary Hero Call To Action (CTA)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">CTA Label</label>
                      <input
                        type="text"
                        value={brandingForm.primaryCtaText}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primaryCtaText: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">CTA Target Link</label>
                      <input
                        type="text"
                        value={brandingForm.primaryCtaLink}
                        onChange={(e) => setBrandingForm({ ...brandingForm, primaryCtaLink: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Logo Management */}
                <div className="dash-card p-6 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] border-b pb-2">
                    3. Dynamic Event Logo Upload
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-2">
                      Upload Logo (PNG / SVG / WebP transparent)
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer bg-stone-100 hover:bg-stone-200 border border-stone-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 text-[#0F172A] transition">
                        <Upload className="w-4 h-4 text-[#FF6B1A]" />
                        <span>Choose File...</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload("logoUrl", e)}
                          className="hidden"
                        />
                      </label>

                      <span className="text-xs text-[#94A3B8]">or enter URL directly:</span>
                    </div>

                    <input
                      type="text"
                      value={brandingForm.logoUrl}
                      onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                      placeholder="/uploads/logo.png or https://..."
                      className="w-full mt-3 px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Official College Stage Header Banner CMS Controls */}
                <div className="dash-card p-6 space-y-4 border-2 border-[#D9A441]/40">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-[#FF6B1A]" />
                      <span>4. Official Stage Header Banner (Revealed during Stage View)</span>
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                      Stage View Banner
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">Institution Name</label>
                    <input
                      type="text"
                      value={brandingForm.institutionName}
                      onChange={(e) => setBrandingForm({ ...brandingForm, institutionName: e.target.value })}
                      placeholder="SACRED HEART COLLEGE (AUTONOMOUS), TIRUPATTUR"
                      className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">Accreditation & Affiliation Line</label>
                    <textarea
                      rows={2}
                      value={brandingForm.accreditationText}
                      onChange={(e) => setBrandingForm({ ...brandingForm, accreditationText: e.target.value })}
                      placeholder="ACCREDITED BY NAAC (5TH CYCLE - UNDER RAF)..."
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">Host Department</label>
                      <input
                        type="text"
                        value={brandingForm.hostDepartment}
                        onChange={(e) => setBrandingForm({ ...brandingForm, hostDepartment: e.target.value })}
                        placeholder="DEPARTMENT OF COMPUTER APPLICATIONS(PG)"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">Acronym Expansion (SHINE)</label>
                      <input
                        type="text"
                        value={brandingForm.acronymExpansion}
                        onChange={(e) => setBrandingForm({ ...brandingForm, acronymExpansion: e.target.value })}
                        placeholder="SACRED HEART INFORMATICS NETWORK FOR ENTERPRISES"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                      />
                    </div>
                  </div>

                  {/* Image URLs / Uploads for Crest, MCA Logo, Banner */}
                  <div className="pt-2 border-t space-y-4">
                    {/* 1. Left Crest Logo */}
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">
                        Left Crest Logo (Sacred Heart College Crest)
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer bg-stone-100 hover:bg-stone-200 border border-stone-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-[#0F172A] shrink-0 transition">
                          <Upload className="w-3.5 h-3.5 text-[#FF6B1A]" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload("institutionCrestUrl", e)}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={brandingForm.institutionCrestUrl}
                          onChange={(e) => setBrandingForm({ ...brandingForm, institutionCrestUrl: e.target.value })}
                          placeholder="/uploads/crest.png or https://..."
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl font-mono outline-none"
                        />
                      </div>
                      {brandingForm.institutionCrestUrl && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <img src={brandingForm.institutionCrestUrl} alt="Crest Preview" className="h-9 max-w-[140px] object-contain border rounded p-0.5 bg-white shadow-2xs" />
                          <span className="text-[10px] text-emerald-700 font-bold">Preview Loaded</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Right Department Seal Logo */}
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">
                        Right Department Seal Logo (MCA Department Logo)
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer bg-stone-100 hover:bg-stone-200 border border-stone-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-[#0F172A] shrink-0 transition">
                          <Upload className="w-3.5 h-3.5 text-[#FF6B1A]" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload("deptLogoUrl", e)}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={brandingForm.deptLogoUrl}
                          onChange={(e) => setBrandingForm({ ...brandingForm, deptLogoUrl: e.target.value })}
                          placeholder="/uploads/mca-logo.png or https://..."
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl font-mono outline-none"
                        />
                      </div>
                      {brandingForm.deptLogoUrl && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <img src={brandingForm.deptLogoUrl} alt="Dept Logo Preview" className="h-9 max-w-[140px] object-contain border rounded p-0.5 bg-white shadow-2xs" />
                          <span className="text-[10px] text-emerald-700 font-bold">Preview Loaded</span>
                        </div>
                      )}
                    </div>

                    {/* 3. 75th Jubilee Badge */}
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">
                        75th Jubilee Badge (75 SHC Logo)
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer bg-stone-100 hover:bg-stone-200 border border-stone-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-[#0F172A] shrink-0 transition">
                          <Upload className="w-3.5 h-3.5 text-[#FF6B1A]" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload("jubileeBadgeUrl", e)}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={brandingForm.jubileeBadgeUrl}
                          onChange={(e) => setBrandingForm({ ...brandingForm, jubileeBadgeUrl: e.target.value })}
                          placeholder="/uploads/75-shc.png or https://..."
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl font-mono outline-none"
                        />
                      </div>
                      {brandingForm.jubileeBadgeUrl && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <img src={brandingForm.jubileeBadgeUrl} alt="Jubilee Badge Preview" className="h-8 max-w-[120px] object-contain border rounded p-0.5 bg-white shadow-2xs" />
                          <span className="text-[10px] text-emerald-700 font-bold">Preview Loaded</span>
                        </div>
                      )}
                    </div>

                    {/* 4. Full Custom Banner Graphic */}
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">
                        Full Custom Stage Header Banner Graphic (Overrides separate text/logos)
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer bg-stone-100 hover:bg-stone-200 border border-stone-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-[#0F172A] shrink-0 transition">
                          <Upload className="w-3.5 h-3.5 text-[#FF6B1A]" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload("stageHeaderBannerUrl", e)}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={brandingForm.stageHeaderBannerUrl}
                          onChange={(e) => setBrandingForm({ ...brandingForm, stageHeaderBannerUrl: e.target.value })}
                          placeholder="Upload full banner graphic URL..."
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl font-mono outline-none"
                        />
                      </div>
                      {brandingForm.stageHeaderBannerUrl && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <img src={brandingForm.stageHeaderBannerUrl} alt="Full Banner Preview" className="h-12 max-w-[240px] object-contain border rounded p-0.5 bg-black shadow-2xs" />
                          <span className="text-[10px] text-emerald-700 font-bold">Preview Loaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleSaveBranding}
                    disabled={saving}
                    className="btn-ember !py-3 !px-8 text-sm font-bold"
                  >
                    {saving ? "Saving Changes..." : "Save Branding Configuration"}
                  </button>
                </div>
              </div>

              {/* Column 3: Live Preview Panel */}
              <div className="space-y-6">
                <div className="dash-card p-6 bg-[#FAF8F5] border-2 border-[#E7E5E4] sticky top-24">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#57534E] mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF6B1A]" />
                    <span>Live Hero Preview</span>
                  </h4>

                  <div className="bg-[#FAF8F5] border border-[#1C1917]/10 rounded-2xl p-6 text-center space-y-4 shadow-sm">
                    {brandingForm.logoUrl ? (
                      <img
                        src={brandingForm.logoUrl}
                        alt="Logo Preview"
                        className="max-h-16 mx-auto object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white font-extrabold text-2xl">
                        {brandingForm.name.charAt(0) || "S"}
                      </div>
                    )}

                    <div>
                      <h2
                        className="text-2xl font-extrabold text-[#1C1917]"
                        style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                      >
                        <span className="hero-wordmark-gradient">
                          {brandingForm.name || "SHINE"}
                        </span>{" "}
                        <span className="text-[#1C1917] font-light">
                          {brandingForm.edition || "2026"}
                        </span>
                      </h2>
                      <p className="text-[10px] font-bold tracking-widest text-[#57534E] uppercase mt-1">
                        {brandingForm.metadataText || "TECHNOLOGY • INNOVATION"}
                      </p>
                    </div>

                    <p className="text-xs text-[#44403C] italic font-medium">
                      "{brandingForm.tagline || "Where Ideas Begin to Shine"}"
                    </p>

                    <div className="pt-2">
                      <span className="btn-ember !py-1.5 !px-4 text-xs">
                        {brandingForm.primaryCtaText || "EXPLORE →"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Items Manager */}
                <div className="dash-card p-6">
                  <h4 className="text-sm font-bold text-[#0F172A] mb-3">Dynamic Navigation Items</h4>

                  <div className="space-y-2 mb-4">
                    {activeEdition.navItems?.map((nav) => (
                      <div
                        key={nav.id}
                        className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                      >
                        <span className="font-semibold text-[#0F172A]">{nav.label}</span>
                        <span className="text-[#64748B] font-mono text-[11px]">{nav.url}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleNavItem(nav.id, nav.isEnabled)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              nav.isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                            }`}
                          >
                            {nav.isEnabled ? "Active" : "Hidden"}
                          </button>
                          <button
                            onClick={() => handleDeleteNavItem(nav.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddNavItem} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Label (e.g. Sponsors)"
                      value={newNavLabel}
                      onChange={(e) => setNewNavLabel(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 text-xs border rounded-lg outline-none"
                    />
                    <input
                      type="text"
                      placeholder="URL (#sponsors)"
                      value={newNavUrl}
                      onChange={(e) => setNewNavUrl(e.target.value)}
                      className="w-1/2 px-2.5 py-1.5 text-xs border rounded-lg outline-none"
                    />
                    <button type="submit" className="bg-[#0F172A] text-white px-3 py-1.5 rounded-lg text-xs font-bold">
                      Add
                    </button>
                  </form>
                </div>

                {/* Dynamic Schedule Items Manager */}
                <div className="dash-card p-6">
                  <h4 className="text-sm font-bold text-[#0F172A] mb-3">Dynamic Symposium Schedule</h4>

                  <div className="space-y-2.5 mb-4 max-h-80 overflow-y-auto pr-1">
                    {activeEdition.scheduleItems?.map((sched) => (
                      <div
                        key={sched.id}
                        className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#FF6B1A] font-bold text-[11px] bg-[#FF6B1A]/10 px-2 py-0.5 rounded border border-[#FF6B1A]/20">
                              {sched.time}
                            </span>
                            <span className="font-bold text-[#0F172A]">{sched.title}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteScheduleItem(sched.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete Schedule Entry"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#64748B]">
                          {sched.venue && <span>📍 {sched.venue}</span>}
                          {sched.tag && <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">{sched.tag}</span>}
                        </div>
                        {sched.description && (
                          <p className="text-[11px] text-[#475569] leading-tight mt-1">{sched.description}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddScheduleItem} className="space-y-2 pt-2 border-t border-stone-200">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Time (e.g. 09:30 AM - 10:30 AM)"
                        value={newScheduleTime}
                        onChange={(e) => setNewScheduleTime(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border rounded-lg outline-none font-mono"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Title (e.g. Inauguration)"
                        value={newScheduleTitle}
                        onChange={(e) => setNewScheduleTitle(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border rounded-lg outline-none font-bold"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Venue (e.g. SGB Main Auditorium)"
                        value={newScheduleVenue}
                        onChange={(e) => setNewScheduleVenue(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border rounded-lg outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Tag (e.g. Inauguration, Check-in)"
                        value={newScheduleTag}
                        onChange={(e) => setNewScheduleTag(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border rounded-lg outline-none"
                      />
                    </div>

                    <textarea
                      placeholder="Brief description of this schedule entry..."
                      value={newScheduleDescription}
                      onChange={(e) => setNewScheduleDescription(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none resize-none h-16"
                    />

                    <button type="submit" className="w-full bg-[#FF6B1A] hover:bg-[#E8551F] text-white px-3 py-2 rounded-xl text-xs font-bold transition">
                      + Add Schedule Entry
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REGISTRATIONS MANAGEMENT */}
        {activeTab === "registrations" && (
          <div className="dash-card p-6 animate-fade-in space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-[#0F172A]">All Student Registrations</h3>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search student or event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-xl outline-none w-full sm:w-64"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-xl outline-none font-semibold"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4">Registered Event</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-4 font-bold text-[#0F172A]">
                        <div>{reg.user.name}</div>
                        <div className="text-xs font-normal text-[#64748B]">{reg.user.email}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#64748B]">{reg.user.college || "N/A"}</td>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">{reg.event.name}</td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {reg.status !== "CONFIRMED" && (
                            <button
                              onClick={() => updateRegistrationStatus(reg.id, "CONFIRMED")}
                              className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition"
                              title="Approve Registration"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {reg.status !== "REJECTED" && (
                            <button
                              onClick={() => updateRegistrationStatus(reg.id, "REJECTED")}
                              className="p-1.5 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition"
                              title="Reject Registration"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* CREATE NEW EDITION MODAL */}
      {showNewEditionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#0F172A]">Create New Event Edition</h3>
            <p className="text-xs text-[#64748B]">
              Configure a future edition (e.g., SHINE 2027). You can activate it now or later.
            </p>

            <form onSubmit={handleCreateEdition} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1">Event Name</label>
                <input
                  type="text"
                  value={newEditionData.name}
                  onChange={(e) => setNewEditionData({ ...newEditionData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1">Edition / Year</label>
                <input
                  type="text"
                  value={newEditionData.edition}
                  onChange={(e) => setNewEditionData({ ...newEditionData, edition: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1">Tagline</label>
                <input
                  type="text"
                  value={newEditionData.tagline}
                  onChange={(e) => setNewEditionData({ ...newEditionData, tagline: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="makeActiveCheck"
                  checked={newEditionData.makeActive}
                  onChange={(e) => setNewEditionData({ ...newEditionData, makeActive: e.target.checked })}
                />
                <label htmlFor="makeActiveCheck" className="text-xs font-semibold text-[#0F172A]">
                  Make this the active live edition immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewEditionModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-ember !py-2 !px-4 text-xs font-bold"
                >
                  {saving ? "Creating..." : "Create Edition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
