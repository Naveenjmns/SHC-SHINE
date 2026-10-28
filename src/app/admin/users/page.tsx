"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  ArrowLeft,
  Users,
  Shield,
  GraduationCap,
  Utensils,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
import AdminUsersTable, { UserItem } from "./components/AdminUsersTable";
import AdminUserModal, { FestEventOption } from "./components/AdminUserModal";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast, confirmAction } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [availableEvents, setAvailableEvents] = useState<FestEventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const loadUsers = async () => {
    setLoading(true);
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
    } catch (err: any) {
      toast.error(err.message || "Failed to load users directory.");
    } finally {
      setLoading(false);
    }
  };

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


  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.college && u.college.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q));
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  const handleSaveUser = async (payload: any) => {
    setSaving(true);
    try {
      const isEdit = Boolean(payload.id);
      const url = isEdit ? `/api/admin/users/${payload.id}` : "/api/admin/users";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);

      if (res.ok && data.success) {
        toast.success(isEdit ? "User updated successfully." : "User created successfully.");
        setModalOpen(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        toast.error(data.message || "Failed to save user.");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error saving user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    const confirmed = await confirmAction({
      title: "Delete User Account?",
      message: `Are you sure you want to permanently delete "${user.name}" (${user.email})?`,
      confirmText: "Delete Account",
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success(`User "${user.name}" removed.`);
        loadUsers();
      } else {
        toast.error(data.message || "Failed to delete user.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting user.");
    }
  };

  return (
    <main className="min-h-screen bg-canvas flex flex-col">
      {/* Sticky Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="font-semibold text-sm text-ink-muted hover:text-ink flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </Link>
            <span className="text-border">/</span>
            <span className="text-sm font-semibold text-ink">
              Users & Delegations ({users.length})
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedUser(null);
              setModalOpen(true);
            }}
            className="text-sm gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-[8px] overflow-x-auto">
            {[
              { id: "ALL", label: "All Roles" },
              { id: "STUDENT", label: "Students" },
              { id: "COORDINATOR", label: "Coordinators" },
              { id: "FOOD_COORDINATOR", label: "Food Desks" },
              { id: "ADMIN", label: "Admins" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-[8px] text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  roleFilter === tab.id
                    ? "bg-surface-raised text-accent"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by name, email, college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-[8px] border border-border bg-surface text-sm text-ink focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="py-20 text-center text-sm text-ink-muted flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            <span>Loading user accounts...</span>
          </div>
        ) : (
          <AdminUsersTable
            users={filteredUsers}
            currentUserId={session?.user?.id}
            onEdit={(user) => {
              setSelectedUser(user);
              setModalOpen(true);
            }}
            onDelete={handleDeleteUser}
          />
        )}
      </div>

      {/* Unified User Modal */}
      <AdminUserModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        availableEvents={availableEvents}
        onSave={handleSaveUser}
        saving={saving}
      />
    </main>
  );
}
