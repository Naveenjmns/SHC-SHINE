"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
import { isValidPhone } from "@/lib/validators";
import ProfileDetailsCard from "./components/ProfileDetailsCard";
import ProfileSecurityCard from "./components/ProfileSecurityCard";
import ProfileRoleSummaryCard from "./components/ProfileRoleSummaryCard";
import Footer from "@/components/Footer";

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

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [foodPreference, setFoodPreference] = useState<"VEG" | "NON_VEG">("VEG");

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
      const data = await safeJson(res);
      if (data.success && data.user) {
        setProfile(data.user);
        setStats(data.roleStats || {});
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
        setCollege(data.user.college || "");
        setFoodPreference(data.user.foodPreference || "VEG");
      } else {
        toast.error(data.message || "Could not fetch profile.");
      }
    } catch {
      toast.error("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    if (phone.trim() && !isValidPhone(phone)) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          college: college.trim() || null,
          foodPreference,
        }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("Profile updated successfully.");
        fetchProfile();
      } else {
        toast.error(data.message || "Failed to update profile.");
      }
    } catch {
      toast.error("Network error while updating profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (currentPass: string, newPass: string): Promise<boolean> => {
    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("Password changed successfully.");
        return true;
      } else {
        toast.error(data.message || "Failed to change password.");
        return false;
      }
    } catch {
      toast.error("Error occurred while changing password.");
      return false;
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm font-medium text-ink-muted">
            Loading Account Profile...
          </p>
        </div>
      </div>
    );
  }

  const roleDashboardLink =
    profile?.role === "ADMIN"
      ? "/admin"
      : profile?.role === "COORDINATOR"
      ? "/coordinator"
      : profile?.role === "FOOD_COORDINATOR"
      ? "/food"
      : "/dashboard";

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <Link
            href={roleDashboardLink}
            className="text-xs font-semibold text-ink-muted hover:text-ink flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink">
              {profile?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-ink-muted hover:text-danger gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full flex-1 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">My Profile</h1>
          <p className="text-sm text-ink-muted">
            Manage your account details, meal preference, and password.
          </p>
        </div>

        {/* Role Summary */}
        {profile && (
          <ProfileRoleSummaryCard
            role={profile.role}
            stats={stats}
            name={profile.name}
          />
        )}

        {/* Profile Details Form */}
        {profile && (
          <ProfileDetailsCard
            name={name}
            setName={setName}
            email={profile.email}
            phone={phone}
            setPhone={setPhone}
            college={college}
            setCollege={setCollege}
            foodPreference={foodPreference}
            setFoodPreference={setFoodPreference}
            onSave={handleUpdateProfile}
            saving={saving}
          />
        )}

        {/* Account Security Form */}
        <ProfileSecurityCard
          onUpdatePassword={handleChangePassword}
          changing={changingPassword}
        />
      </main>

      <Footer />
    </div>
  );
}
