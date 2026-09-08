"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Mail,
  Trophy,
  Users,
  Settings,
  Calendar,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface ActivityLogItem {
  id: string;
  action: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  targetType: string | null;
  targetId: string | null;
  targetTitle: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface LogCounts {
  all: number;
  auth: number;
  registration: number;
  event: number;
  email: number;
  user: number;
}

export default function AdminLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [counts, setCounts] = useState<LogCounts>({
    all: 0,
    auth: 0,
    registration: 0,
    event: 0,
    email: 0,
    user: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [category, setCategory] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Inspector Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (category !== "ALL") params.set("category", category);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      const data = await safeJson(res, { success: false, logs: [], pagination: { totalPages: 1, totalCount: 0 } });
      if (data.success) {
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
        if (data.counts) setCounts(data.counts);
      } else {
        toast.error(data.error || "Failed to load activity logs.");
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      toast.error("Network error loading activity logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, page, search, toast]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/logs");
      return;
    }

    if (status === "authenticated") {
      if (session.user.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }
      fetchLogs();
    }
  }, [status, session, router, fetchLogs]);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const exportCSV = () => {
    if (logs.length === 0) {
      toast.warning("No activity records available to export.");
      return;
    }

    const headers = [
      "Timestamp",
      "Action",
      "Actor Name",
      "Actor Email",
      "Actor Role",
      "Target Type",
      "Target Title",
      "Details",
    ];

    const rows = logs.map((l) => [
      `"${new Date(l.createdAt).toISOString()}"`,
      `"${l.action}"`,
      `"${l.actorName || ""}"`,
      `"${l.actorEmail || ""}"`,
      `"${l.actorRole || ""}"`,
      `"${l.targetType || ""}"`,
      `"${(l.targetTitle || "").replace(/"/g, '""')}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fest_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit trail exported to CSV.");
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "REGISTRATION_APPROVED":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">Approved</span>;
      case "REGISTRATION_REJECTED":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">Rejected</span>;
      case "REGISTRATION_CREATED":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">Registration</span>;
      case "USER_LOGIN":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800">Login</span>;
      case "USER_CREATED":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800">User Added</span>;
      case "USER_DELETED":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">User Deleted</span>;
      case "EVENT_CREATED":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-100 text-orange-800">Event Created</span>;
      case "EVENT_UPDATED":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">Event Updated</span>;
      case "EVENT_DELETED":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">Event Deleted</span>;
      case "RESULT_UPDATED":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800">Result Awarded</span>;
      case "EMAIL_BROADCAST":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-violet-100 text-violet-800">Email Broadcast</span>;
      case "SMTP_SETTINGS_UPDATED":
      case "EDITION_UPDATED":
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">Config Updated</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-stone-100 text-stone-800">{action}</span>;
    }
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    if (role === "ADMIN") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">ADMIN</span>;
    if (role === "COORDINATOR") return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">COORD</span>;
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">STUDENT</span>;
  };

  if (status === "loading" || loading) {
    return (
      <main className="dash-layout flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading system audit trail...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dash-layout">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-sm">
                S
              </span>
              <span className="font-extrabold text-sm tracking-tight text-slate-900">
                SHINE <span className="text-orange-600">ADMIN</span>
              </span>
            </Link>
            <span className="text-slate-300">/</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <History className="w-3.5 h-3.5 text-orange-600" />
              <span>Activity Audit Trail</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              ← Overview
            </Link>
            <Link
              href="/admin/events"
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Events Catalog
            </Link>
            <Link
              href="/admin/users"
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              User Accounts
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <History className="w-7 h-7 text-orange-600" />
              <span>System Activity Logs</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Full audit trail recording user logins, event registrations, coordinator approvals, award updates, and email dispatches.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportCSV}
              className="tap-target inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => fetchLogs()}
              disabled={refreshing}
              className="tap-target inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
          <button
            onClick={() => handleCategoryChange("ALL")}
            className={`tap-target px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
              category === "ALL"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>All Activities ({counts.all})</span>
          </button>

          <button
            onClick={() => handleCategoryChange("REGISTRATION")}
            className={`tap-target px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
              category === "REGISTRATION"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Registrations & Approvals ({counts.registration})</span>
          </button>

          <button
            onClick={() => handleCategoryChange("AUTH")}
            className={`tap-target px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
              category === "AUTH"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <LogIn className="w-3 h-3" />
            <span>Logins & Sessions ({counts.auth})</span>
          </button>

          <button
            onClick={() => handleCategoryChange("EVENT")}
            className={`tap-target px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
              category === "EVENT"
                ? "bg-orange-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Trophy className="w-3 h-3" />
            <span>Event Management ({counts.event})</span>
          </button>

          <button
            onClick={() => handleCategoryChange("EMAIL")}
            className={`tap-target px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
              category === "EMAIL"
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Mail className="w-3 h-3" />
            <span>Broadcasts & SMTP ({counts.email})</span>
          </button>

          <button
            onClick={() => handleCategoryChange("USER")}
            className={`tap-target px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
              category === "USER"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Users className="w-3 h-3" />
            <span>User Accounts ({counts.user})</span>
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by actor name, student email, target event name, or action keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 bg-white border border-slate-300 rounded-xl pl-10 pr-4 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="tap-target px-5 h-11 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition cursor-pointer shadow-xs shrink-0"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="tap-target px-3 h-11 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>

        {/* Activity Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Timestamp</th>
                  <th className="p-3.5">Actor / User</th>
                  <th className="p-3.5">Action Type</th>
                  <th className="p-3.5">Activity Summary / Target</th>
                  <th className="p-3.5 pr-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No activity logs found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Activities will be logged automatically as students register, coordinators approve, and admins configure the platform.
                      </p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const dateObj = new Date(log.createdAt);
                    const formattedDate = dateObj.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    });
                    const formattedTime = dateObj.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 pl-5 whitespace-nowrap text-slate-600">
                          <div className="font-bold text-slate-900">{formattedDate}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{formattedTime}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{log.actorName || "System"}</span>
                            {getRoleBadge(log.actorRole)}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                            {log.actorEmail || "automated@system"}
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>

                        <td className="p-3.5 max-w-md">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {log.targetTitle || log.action}
                          </div>
                          {log.targetType && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Entity: <span className="font-medium text-slate-600">{log.targetType}</span>
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="tap-target inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-4 text-xs text-slate-600">
              <div>
                Showing page <span className="font-bold text-slate-900">{page}</span> of{" "}
                <span className="font-bold text-slate-900">{totalPages}</span> ({totalCount} total activities)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="tap-target p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="tap-target p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-extrabold text-slate-900">Activity Audit Record</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="tap-target p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 font-medium">Action</span>
                <div className="mt-0.5">{getActionBadge(selectedLog.action)}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Recorded At</span>
                <div className="font-bold text-slate-800 mt-0.5">
                  {new Date(selectedLog.createdAt).toLocaleString("en-IN")}
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Actor</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {selectedLog.actorName || "Unknown"} ({selectedLog.actorRole || "N/A"})
                </div>
                <div className="text-[11px] text-slate-500 font-mono">{selectedLog.actorEmail || "None"}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Target Resource</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedLog.targetTitle || "None"}</div>
                <div className="text-[11px] text-slate-500">{selectedLog.targetType || "System"}</div>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-700 mb-1.5">Payload & Metadata</span>
              <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-60 border border-slate-800">
                {selectedLog.details
                  ? (() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.details), null, 2);
                      } catch {
                        return selectedLog.details;
                      }
                    })()
                  : "No additional metadata recorded."}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="tap-target px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
