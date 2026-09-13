"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import { useToast } from "@/components/ToastProvider";
import {
  User as UserIcon,
  Shield,
  KeyRound,
  GraduationCap,
  Phone,
  Mail,
  Utensils,
  Award,
  Calendar,
  Layers,
  ArrowRight,
  LogOut,
  Sparkles,
  QrCode,
  Ticket,
  ChevronRight,
  RefreshCw,
  Clock,
  Building,
  Users,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { isValidPhone } from "@/lib/validators";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  role: "STUDENT" | "COORDINATOR" | "ADMIN" | "FOOD_COORDINATOR";
  foodPreference: "VEG" | "NON_VEG" | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RoleStats {
  // Student
  totalRegistrations?: number;
  confirmedCount?: number;
  attendedCount?: number;
  wonAwards?: Array<{ event: string; result: string }>;
  badgeCode?: string | null;
  foodTokenCode?: string | null;
  foodTokenClaimed?: boolean;
  eventCheckedIn?: boolean;
  contingentName?: string | null;
  collegeName?: string | null;

  // Coordinator
  assignedEventsCount?: number;
  totalParticipants?: number;
  checkedInCount?: number;
  events?: Array<{
    id: string;
    name: string;
    category: string;
    venue: string | null;
    dateTime: string;
    participantCount: number;
    checkedInCount: number;
  }>;

  // Food Coordinator
  totalEligible?: number;
  totalClaimed?: number;
  totalRemaining?: number;
  claimRate?: number;
  vegClaimed?: number;
  nonVegClaimed?: number;

  // Admin
  totalUsers?: number;
  totalEvents?: number;
  totalDelegations?: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<RoleStats | null>(null);

  // Edit form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [foodPreference, setFoodPreference] = useState<"VEG" | "NON_VEG">("VEG");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.success && data.user) {
        setProfile(data.user);
        setStats(data.roleStats || {});
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
        setCollege(data.user.college || "");
        setFoodPreference(data.user.foodPreference || "VEG");
      } else {
        toast.error(data.message || "Could not fetch profile.", "Error");
      }
    } catch {
      toast.error("Failed to connect to the server.", "Connection Error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim() && !isValidPhone(phone)) {
      toast.warning("Please provide a valid 10-digit mobile number.", "Validation Error");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          college,
          foodPreference: profile?.role === "STUDENT" ? foodPreference : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Your details have been successfully saved.", "Profile Updated");
        setProfile(data.user);
      } else {
        toast.error(data.message || "Could not update profile.", "Update Failed");
      }
    } catch {
      toast.error("Failed to send update request.", "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.warning("New password must be at least 6 characters long.", "Validation Error");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning("New passwords do not match.", "Validation Error");
      return;
    }

    try {
      setChangingPassword(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Your password has been changed successfully.", "Password Changed");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message || "Failed to update password.", "Password Change Failed");
      }
    } catch {
      toast.error("Could not change password.", "Error");
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return {
          title: "SYSTEM ADMINISTRATOR",
          color: "bg-purple-100 text-purple-800 border-purple-300",
          portal: "/admin",
          portalLabel: "Admin Master Console",
        };
      case "COORDINATOR":
        return {
          title: "EVENT COORDINATOR",
          color: "bg-amber-100 text-amber-800 border-amber-300",
          portal: "/coordinator",
          portalLabel: "Coordinator Console",
        };
      case "FOOD_COORDINATOR":
        return {
          title: "FOOD & HOSPITALITY COMMITTEE",
          color: "bg-emerald-100 text-emerald-800 border-emerald-300",
          portal: "/food",
          portalLabel: "Food Committee Portal",
        };
      case "STUDENT":
      default:
        return {
          title: "STUDENT DELEGATE",
          color: "bg-blue-100 text-blue-800 border-blue-300",
          portal: "/dashboard",
          portalLabel: "Student Dashboard",
        };
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-[var(--dash-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[var(--fest-ember)] animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const roleMeta = getRoleBadge(profile.role);

  return (
    <div className="min-h-screen bg-[var(--dash-bg)] text-[var(--dash-ink)] flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[var(--dash-border)] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={roleMeta.portal}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[var(--fest-ember)] transition-colors"
            >
              <span>← Back to {roleMeta.portalLabel}</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={roleMeta.portal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <span>Launch Portal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Profile Header Hero Card */}
        <div className="bg-white rounded-2xl border border-[var(--dash-border)] shadow-xs p-6 sm:p-8 mb-8 relative overflow-hidden">
          {/* Subtle background fest accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/40 via-amber-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar circle */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--fest-ember)] to-[var(--fest-gold)] text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    {profile.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-wide uppercase ${roleMeta.color}`}
                  >
                    <Shield className="w-3 h-3" />
                    {roleMeta.title}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {profile.email}
                  </span>
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {profile.phone}
                    </span>
                  )}
                  {profile.college && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {profile.college}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href={roleMeta.portal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-[var(--fest-ember)] to-[var(--fest-ember-dark)] text-white shadow-md shadow-orange-500/20 hover:shadow-lg transition-all"
              >
                <span>Go to {roleMeta.portalLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Role-Specific Highlights & Operational Metrics */}
        {profile.role === "STUDENT" && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Registered Events</span>
                <Calendar className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.totalRegistrations || 0}</p>
              <p className="text-xs text-slate-400 mt-1">
                {stats.confirmedCount || 0} Confirmed, {(stats.totalRegistrations || 0) - (stats.confirmedCount || 0)} Pending
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Pass Status</span>
                <QrCode className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xl font-bold text-slate-900 font-mono">
                {stats.badgeCode || "Pending"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {stats.eventCheckedIn ? "Checked In at Desk" : "Ready for Gate Scan"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Food Token</span>
                <Utensils className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-slate-900 font-mono">
                {stats.foodTokenCode || "Pending"}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    stats.foodTokenClaimed ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span className="text-xs text-slate-500">
                  {stats.foodTokenClaimed ? "Meal Claimed" : "Unclaimed (Valid at Counter)"}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Awards & Podium</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">
                {stats.wonAwards?.length || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {stats.wonAwards && stats.wonAwards.length > 0
                  ? `${stats.wonAwards[0].event}: ${stats.wonAwards[0].result}`
                  : "Standings publish live"}
              </p>
            </div>
          </div>
        )}

        {profile.role === "COORDINATOR" && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Managed Competitions</span>
                <Layers className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.assignedEventsCount || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Assigned under your faculty / student lead</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Registered Candidates</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.totalParticipants || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Across all assigned event sessions</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Checked In Participants</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.checkedInCount || 0}</p>
              <p className="text-xs text-slate-400 mt-1">
                {stats.totalParticipants && stats.totalParticipants > 0
                  ? `${Math.round(((stats.checkedInCount || 0) / stats.totalParticipants) * 100)}% attendance verified`
                  : "Ready for live desk check-in"}
              </p>
            </div>
          </div>
        )}

        {profile.role === "FOOD_COORDINATOR" && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Eligible Delegates</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.totalEligible || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Registered participants with meal pass</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Claimed Meals</span>
                <Utensils className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.totalClaimed || 0}</p>
              <p className="text-xs text-slate-400 mt-1">{stats.claimRate || 0}% overall redemption</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Veg Meals Claimed</span>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.vegClaimed || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Vegetarian meal redemptions</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Non-Veg Meals Claimed</span>
                <Utensils className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.nonVegClaimed || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Non-veg meal redemptions</p>
            </div>
          </div>
        )}

        {profile.role === "ADMIN" && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">System Users</span>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.totalUsers || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Students, coordinators, & staff</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Competitions</span>
                <Layers className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.totalEvents || 0}</p>
              <p className="text-xs text-slate-400 mt-1">On-stage and off-stage events</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Registrations</span>
                <Calendar className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.totalRegistrations || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Individual event registrations</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[var(--dash-border)] shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">College Delegations</span>
                <Building className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.totalDelegations || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Participating institution contingents</p>
            </div>
          </div>
        )}

        {/* Edit Details & Security Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Personal Information Editor (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--dash-border)] shadow-xs p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--dash-border)]">
              <UserIcon className="w-5 h-5 text-[var(--fest-ember)]" />
              <h2 className="text-lg font-bold text-slate-900">Personal & Academic Details</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--fest-ember)] focus:border-transparent bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Official identification email cannot be modified.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Mobile / Phone Number
                    </label>
                    {phone.trim() && (
                      <span className="text-[11px] font-semibold">
                        {isValidPhone(phone) ? (
                          <span className="text-emerald-600">✓ Valid Mobile</span>
                        ) : (
                          <span className="text-rose-500">10-digit number required</span>
                        )}
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 bg-slate-50/50 font-mono transition-colors ${
                      phone.trim() && !isValidPhone(phone)
                        ? "border-rose-300 focus:ring-rose-400"
                        : "border-[var(--dash-border)] focus:ring-[var(--fest-ember)] focus:border-transparent"
                    }`}
                  />
                  {phone.trim() && !isValidPhone(phone) && (
                    <p className="text-[11px] text-rose-500 mt-1">
                      Must be a valid 10-digit mobile number (e.g. 9876543210 or +91 9876543210).
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    College / Department
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Sacred Heart College (Autonomous)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--fest-ember)] focus:border-transparent bg-slate-50/50"
                  />
                </div>
              </div>

              {profile.role === "STUDENT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Symposium Food Preference
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="foodPref"
                        value="VEG"
                        checked={foodPreference === "VEG"}
                        onChange={() => setFoodPreference("VEG")}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">Vegetarian Meal</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="foodPref"
                        value="NON_VEG"
                        checked={foodPreference === "NON_VEG"}
                        onChange={() => setFoodPreference("NON_VEG")}
                        className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">Non-Vegetarian Meal</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[var(--fest-ember)] text-white hover:bg-[var(--fest-ember-dark)] shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Profile Information</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Security & Password Management (1 col) */}
          <div className="bg-white rounded-2xl border border-[var(--dash-border)] shadow-xs p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--dash-border)]">
                <Lock className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-900">Security & Password</h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50/50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {profile.role === "STUDENT" ? "Default password is your registered Mobile Number." : "Required to verify identity."}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50/50"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {changingPassword ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-8 pt-4 border-t border-[var(--dash-border)] text-xs text-slate-400">
              <p>Account ID: <span className="font-mono text-slate-500">{profile.id}</span></p>
              <p className="mt-1">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
