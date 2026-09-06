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

export default function AdminOverviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<StatsData | null>(null);
  const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin");
      return;
    }

    if (status === "authenticated") {
      if (session.user.role !== "ADMIN") {
        router.push(session.user.role === "COORDINATOR" ? "/coordinator" : "/dashboard");
        return;
      }

      async function loadAdminData() {
        try {
          const [statsRes, regRes] = await Promise.all([
            fetch("/api/admin/stats"),
            fetch("/api/admin/registrations"),
          ]);

          const statsData = await statsRes.json();
          const regData = await regRes.json();

          if (statsData.success) {
            setStats(statsData.stats);
            setEventBreakdown(statsData.eventBreakdown);
          }

          if (regData.success) {
            setRegistrations(regData.registrations);
          }
        } catch (err) {
          console.error("Admin data load error:", err);
        } finally {
          setLoading(false);
        }
      }
      loadAdminData();
    }
  }, [status, session, router]);

  const handleAdminStatusOverride = async (regId: string, newStatus: "PENDING" | "CONFIRMED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === regId ? { ...r, status: newStatus } : r))
        );
      } else {
        alert(data.message || "Failed to update registration.");
      }
    } catch (err) {
      console.error("Override error:", err);
      alert("Error overriding status.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="dash-layout flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading master control console...</p>
        </div>
      </main>
    );
  }

  const filteredRegistrations = registrations.filter((r) => {
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesSearch =
      r.user.name.toLowerCase().includes(search.toLowerCase()) ||
      r.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.user.college && r.user.college.toLowerCase().includes(search.toLowerCase())) ||
      r.event.name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <main className="dash-layout flex flex-col min-h-screen">
      {/* Light Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="container-wide py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                S
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base">
                SHINE <span className="text-orange-600">26</span>
              </span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md">
              Admin Master Control
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/events"
              className="tap-target px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              Manage Events
            </Link>
            <Link
              href="/admin/users"
              className="tap-target px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Manage Users
            </Link>
            <Link
              href="/leaderboard"
              className="tap-target px-3.5 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-700" />
              Stage Results
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="tap-target px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Wide Body */}
      <div className="container-wide py-8 flex-1">
        {/* Banner */}
        <div className="dash-card p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Fest Administration System
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Master Control Dashboard
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Sacred Heart College (Autonomous), Tirupattur • Real-time fest monitoring & override controls.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-500">Administrator</div>
              <div className="text-xs font-bold text-slate-900">{session?.user?.email}</div>
            </div>
          </div>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="dash-card p-5 border-l-4 border-l-slate-800">
            <div className="text-xs font-bold text-slate-500 uppercase">Total Registrations</div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {stats?.totalRegistrations ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {stats?.confirmedRegistrations ?? 0} Confirmed
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                {stats?.pendingRegistrations ?? 0} Pending
              </span>
            </div>
          </div>

          <div className="dash-card p-5 border-l-4 border-l-orange-500">
            <div className="text-xs font-bold text-slate-500 uppercase">Estimated Revenue</div>
            <div className="text-3xl font-black text-orange-600 mt-1 tabular-nums">
              ₹{stats?.totalRevenue ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              From confirmed event tickets
            </div>
          </div>

          <div className="dash-card p-5 border-l-4 border-l-amber-500">
            <div className="text-xs font-bold text-slate-500 uppercase">Active Competitions</div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {stats?.totalEvents ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Across on-stage & off-stage
            </div>
          </div>

          <div className="dash-card p-5 border-l-4 border-l-emerald-500">
            <div className="text-xs font-bold text-slate-500 uppercase">Total Delegates</div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {stats?.totalStudents ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Coordinated by {stats?.totalCoordinators ?? 0} faculty/students
            </div>
          </div>
        </div>

        {/* Event Participation Breakdown Cards */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Competition Entry Breakdown
            </h2>
            <Link href="/admin/events" className="text-xs font-bold text-orange-600 hover:underline">
              + Manage Competitions & Coordinators →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {eventBreakdown.map((e) => (
              <div key={e.id} className="dash-card p-4 flex justify-between items-center">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase inline-flex items-center gap-1">
                    {e.category === "ON_STAGE" ? (
                      <>
                        <Theater className="w-3 h-3" />
                        <span>On-Stage</span>
                      </>
                    ) : (
                      <>
                        <Laptop className="w-3 h-3" />
                        <span>Off-Stage</span>
                      </>
                    )}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{e.name}</h4>
                  <div className="text-[11px] text-slate-500 truncate">Coord: {e.coordinatorName}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-black text-slate-900 tabular-nums">
                    {e.registrationsCount}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase">Entries</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Fest Registrations with Priority Left Borders */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-base font-bold text-slate-900">
              All Fest Registrations ({filteredRegistrations.length})
            </h2>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search student, college, event..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 bg-white border border-slate-300 rounded-xl px-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 flex-1 sm:w-64"
              />

              <div className="flex bg-white border border-slate-200 rounded-xl p-0.5">
                {["ALL", "PENDING", "CONFIRMED", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`tap-target px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      statusFilter === st ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="dash-card overflow-hidden">
            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 sticky top-0 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 z-10">
                  <tr>
                    <th className="p-3.5">Student Participant</th>
                    <th className="p-3.5">College</th>
                    <th className="p-3.5">Event Competition</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Award / Result</th>
                    <th className="p-3.5 text-right">Admin Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-xs text-slate-500">
                        No registrations found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((r) => {
                      const borderClass =
                        r.status === "CONFIRMED"
                          ? "dash-row-confirmed"
                          : r.status === "REJECTED"
                          ? "dash-row-rejected"
                          : "dash-row-pending";

                      return (
                        <tr key={r.id} className={`hover:bg-slate-50/70 transition-colors ${borderClass}`}>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{r.user.name}</div>
                            <div className="text-[11px] text-slate-500">{r.user.email}</div>
                          </td>
                          <td className="p-3.5 text-slate-700 max-w-[180px] truncate">
                            {r.user.college || "N/A"}
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-900">{r.event.name}</span>
                            <span className="text-[11px] text-slate-500 block tabular-nums">Fee: ₹{r.event.fee}</span>
                          </td>
                          <td className="p-3.5">
                            {r.status === "CONFIRMED" ? (
                              <span className="status-badge status-badge-confirmed inline-flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Confirmed
                              </span>
                            ) : r.status === "REJECTED" ? (
                              <span className="status-badge status-badge-rejected inline-flex items-center gap-1">
                                <X className="w-3 h-3" />
                                Rejected
                              </span>
                            ) : (
                              <span className="status-badge status-badge-pending inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-amber-800">
                            {r.result || <span className="text-slate-300 font-normal">—</span>}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleAdminStatusOverride(r.id, "CONFIRMED")}
                                className="tap-target px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAdminStatusOverride(r.id, "REJECTED")}
                                className="tap-target px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleAdminStatusOverride(r.id, "PENDING")}
                                className="tap-target px-2 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center justify-center"
                                title="Reset to Pending"
                              >
                                <Clock className="w-3 h-3" />
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
        </div>
      </div>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        SHINE 26 Event Management System • Sacred Heart College (Autonomous), Tirupattur
      </footer>
    </main>
  );
}
