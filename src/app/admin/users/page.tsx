"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, History } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  role: "STUDENT" | "COORDINATOR" | "ADMIN";
  createdAt: string;
  _count: {
    registrations: number;
    coordEvents: number;
  };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast, confirmAction } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Create User Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("Sacred Heart College (Autonomous)");
  const [role, setRole] = useState<"COORDINATOR" | "ADMIN">("COORDINATOR");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
      const res = await fetch("/api/admin/users");
      const data = await safeJson(res, { success: false, users: [] });
      if (data.success && data.users) {
        setUsers(data.users);
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
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.college && u.college.toLowerCase().includes(search.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <main className="dash-layout flex flex-col min-h-screen">
      {/* Light Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="container-wide py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/admin" className="hover:text-slate-900">
              Admin Master Control
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">User Accounts</span>
          </div>

          <div className="flex items-center gap-3">
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
              placeholder="Search user name, email, or institution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 bg-white border border-slate-300 rounded-xl px-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shrink-0 self-start sm:self-auto">
            {["ALL", "COORDINATOR", "ADMIN", "STUDENT"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`tap-target px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === r
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r === "ALL" ? "All Users" : r}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="dash-card overflow-hidden">
          <div className="overflow-x-auto">
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
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                      {u.phone && <div className="text-[11px] font-mono tabular-nums text-slate-400">{u.phone}</div>}
                    </td>

                    <td className="p-4">
                      {u.role === "ADMIN" ? (
                        <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Admin
                        </span>
                      ) : u.role === "COORDINATOR" ? (
                        <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Coordinator
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          Student
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-700 font-medium max-w-[200px] truncate">
                      {u.college || "Sacred Heart College"}
                    </td>

                    <td className="p-4">
                      {u.role === "COORDINATOR" ? (
                        <span className="font-bold text-slate-900">
                          {u._count.coordEvents} competition(s)
                        </span>
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
                      {session?.user?.id !== u.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="tap-target px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create Coordinator / Admin User */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Add Coordinator / Admin Account
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="tap-target text-slate-400 hover:text-slate-900 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl mb-4">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "COORDINATOR" | "ADMIN")}
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="COORDINATOR">Event Coordinator</option>
                    <option value="ADMIN">System Administrator</option>
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

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="tap-target px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="tap-target px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        SHINE 26 • Sacred Heart College (Autonomous), Tirupattur
      </footer>
    </main>
  );
}
