"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, History, Pencil, Trash2, KeyRound, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
import Footer from "@/components/Footer";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  role: "STUDENT" | "COORDINATOR" | "FOOD_COORDINATOR" | "ADMIN";
  avatarUrl?: string | null;
  createdAt: string;
  assignedEvents?: {
    id: string;
    name: string;
    category?: string;
  }[];
  _count: {
    registrations: number;
    coordEvents: number;
  };
}

interface FestEventItem {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast, confirmAction } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [availableEvents, setAvailableEvents] = useState<FestEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Create User Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("Sacred Heart College (Autonomous)");
  const [role, setRole] = useState<"COORDINATOR" | "FOOD_COORDINATOR" | "ADMIN">("COORDINATOR");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCollege, setEditCollege] = useState("");
  const [editRole, setEditRole] = useState<"STUDENT" | "COORDINATOR" | "FOOD_COORDINATOR" | "ADMIN">("COORDINATOR");
  const [editPassword, setEditPassword] = useState("");
  const [editAssignedEventIds, setEditAssignedEventIds] = useState<string[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/users");
      return;
    }

    if (status === "authenticated") {
      if (session.user.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }

      loadUsers();
    }
  }, [status, session, router]);

  const loadUsers = async () => {
    try {
      const [usersRes, eventsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/events"),
      ]);
      const data = await safeJson(usersRes, { success: false, users: [] });
      if (data.success && data.users) {
        setUsers(data.users);
      }
      const evData = await safeJson(eventsRes, { success: false, events: [] });
      if (evData.success && evData.events) {
        setAvailableEvents(evData.events);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, college, role, password }),
      });

      const data = await safeJson(res, { success: false, message: "Network error occurred." });
      if (data.success) {
        toast.success(`User "${name}" created successfully.`);
        setShowModal(false);
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        loadUsers();
      } else {
        setErrorMsg(data.message || "Failed to create user.");
      }
    } catch (err) {
      console.error("User creation error:", err);
      setErrorMsg("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u: UserItem) => {
    setEditingUser(u);
    setEditName(u.name || "");
    setEditEmail(u.email || "");
    setEditPhone(u.phone || "");
    setEditCollege(u.college || "Sacred Heart College (Autonomous)");
    setEditRole(u.role);
    setEditPassword("");
    setEditAssignedEventIds(u.assignedEvents ? u.assignedEvents.map((ev) => ev.id) : []);
    setEditErrorMsg("");
  };

  const handleQuickRoleChange = async (u: UserItem, newRole: UserItem["role"]) => {
    if (u.role === newRole) return;
    if (session?.user?.id === u.id && newRole !== "ADMIN") {
      const confirmed = await confirmAction({
        title: "Demote Active Admin Account?",
        message:
          "You are changing your own role away from System Administrator. You will lose admin privileges immediately upon saving. Are you sure?",
        confirmText: "Change Role",
        cancelText: "Cancel",
        isDestructive: true,
      });
      if (!confirmed) return;
    }

    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await safeJson(res, { success: false, message: "Network error occurred." });
      if (data.success && data.user) {
        toast.success(`Role for "${u.name}" changed to ${newRole}.`);
        setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, ...data.user } : item)));
      } else {
        toast.error(data.message || "Failed to change role.");
      }
    } catch (err) {
      console.error("Quick role change error:", err);
      toast.error("Network error while updating role.");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditErrorMsg("");
    setEditSubmitting(true);

    try {
      const payload: Record<string, any> = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || null,
        college: editCollege.trim() || null,
        role: editRole,
        assignedEventIds: editRole === "COORDINATOR" ? editAssignedEventIds : [],
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res, { success: false, message: "Network error occurred." });
      if (data.success && data.user) {
        toast.success(`User "${data.user.name}" updated successfully.`);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  ...data.user,
                }
              : u
          )
        );
        setEditingUser(null);
      } else {
        setEditErrorMsg(data.message || "Failed to update user.");
      }
    } catch (err) {
      console.error("User update error:", err);
      setEditErrorMsg("Network error.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (session?.user?.id === userId) {
      toast.warning("You cannot delete your own active administrator account.", "Action Blocked");
      return;
    }

    const confirmed = await confirmAction({
      title: "Delete User Account",
      message: `Are you sure you want to delete user "${userName}"? This will invalidate their credentials and remove their dashboard access.`,
      confirmText: "Delete User",
      cancelText: "Cancel",
      isDestructive: true,
    });
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await safeJson(res, { success: false, message: "Network error occurred." });
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast.success(`User "${userName}" has been removed.`);
      } else {
        toast.error(data.message || "Failed to delete user.");
      }
    } catch (err) {
      console.error("Delete user error:", err);
      toast.error("Error deleting user.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="dash-layout flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading user accounts...</p>
        </div>
      </main>
    );
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const q = search.toLowerCase().trim();
    if (!q) return matchesRole;
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.college && u.college.toLowerCase().includes(q)) ||
      Boolean(u.assignedEvents?.some((ev) => ev.name.toLowerCase().includes(q)));
    return matchesRole && matchesSearch;
  });

  return (
    <main className="dash-layout flex flex-col min-h-screen">
      {/* Light Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/admin" className="hover:text-slate-900">
              Admin Master Control
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">User Accounts</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/food"
              className="tap-target px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>🍱 Food Console</span>
            </Link>
            <Link
              href="/admin/logs"
              className="tap-target px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-orange-600" />
              <span>Activity Logs</span>
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="tap-target px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              + Add Coordinator / Admin
            </button>
            <Link
              href="/admin"
              className="tap-target px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              ← Back to Control
            </Link>
          </div>
        </div>
      </header>

      {/* Main Wide Body */}
      <div className="container-wide py-8 flex-1">
        {/* Banner */}
        <div className="dash-card p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Account Administration & Roles
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Manage Coordinators, Admins & Delegates
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Grant coordinator permissions, oversee registered students, and manage fest system credentials.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="tap-target px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              + Create Account
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search name, email, institution, or competition..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 bg-white border border-slate-300 rounded-xl px-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex flex-wrap bg-white border border-slate-200 rounded-xl p-1 shrink-0 self-start sm:self-auto max-w-full">
            {([
              { key: "ALL", label: "All Users", count: users.length },
              { key: "COORDINATOR", label: "Coordinators", count: users.filter((u) => u.role === "COORDINATOR").length },
              { key: "FOOD_COORDINATOR", label: "Food Committee", count: users.filter((u) => u.role === "FOOD_COORDINATOR").length },
              { key: "ADMIN", label: "Admins", count: users.filter((u) => u.role === "ADMIN").length },
              { key: "STUDENT", label: "Students", count: users.filter((u) => u.role === "STUDENT").length },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setRoleFilter(key)}
                className={`tap-target px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  roleFilter === key
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                    roleFilter === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="dash-card overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Account User</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4">Institution / Dept</th>
                  <th className="p-4">Assigned Events / Registrations</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate">{u.name}</div>
                          <div className="text-xs text-slate-500 truncate">{u.email}</div>
                          {u.phone && <div className="text-[11px] font-mono tabular-nums text-slate-400">{u.phone}</div>}
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="relative inline-block">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleQuickRoleChange(u, e.target.value as UserItem["role"])
                          }
                          title="Click to change account role directly"
                          className={`text-[11px] font-bold uppercase py-1 pl-2.5 pr-6 rounded-lg border appearance-none transition-all cursor-pointer outline-none focus:ring-2 focus:ring-orange-500/20 shadow-2xs ${
                            u.role === "ADMIN"
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : (u.role as string) === "FOOD_COORDINATOR"
                              ? "bg-orange-100 text-orange-950 border-orange-300 hover:bg-orange-200/80"
                              : u.role === "COORDINATOR"
                              ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                              : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70"
                          }`}
                        >
                          <option value="COORDINATOR">Coordinator</option>
                          <option value="FOOD_COORDINATOR">Food Committee</option>
                          <option value="ADMIN">Admin</option>
                          <option value="STUDENT">Student</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500">
                          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-700 font-medium max-w-[200px] truncate">
                      {u.college || "Sacred Heart College"}
                    </td>

                    <td className="p-4">
                      {u._count.coordEvents > 0 ? (
                        <div>
                          <div className="font-bold text-slate-900 inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            {u._count.coordEvents} competition{u._count.coordEvents === 1 ? "" : "s"}
                          </div>
                          {u.assignedEvents && u.assignedEvents.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5 max-w-[280px]">
                              {u.assignedEvents.map((ev) => (
                                <span
                                  key={ev.id}
                                  className="text-[10.5px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-md shadow-2xs"
                                  title={ev.name}
                                >
                                  {ev.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {u._count.registrations > 0 && (
                            <div className="text-[11px] text-slate-400 mt-1">
                              +{u._count.registrations} registration(s)
                            </div>
                          )}
                        </div>
                      ) : u.role === "COORDINATOR" ? (
                        <div className="text-slate-400 text-xs italic">
                          0 competitions assigned
                        </div>
                      ) : (
                        <span className="text-slate-600">
                          {u._count.registrations} registration(s)
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          title={`Edit ${u.name}'s account details`}
                          className="tap-target px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        {session?.user?.id !== u.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            title={`Delete ${u.name}'s account`}
                            className="tap-target px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
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

        {/* Modal: Create Coordinator / Admin User */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
              <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Add Coordinator / Admin Account
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="tap-target text-slate-400 hover:text-slate-900 cursor-pointer p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Role *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as "COORDINATOR" | "FOOD_COORDINATOR" | "ADMIN")}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    >
                      <option value="COORDINATOR">Event Coordinator (Competitions & Attendance)</option>
                      <option value="FOOD_COORDINATOR">Food Committee Coordinator (Meal Distribution & Counters)</option>
                      <option value="ADMIN">System Administrator (Full Access)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prof. Ramesh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ramesh@shctpt.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 9840123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">College / Institution</label>
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-100 bg-slate-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="tap-target px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer rounded-xl hover:bg-slate-200/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="tap-target px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit User Account */}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
              <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div className="min-w-0 pr-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Edit User Account
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {editingUser.name} &bull; <span className="font-mono">{editingUser.email}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="tap-target text-slate-400 hover:text-slate-900 cursor-pointer p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                  {session?.user?.id === editingUser.id && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>You are editing your own account.</strong> Changing your role away from Admin will revoke your administrative privileges upon your next login.
                      </div>
                    </div>
                  )}

                  {editErrorMsg && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
                      {editErrorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Role *</label>
                    <select
                      value={editRole}
                      onChange={(e) =>
                        setEditRole(
                          e.target.value as "STUDENT" | "COORDINATOR" | "FOOD_COORDINATOR" | "ADMIN"
                        )
                      }
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                    >
                      <option value="COORDINATOR">Event Coordinator (Competitions & Attendance)</option>
                      <option value="FOOD_COORDINATOR">Food Committee (Meal Distribution & Counters)</option>
                      <option value="ADMIN">System Administrator (Full Access)</option>
                      <option value="STUDENT">Student (Delegate / Participant)</option>
                    </select>
                  </div>

                  {editRole === "COORDINATOR" && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-amber-950">
                          Assigned Competition(s) &bull; Coordinator Role
                        </label>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                          {editAssignedEventIds.length} selected
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800/90 leading-tight">
                        Check the competition(s) this coordinator manages. They will gain verification & attendance permissions for these events.
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 border border-amber-200/60 rounded-lg p-2 bg-white/60">
                        {availableEvents.length === 0 ? (
                          <div className="text-xs text-slate-400 py-2 text-center">No competitions available</div>
                        ) : (
                          availableEvents.map((ev) => {
                            const isChecked = editAssignedEventIds.includes(ev.id);
                            return (
                              <label
                                key={ev.id}
                                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                                  isChecked
                                    ? "bg-amber-100/60 border-amber-400 font-bold text-amber-950 shadow-2xs"
                                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setEditAssignedEventIds((prev) =>
                                        prev.includes(ev.id)
                                          ? prev.filter((x) => x !== ev.id)
                                          : [...prev, ev.id]
                                      );
                                    }}
                                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 accent-orange-600"
                                  />
                                  <span className="truncate">{ev.name}</span>
                                </div>
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0 ml-2">
                                  {ev.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 9840123456"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">College / Institution</label>
                    <input
                      type="text"
                      value={editCollege}
                      onChange={(e) => setEditCollege(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Reset Password</label>
                      <span className="text-[11px] text-slate-400 font-medium">Leave blank to keep current</span>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Enter new password (optional)"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full h-11 bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-100 bg-slate-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="tap-target px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer rounded-xl hover:bg-slate-200/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="tap-target px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {editSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
