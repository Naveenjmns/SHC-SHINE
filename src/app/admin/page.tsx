"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
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
  Mail,
  Send,
  Server,
  RefreshCw,
  AlertCircle,
  Building2,
  Phone,
  Globe,
  History,
  Lock,
  Unlock,
  QrCode,
  Utensils,
  ReceiptIndianRupee,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import CheckInModal from "@/components/CheckInModal";

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
  attended?: boolean;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
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
  delegation?: {
    id: string;
    collegeName: string;
    teamName: string | null;
    teamLeadName: string;
    staffInchargeName: string | null;
    paymentStatus?: string;
    totalFee?: number;
  } | null;
  delegationMember?: {
    id: string;
    badgeCode: string;
    foodTokenCode: string;
    eventCheckedIn?: boolean;
    eventCheckedInAt?: string | null;
    foodTokenClaimed?: boolean;
    foodClaimedAt?: string | null;
  } | null;
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

  // Reusable Institution & Department Details
  institutionShortName?: string | null;
  institutionLocation?: string | null;
  institutionAbout?: string | null;
  departmentAbout?: string | null;
  departmentProgram?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  websiteUrl?: string | null;
  participantFee?: number;
  isRegistrationOpen?: boolean;
  registrationClosedNotice?: string | null;

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

function formatTime12h(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let hours = parseInt(hStr, 10);
  const minutes = mStr || "00";
  if (isNaN(hours)) return time24;

  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const formattedHours = String(hours).padStart(2, "0");
  return `${formattedHours}:${minutes} ${period}`;
}

function buildTimeRangeString(startTime24: string, endTime24?: string): string {
  if (!startTime24) return "";
  const startFormatted = formatTime12h(startTime24);
  if (!endTime24) return startFormatted;
  const endFormatted = formatTime12h(endTime24);
  return `${startFormatted} - ${endFormatted}`;
}

export default function AdminOverviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast, confirmAction } = useToast();

  const [activeTab, setActiveTab] = useState<
    "overview" | "institution" | "editions" | "branding" | "smtp" | "registrations"
  >("overview");

  const [stats, setStats] = useState<StatsData | null>(null);
  const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [editions, setEditions] = useState<EventEditionItem[]>([]);
  const [activeEdition, setActiveEdition] = useState<EventEditionItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [regViewMode, setRegViewMode] = useState<"COLLEGE" | "FLAT">("COLLEGE");
  const [expandedColleges, setExpandedColleges] = useState<Record<string, boolean>>({});

  // New Edition Modal Form State
  const [showNewEditionModal, setShowNewEditionModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
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

    // Reusable Institution & Department Setup Fields
    institutionShortName: "SHC",
    institutionLocation: "Tirupattur — 635 601, Tamil Nadu",
    institutionAbout: "Premier institution recognized with NAAC accreditation, providing world-class infrastructure, research excellence, and academic distinction.",
    departmentAbout: "Nurturing top-tier engineers, developers, and technical leaders through state-of-the-art labs, hands-on curricula, and hackathons.",
    departmentProgram: "MCA Program",
    contactEmail: "shine@shctpt.edu",
    contactPhone: "+91 4175 240464",
    websiteUrl: "",
    participantFee: 0,
    isRegistrationOpen: true,
    registrationClosedNotice: "Registrations for this edition are currently closed. Please contact the event coordinators for queries.",
  });

  // SMTP Settings State
  const [smtpForm, setSmtpForm] = useState({
    host: "",
    port: 587,
    secure: false,
    user: "",
    password: "",
    hasPassword: false,
    fromEmail: "",
    fromName: "Event Coordination Team",
    replyTo: "",
  });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Email Broadcast State
  const [broadcastForm, setBroadcastForm] = useState({
    targetAudience: "ALL",
    targetEventId: "",
    subject: "",
    message: "",
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

  // Navigation Items State
  const [newNavLabel, setNewNavLabel] = useState("");
  const [newNavUrl, setNewNavUrl] = useState("");

  // Schedule Items State
  const [newScheduleStartTime, setNewScheduleStartTime] = useState("09:30");
  const [newScheduleEndTime, setNewScheduleEndTime] = useState("10:30");
  const [useCustomScheduleTime, setUseCustomScheduleTime] = useState(false);
  const [customScheduleTimeText, setCustomScheduleTimeText] = useState("");
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
      const statsData = await safeJson(statsRes, { success: false, stats: null, eventBreakdown: [] });
      if (statsData.success) {
        setStats(statsData.stats);
        setEventBreakdown(statsData.eventBreakdown || []);
      }

      // 2. Load Registrations
      const regRes = await fetch("/api/admin/registrations");
      const regData = await safeJson(regRes, { success: false, registrations: [] });
      if (regData.success) {
        setRegistrations(regData.registrations || []);
      }

      // 3. Load Event Editions
      const edRes = await fetch("/api/admin/edition");
      const edData = await safeJson(edRes, { success: false, editions: [] });
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

            institutionShortName: currentActive.institutionShortName || "SHC",
            institutionLocation: currentActive.institutionLocation || "Tirupattur — 635 601, Tamil Nadu",
            institutionAbout: currentActive.institutionAbout || "Premier institution recognized with NAAC accreditation, providing world-class infrastructure, research excellence, and academic distinction.",
            departmentAbout: currentActive.departmentAbout || "Nurturing top-tier engineers, developers, and technical leaders through state-of-the-art labs, hands-on curricula, and hackathons.",
            departmentProgram: currentActive.departmentProgram || "MCA Program",
            contactEmail: currentActive.contactEmail || "shine@shctpt.edu",
            contactPhone: currentActive.contactPhone || "+91 4175 240464",
            websiteUrl: currentActive.websiteUrl || "",
            participantFee: currentActive.participantFee || 0,
            isRegistrationOpen: currentActive.isRegistrationOpen ?? true,
            registrationClosedNotice:
              currentActive.registrationClosedNotice ||
              "Registrations for this edition are currently closed. Please contact the event coordinators for queries.",
          });
        }
      }

      // 4. Load SMTP settings
      try {
        const smtpRes = await fetch("/api/admin/smtp");
        const smtpData = await safeJson(smtpRes, { success: false, smtp: null });
        if (smtpData.success && smtpData.smtp) {
          setSmtpForm((prev) => ({
            ...prev,
            host: smtpData.smtp.host || "",
            port: smtpData.smtp.port || 587,
            secure: !!smtpData.smtp.secure,
            user: smtpData.smtp.user || "",
            hasPassword: !!smtpData.smtp.hasPassword,
            fromEmail: smtpData.smtp.fromEmail || "",
            fromName: smtpData.smtp.fromName || "Event Coordination Team",
            replyTo: smtpData.smtp.replyTo || "",
          }));
        }
      } catch (err) {
        console.error("Failed to load SMTP settings:", err);
      }

      // 5. Load Email Broadcast History
      try {
        const historyRes = await fetch("/api/admin/email/history");
        const historyData = await safeJson(historyRes, { success: false, broadcasts: [] });
        if (historyData.success && historyData.broadcasts) {
          setBroadcastHistory(historyData.broadcasts);
        }
      } catch (err) {
        console.error("Failed to load broadcast history:", err);
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
      const data = await safeJson(res, { success: false, error: "Server error occurred." });
      if (data.success) {
        setShowNewEditionModal(false);
        toast.success("New event edition created successfully!");
        await loadAdminData();
      } else {
        toast.error("Failed to create edition: " + data.error);
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
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
      const data = await safeJson(res, { success: false });
      if (data.success) {
        toast.success("Active edition updated successfully!");
        await loadAdminData();
      }
    } catch (err: any) {
      toast.error("Error setting active edition: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async (e?: React.SyntheticEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (!activeEdition) return;
    setSaving(true);
    try {
      const startDateIso = brandingForm.startDate
        ? new Date(brandingForm.startDate).toISOString()
        : null;

      const res = await fetch("/api/admin/edition", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeEdition.id,
          ...brandingForm,
          startDate: startDateIso,
        }),
      });
      const data = await safeJson(res, { success: false, error: "Server error" });
      if (data.success) {
        toast.success("Settings saved successfully!");
        await loadAdminData();
      } else {
        toast.error("Failed to save settings: " + data.error);
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRegistration = async (targetState?: boolean) => {
    if (!activeEdition) return;
    const currentState = activeEdition.isRegistrationOpen ?? true;
    const nextState = typeof targetState === "boolean" ? targetState : !currentState;
    const actionLabel = nextState ? "Open" : "Close";

    const ok = await confirmAction({
      title: `${actionLabel} Registrations?`,
      message: nextState
        ? "Opening registrations will allow delegates and college teams to register on /register."
        : "Closing registrations will immediately lock the public registration gateway and prevent new team registrations.",
      confirmText: nextState ? "Yes, Open Registrations" : "Yes, Close Registrations",
      isDestructive: !nextState,
    });
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/edition", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeEdition.id,
          isRegistrationOpen: nextState,
        }),
      });
      const data = await safeJson(res, { success: false, error: "Server error" });
      if (data.success) {
        toast.success(
          nextState
            ? "Public registrations are now OPEN!"
            : "Public registrations are now CLOSED."
        );
        setBrandingForm((prev) => ({ ...prev, isRegistrationOpen: nextState }));
        await loadAdminData();
      } else {
        toast.error("Failed to update registration status: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpForm),
      });
      const data = await safeJson(res, { success: false });
      if (data.success) {
        toast.success("SMTP configuration saved successfully!");
        if (data.smtp) {
          setSmtpForm((prev) => ({
            ...prev,
            host: data.smtp.host,
            port: data.smtp.port,
            secure: data.smtp.secure,
            user: data.smtp.user,
            hasPassword: data.smtp.hasPassword,
            fromEmail: data.smtp.fromEmail,
            fromName: data.smtp.fromName,
            replyTo: data.smtp.replyTo,
            password: "",
          }));
        }
      } else {
        toast.error("Failed to save SMTP settings: " + data.error);
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testEmailAddress) {
      toast.warning("Please enter an email address to send the test email to.");
      return;
    }
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch("/api/admin/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail: testEmailAddress }),
      });
      const data = await safeJson(res, { success: false, message: "Server connection failed" });
      setSmtpTestResult({
        success: data.success,
        message: data.message || data.error,
      });
      if (data.success) {
        toast.success("SMTP test email sent successfully!");
      } else {
        toast.error(data.message || "Failed to connect to SMTP server");
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message,
      });
      toast.error(err.message, "SMTP Error");
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.subject.trim() || !broadcastForm.message.trim()) {
      toast.warning("Please enter both Subject and Message body.");
      return;
    }

    const confirmSend = await confirmAction({
      title: "Dispatch Announcement Email?",
      message: "Are you sure you want to dispatch this email announcement to registered students?",
      confirmText: "Send Broadcast",
    });
    if (!confirmSend) return;

    setSendingBroadcast(true);
    try {
      const res = await fetch("/api/admin/email/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastForm),
      });
      const data = await safeJson(res, { success: false, error: "Network error" });
      if (data.success) {
        toast.success(data.message || "Announcement dispatched successfully!");
        setBroadcastForm({
          targetAudience: "ALL",
          targetEventId: "",
          subject: "",
          message: "",
        });
        const hRes = await fetch("/api/admin/email/history");
        const hData = await safeJson(hRes, { success: false, broadcasts: [] });
        if (hData.success && hData.broadcasts) {
          setBroadcastHistory(hData.broadcasts);
        }
      } else {
        toast.error("Failed to send broadcast: " + data.error);
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSendingBroadcast(false);
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
      const data = await safeJson(res, { success: false, error: "Upload failed" });
      if (data.success) {
        setBrandingForm((prev) => ({ ...prev, [targetField]: data.url }));
        toast.success("File uploaded successfully!");
      } else {
        toast.error("File upload failed: " + data.error);
      }
    } catch (err: any) {
      toast.error("Upload error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNavItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEdition || !newNavLabel.trim() || !newNavUrl.trim()) {
      toast.warning("Please enter both Label and URL for the navigation item.");
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
      const data = await safeJson(res, { success: false, error: "Network error" });
      if (data.success) {
        setNewNavLabel("");
        setNewNavUrl("");
        toast.success("Navigation item added successfully!");
        await loadAdminData();
      } else {
        toast.error("Failed to add navigation item: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Add nav item error:", err);
      toast.error("Error adding navigation item: " + err.message);
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
    const ok = await confirmAction({
      title: "Delete Navigation Item",
      message: "Are you sure you want to remove this navigation link?",
      confirmText: "Delete Link",
      isDestructive: true,
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/navigation?id=${itemId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Navigation item removed.");
        await loadAdminData();
      }
    } catch (err) {
      console.error("Delete nav item error:", err);
      toast.error("Failed to delete navigation item.");
    }
  };

  const handleAddScheduleItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEdition) {
      toast.error("No active edition selected.");
      return;
    }

    const timeString = useCustomScheduleTime
      ? customScheduleTimeText.trim()
      : buildTimeRangeString(newScheduleStartTime, newScheduleEndTime);

    if (!timeString || !newScheduleTitle) {
      toast.error("Please specify start time and title.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editionId: activeEdition.id,
          time: timeString,
          title: newScheduleTitle,
          venue: newScheduleVenue || null,
          description: newScheduleDescription || null,
          tag: newScheduleTag || null,
        }),
      });
      const data = await safeJson(res, { success: false, error: "Network error" });
      if (data.success) {
        setNewScheduleTitle("");
        setNewScheduleVenue("");
        setNewScheduleDescription("");
        setNewScheduleTag("");
        setCustomScheduleTimeText("");
        toast.success("Schedule entry added and aligned on timeline!");
        await loadAdminData();
      } else {
        toast.error("Failed to add schedule item: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Add schedule item error:", err);
      toast.error("Error adding schedule item: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScheduleItem = async (itemId: string) => {
    const ok = await confirmAction({
      title: "Delete Schedule Item",
      message: "Are you sure you want to delete this schedule entry?",
      confirmText: "Delete Entry",
      isDestructive: true,
    });
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/schedule?id=${itemId}`, { method: "DELETE" });
      const data = await safeJson(res, { success: false, error: "Network error" });
      if (data.success) {
        toast.success("Schedule entry deleted.");
        await loadAdminData();
      } else {
        toast.error("Failed to delete schedule item: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Delete schedule item error:", err);
      toast.error("Error deleting item: " + err.message);
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

  const collectPaymentAndApproveDelegation = async (delegationId: string, teamLeadName: string, totalFee?: number) => {
    if (!confirm(`Collect spot registration fee of ₹${totalFee || 0} for ${teamLeadName}'s team and activate official passes?\n\nThis will mark payment as PAID, confirm all team member registrations, and send official passes (2 QR badges) to each student and a full dossier to the team lead.`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delegationId, action: "COLLECT_PAYMENT_APPROVE_DELEGATION" }),
      });
      const data = await safeJson(res, { success: false, message: "Payment approval failed" });
      if (data.success) {
        toast.success(`Fee collected & official passes dispatched for ${teamLeadName}'s team!`);
        await loadAdminData();
      } else {
        toast.error(data.message || "Failed to approve delegation payment.");
      }
    } catch (err) {
      console.error("Failed to collect payment:", err);
      toast.error("Network error while approving delegation payment.");
    }
  };

  const approveEntireCollege = async (collegeGroup: { key: string; collegeName: string; delegationId?: string; uniqueStudentsCount: number }) => {
    const ok = await confirmAction({
      title: `Approve All Participants from ${collegeGroup.collegeName}?`,
      message: `This will approve all event registrations and activate official passes for all ${collegeGroup.uniqueStudentsCount} participant(s) from ${collegeGroup.collegeName}.`,
      confirmText: "Yes, Approve College",
    });
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delegationId: collegeGroup.delegationId,
          collegeName: collegeGroup.collegeName,
          action: "APPROVE_COLLEGE",
        }),
      });
      const data = await safeJson(res, { success: false, message: "Approval failed" });
      if (data.success) {
        toast.success(`All participants from ${collegeGroup.collegeName} APPROVED! Passes activated.`);
        await loadAdminData();
      } else {
        toast.error(data.message || "Failed to approve college.");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const rejectEntireCollege = async (collegeGroup: { key: string; collegeName: string; delegationId?: string; uniqueStudentsCount: number }) => {
    const ok = await confirmAction({
      title: `Reject Registrations for ${collegeGroup.collegeName}?`,
      message: `Are you sure you want to reject all registrations for ${collegeGroup.collegeName}?`,
      confirmText: "Reject All",
      isDestructive: true,
    });
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delegationId: collegeGroup.delegationId,
          collegeName: collegeGroup.collegeName,
          action: "REJECT_COLLEGE",
        }),
      });
      const data = await safeJson(res, { success: false, message: "Rejection failed" });
      if (data.success) {
        toast.success(`Registrations for ${collegeGroup.collegeName} REJECTED.`);
        await loadAdminData();
      } else {
        toast.error(data.message || "Failed to reject college registrations.");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredRegistrations = (registrations || []).filter((r) => {
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const s = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !s ||
      r.user.name.toLowerCase().includes(s) ||
      r.user.email.toLowerCase().includes(s) ||
      (r.user.college && r.user.college.toLowerCase().includes(s)) ||
      (r.delegation?.collegeName && r.delegation.collegeName.toLowerCase().includes(s)) ||
      r.event.name.toLowerCase().includes(s);
    return matchesStatus && matchesSearch;
  });

  const collegeGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        collegeName: string;
        delegationId?: string;
        teamName?: string | null;
        teamLeadName?: string | null;
        teamLeadPhone?: string | null;
        staffInchargeName?: string | null;
        paymentStatus?: string;
        totalFee: number;
        registrations: RegistrationRecord[];
        uniqueStudentsCount: number;
        pendingCount: number;
        confirmedCount: number;
        rejectedCount: number;
      }
    >();

    for (const reg of filteredRegistrations) {
      const colName = reg.delegation?.collegeName || reg.user.college || "Individual / Direct Registrations";
      const key = reg.delegation?.id ? `del_${reg.delegation.id}` : `col_${colName.toLowerCase().trim()}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          collegeName: colName,
          delegationId: reg.delegation?.id,
          teamName: reg.delegation?.teamName,
          teamLeadName: reg.delegation?.teamLeadName || reg.user.name,
          teamLeadPhone: reg.user.phone,
          staffInchargeName: reg.delegation?.staffInchargeName,
          paymentStatus: reg.delegation?.paymentStatus || "PENDING",
          totalFee: reg.delegation?.totalFee || 0,
          registrations: [],
          uniqueStudentsCount: 0,
          pendingCount: 0,
          confirmedCount: 0,
          rejectedCount: 0,
        });
      }

      const group = map.get(key)!;
      group.registrations.push(reg);
      if (reg.status === "CONFIRMED") group.confirmedCount++;
      else if (reg.status === "REJECTED") group.rejectedCount++;
      else group.pendingCount++;
    }

    for (const group of map.values()) {
      const studentEmails = new Set(group.registrations.map((r) => r.user.email));
      group.uniqueStudentsCount = studentEmails.size;
    }

    return Array.from(map.values());
  }, [filteredRegistrations]);

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

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Registration Status Toggle Button */}
            {activeEdition && (
              <button
                type="button"
                onClick={() => handleToggleRegistration()}
                disabled={saving}
                title={
                  activeEdition.isRegistrationOpen ?? true
                    ? "Click to Freeze & Close Public Registrations"
                    : "Click to Re-Open Public Registrations"
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  activeEdition.isRegistrationOpen ?? true
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300"
                    : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeEdition.isRegistrationOpen ?? true
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-rose-500"
                  }`}
                />
                <span className="hidden sm:inline">
                  {activeEdition.isRegistrationOpen ?? true
                    ? "Registration: OPEN"
                    : "Registration: CLOSED"}
                </span>
                <span className="sm:hidden">
                  {activeEdition.isRegistrationOpen ?? true ? "OPEN" : "CLOSED"}
                </span>
                {activeEdition.isRegistrationOpen ?? true ? (
                  <Lock className="w-3.5 h-3.5 opacity-70" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 opacity-70" />
                )}
              </button>
            )}

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
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar scrollbar-none">
            <button
              onClick={() => setActiveTab("overview")}
              className={`tap-target px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
                activeTab === "overview"
                  ? "bg-[#0F172A] text-white shadow-md"
                  : "bg-white text-[#64748B] hover:text-[#0F172A] border border-stone-200"
              }`}
            >
              Analytics Overview
            </button>

            <button
              onClick={() => setActiveTab("institution")}
              className={`tap-target px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === "institution"
                  ? "bg-[#0F172A] text-white shadow-md"
                  : "bg-white text-[#64748B] hover:text-[#0F172A] border border-stone-200"
              }`}
            >
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Institution & Dept</span>
            </button>

            <button
              onClick={() => setActiveTab("editions")}
              className={`tap-target px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shrink-0 ${
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
              className={`tap-target px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === "branding"
                  ? "bg-[#0F172A] text-white shadow-md"
                  : "bg-white text-[#64748B] hover:text-[#0F172A] border border-stone-200"
              }`}
            >
              <Palette className="w-4 h-4 text-[#FF6B1A]" />
              <span>Branding & Stage</span>
            </button>

            <button
              onClick={() => setActiveTab("smtp")}
              className={`tap-target px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === "smtp"
                  ? "bg-[#0F172A] text-white shadow-md"
                  : "bg-white text-[#64748B] hover:text-[#0F172A] border border-stone-200"
              }`}
            >
              <Mail className="w-4 h-4 text-sky-600" />
              <span>SMTP & Email Updates</span>
            </button>

            <button
              onClick={() => setActiveTab("registrations")}
              className={`tap-target px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shrink-0 ${
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
              href="/admin/logs"
              className="px-3.5 py-2 bg-white border border-[#CBD5E1] text-[#0F172A] font-semibold text-xs rounded-xl hover:bg-stone-50 transition flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-orange-600" />
              <span>Activity Logs →</span>
            </Link>
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
            {/* Registration Gateway Controller Banner */}
            <div
              className={`dash-card p-5 sm:p-6 border-l-4 transition-all duration-300 ${
                activeEdition?.isRegistrationOpen ?? true
                  ? "border-emerald-500 bg-gradient-to-r from-emerald-50/60 via-white to-white"
                  : "border-rose-500 bg-gradient-to-r from-rose-50/60 via-white to-white"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        activeEdition?.isRegistrationOpen ?? true
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          activeEdition?.isRegistrationOpen ?? true
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-rose-500"
                        }`}
                      />
                      {activeEdition?.isRegistrationOpen ?? true
                        ? "REGISTRATION IS OPEN"
                        : "REGISTRATION IS CLOSED"}
                    </span>

                    <span className="text-xs text-[#64748B] font-mono bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                      Active: {activeEdition ? `${activeEdition.name} ${activeEdition.edition}` : "Fest Edition"}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
                    {activeEdition?.isRegistrationOpen ?? true
                      ? "Public Registration Gateway is Active"
                      : "Public Registration Gateway is Frozen"}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] max-w-2xl leading-relaxed">
                    {activeEdition?.isRegistrationOpen ?? true
                      ? "External college contingents, team leads, and student delegates can register and obtain QR ID passes online at /register."
                      : "The public registration portal is frozen. No new delegates or college delegations can be submitted. Existing passes and coordinator verification continue to work."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleRegistration()}
                    disabled={saving}
                    className={`tap-target px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                      activeEdition?.isRegistrationOpen ?? true
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {activeEdition?.isRegistrationOpen ?? true ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Close Registrations Now</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span>Re-Open Registrations Now</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/register"
                    target="_blank"
                    className="tap-target px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#0F172A] bg-white border border-[#CBD5E1] hover:bg-stone-50 transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View /register</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowCheckInModal(true)}
                    className="tap-target px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR Check-In Hub</span>
                  </button>
                </div>
              </div>
            </div>

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

        {/* TAB: INSTITUTION & DEPARTMENT SETUP */}
        {activeTab === "institution" && activeEdition && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-emerald-600" />
                  <span>Institution & Department Setup</span>
                </h3>
                <p className="text-xs text-[#64748B]">
                  Customize the hosting institution and department profile. These settings reflect dynamically across the Landing Page, Header Banner, Navbar, and Footer.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveBranding}
                disabled={saving}
                className="btn-ember !py-2 !px-5 text-xs font-bold shrink-0 flex items-center gap-2 self-start sm:self-auto"
              >
                {saving ? "Saving Changes..." : "Save Institution & Dept Profile"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Columns: Forms */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Institution Identity Card */}
                <div className="dash-card p-6 space-y-5 border-l-4 border-emerald-500">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>1. Institution Identity & Accreditations</span>
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      College Profile
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">
                      Full Institution Name *
                    </label>
                    <input
                      type="text"
                      value={brandingForm.institutionName}
                      onChange={(e) => setBrandingForm({ ...brandingForm, institutionName: e.target.value })}
                      placeholder="e.g. Sacred Heart College (Autonomous), Tirupattur"
                      className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">
                        Short Name / Acronym
                      </label>
                      <input
                        type="text"
                        value={brandingForm.institutionShortName}
                        onChange={(e) => setBrandingForm({ ...brandingForm, institutionShortName: e.target.value })}
                        placeholder="e.g. SHC / AIT / NIT"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">
                        Campus Location / City
                      </label>
                      <input
                        type="text"
                        value={brandingForm.institutionLocation}
                        onChange={(e) => setBrandingForm({ ...brandingForm, institutionLocation: e.target.value })}
                        placeholder="e.g. Tirupattur — 635 601, Tamil Nadu"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">
                      NAAC Accreditation & University Affiliation Line
                    </label>
                    <textarea
                      rows={2}
                      value={brandingForm.accreditationText}
                      onChange={(e) => setBrandingForm({ ...brandingForm, accreditationText: e.target.value })}
                      placeholder="e.g. Accredited by NAAC (5th Cycle) with 'A++' Grade, Affiliated to Thiruvalluvar University"
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Institution Crest / Logo URL */}
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">
                      Institution Crest / Official Logo
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-[#CBD5E1] rounded-xl text-xs font-semibold hover:bg-stone-50 transition bg-white shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Upload Crest</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload("institutionCrestUrl", e)}
                        />
                      </label>
                      <span className="text-xs text-[#94A3B8]">or enter image link below</span>
                    </div>
                    <input
                      type="text"
                      value={brandingForm.institutionCrestUrl}
                      onChange={(e) => setBrandingForm({ ...brandingForm, institutionCrestUrl: e.target.value })}
                      placeholder="/uploads/crest.png or https://..."
                      className="w-full mt-2 px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                    {brandingForm.institutionCrestUrl && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-stone-50 rounded-xl border border-stone-200">
                        <img src={brandingForm.institutionCrestUrl} alt="Crest Preview" className="h-10 w-auto object-contain" />
                        <span className="text-xs text-stone-600 font-medium">Crest Preview</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">
                      About Institution (Landing Page "About The Institution" card)
                    </label>
                    <textarea
                      rows={3}
                      value={brandingForm.institutionAbout}
                      onChange={(e) => setBrandingForm({ ...brandingForm, institutionAbout: e.target.value })}
                      placeholder="Describe your college legacy, campus, and academic distinction..."
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* 2. Department Identity Card */}
                <div className="dash-card p-6 space-y-5 border-l-4 border-sky-500">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-sky-600" />
                      <span>2. Host Department & Program</span>
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                      Department Profile
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">
                        Host Department Full Name *
                      </label>
                      <input
                        type="text"
                        value={brandingForm.hostDepartment}
                        onChange={(e) => setBrandingForm({ ...brandingForm, hostDepartment: e.target.value })}
                        placeholder="e.g. Department of Computer Applications (PG)"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">
                        Degree / Program Name
                      </label>
                      <input
                        type="text"
                        value={brandingForm.departmentProgram}
                        onChange={(e) => setBrandingForm({ ...brandingForm, departmentProgram: e.target.value })}
                        placeholder="e.g. MCA Program / B.Tech CSE"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Department Logo URL */}
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">
                      Department Logo / Seal
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-[#CBD5E1] rounded-xl text-xs font-semibold hover:bg-stone-50 transition bg-white shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-sky-600" />
                        <span>Upload Dept Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload("deptLogoUrl", e)}
                        />
                      </label>
                      <span className="text-xs text-[#94A3B8]">or enter image link</span>
                    </div>
                    <input
                      type="text"
                      value={brandingForm.deptLogoUrl}
                      onChange={(e) => setBrandingForm({ ...brandingForm, deptLogoUrl: e.target.value })}
                      placeholder="/uploads/dept-logo.png or https://..."
                      className="w-full mt-2 px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                    />
                    {brandingForm.deptLogoUrl && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-stone-50 rounded-xl border border-stone-200">
                        <img src={brandingForm.deptLogoUrl} alt="Dept Logo Preview" className="h-10 w-auto object-contain" />
                        <span className="text-xs text-stone-600 font-medium">Department Logo Preview</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">
                      About Department (Landing Page "About The Department" card)
                    </label>
                    <textarea
                      rows={3}
                      value={brandingForm.departmentAbout}
                      onChange={(e) => setBrandingForm({ ...brandingForm, departmentAbout: e.target.value })}
                      placeholder="Describe your department, labs, achievements, and career readiness..."
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                    />
                  </div>
                </div>

                {/* 3. Contact & Venue Card */}
                <div className="dash-card p-6 space-y-5 border-l-4 border-amber-500">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                      <Phone className="w-4 h-4 text-amber-600" />
                      <span>3. Contact & Campus Venue</span>
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                      Reach & Venue
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={brandingForm.contactEmail}
                        onChange={(e) => setBrandingForm({ ...brandingForm, contactEmail: e.target.value })}
                        placeholder="e.g. fest@college.edu"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={brandingForm.contactPhone}
                        onChange={(e) => setBrandingForm({ ...brandingForm, contactPhone: e.target.value })}
                        placeholder="e.g. +91 9876543210"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">Main Campus Venue</label>
                      <input
                        type="text"
                        value={brandingForm.venue}
                        onChange={(e) => setBrandingForm({ ...brandingForm, venue: e.target.value })}
                        placeholder="e.g. Main Auditorium, College Campus"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">Official Website URL</label>
                      <input
                        type="url"
                        value={brandingForm.websiteUrl}
                        onChange={(e) => setBrandingForm({ ...brandingForm, websiteUrl: e.target.value })}
                        placeholder="e.g. https://www.college.edu"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveBranding}
                    disabled={saving}
                    className="btn-ember !py-3 !px-8 text-sm font-bold w-full sm:w-auto"
                  >
                    {saving ? "Saving Changes..." : "Save Institution & Department Profile"}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Card Preview */}
              <div className="space-y-6">
                <div className="dash-card p-6 sticky top-24 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#FF6B1A]" />
                    <span>Live Public Card Preview</span>
                  </h4>

                  {/* Institution Card Preview */}
                  <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      {brandingForm.institutionCrestUrl ? (
                        <img src={brandingForm.institutionCrestUrl} alt="Crest" className="h-6 w-auto object-contain" />
                      ) : (
                        <Landmark className="w-5 h-5" />
                      )}
                    </div>
                    <h5 className="font-extrabold text-[#0F172A] text-sm leading-snug">
                      {brandingForm.institutionName || "Institution Name"}
                    </h5>
                    <p className="text-xs text-[#57534E] leading-relaxed line-clamp-3">
                      {brandingForm.institutionAbout || "Institution description will appear here..."}
                    </p>
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>{brandingForm.institutionLocation || "Location"}</span>
                      <span className="font-bold text-emerald-600">{brandingForm.institutionShortName || "Host"}</span>
                    </div>
                  </div>

                  {/* Department Card Preview */}
                  <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                      {brandingForm.deptLogoUrl ? (
                        <img src={brandingForm.deptLogoUrl} alt="Dept Logo" className="h-6 w-auto object-contain" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>
                    <h5 className="font-extrabold text-[#0F172A] text-sm leading-snug">
                      {brandingForm.hostDepartment || "Department Name"}
                    </h5>
                    <p className="text-xs text-[#57534E] leading-relaxed line-clamp-3">
                      {brandingForm.departmentAbout || "Department description will appear here..."}
                    </p>
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>{brandingForm.departmentProgram || "Academic Program"}</span>
                      <span className="font-bold text-[#FF6B1A]">Host</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Reusable Platform Ready
                    </p>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      Any college or department can install and operate this system without editing source code.
                    </p>
                  </div>
                </div>
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

                          institutionName: ed.institutionName || "SACRED HEART COLLEGE (AUTONOMOUS), TIRUPATTUR",
                          institutionCrestUrl: ed.institutionCrestUrl || "",
                          accreditationText: ed.accreditationText || "Accredited by NAAC (5th Cycle - Under RAF) with a CGPA of 3.53/4 at 'A++' Grade, Affiliated to Thiruvalluvar University Tirupattur - 635 601",
                          jubileeBadgeUrl: ed.jubileeBadgeUrl || "",
                          hostDepartment: ed.hostDepartment || "DEPARTMENT OF COMPUTER APPLICATIONS(PG)",
                          acronymExpansion: ed.acronymExpansion || "SACRED HEART INFORMATICS NETWORK FOR ENTERPRISES",
                          deptLogoUrl: ed.deptLogoUrl || "",
                          stageHeaderBannerUrl: ed.stageHeaderBannerUrl || "",

                          institutionShortName: ed.institutionShortName || "SHC",
                          institutionLocation: ed.institutionLocation || "Tirupattur — 635 601, Tamil Nadu",
                          institutionAbout: ed.institutionAbout || "Premier institution recognized with NAAC accreditation, providing world-class infrastructure, research excellence, and academic distinction.",
                          departmentAbout: ed.departmentAbout || "Nurturing top-tier engineers, developers, and technical leaders through state-of-the-art labs, hands-on curricula, and hackathons.",
                          departmentProgram: ed.departmentProgram || "MCA Program",
                          contactEmail: ed.contactEmail || "shine@shctpt.edu",
                          contactPhone: ed.contactPhone || "+91 4175 240464",
                          websiteUrl: ed.websiteUrl || "",
                          participantFee: ed.participantFee || 0,
                          isRegistrationOpen: ed.isRegistrationOpen ?? true,
                          registrationClosedNotice:
                            ed.registrationClosedNotice ||
                            "Registrations for this edition are currently closed. Please contact the event coordinators for queries.",
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

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">
                      Delegate Registration Fee Per Participant (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={brandingForm.participantFee}
                      onChange={(e) =>
                        setBrandingForm({
                          ...brandingForm,
                          participantFee: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="e.g. 150 (Set to 0 for Free Fest Registration)"
                      className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                    />
                    <p className="text-[11px] text-[#64748B] mt-1">
                      This entry fee is charged once per student participant delegate across the fest, replacing per-event ticket fees.
                    </p>
                  </div>

                  {/* Public Registration Gateway Status Toggle */}
                  <div className="pt-4 border-t border-stone-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-stone-50/80">
                      <div>
                        <span className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              brandingForm.isRegistrationOpen
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-rose-500"
                            }`}
                          />
                          <span>
                            Public Registration Gateway:{" "}
                            <strong
                              className={
                                brandingForm.isRegistrationOpen
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                              }
                            >
                              {brandingForm.isRegistrationOpen ? "OPEN" : "CLOSED"}
                            </strong>
                          </span>
                        </span>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Controls whether public visitors can access the delegation registration flow at /register.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setBrandingForm((prev) => ({
                            ...prev,
                            isRegistrationOpen: !prev.isRegistrationOpen,
                          }))
                        }
                        className={`tap-target px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          brandingForm.isRegistrationOpen
                            ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                        }`}
                      >
                        {brandingForm.isRegistrationOpen ? (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Switch to Closed</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Switch to Open</span>
                          </>
                        )}
                      </button>
                    </div>

                    {!brandingForm.isRegistrationOpen && (
                      <div className="mt-3 animate-fade-in">
                        <label className="block text-xs font-bold text-[#64748B] mb-1">
                          Notice Displayed to Users When Registration is Closed
                        </label>
                        <textarea
                          rows={2}
                          value={brandingForm.registrationClosedNotice}
                          onChange={(e) =>
                            setBrandingForm({
                              ...brandingForm,
                              registrationClosedNotice: e.target.value,
                            })
                          }
                          placeholder="e.g. Registrations are closed. Please contact student coordinators for spot registration inquiries."
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none resize-none"
                        />
                      </div>
                    )}
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

                  <form onSubmit={handleAddScheduleItem} className="space-y-3 pt-3 border-t border-stone-200">
                    <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-stone-700">Timeline Schedule Time</label>
                        <button
                          type="button"
                          onClick={() => setUseCustomScheduleTime(!useCustomScheduleTime)}
                          className="text-[10px] text-amber-700 hover:underline font-semibold"
                        >
                          {useCustomScheduleTime ? "Switch to Time Picker" : "Enter Custom Text"}
                        </button>
                      </div>

                      {!useCustomScheduleTime ? (
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="block text-[10px] text-stone-500 font-medium mb-0.5">Start Time</span>
                              <input
                                type="time"
                                value={newScheduleStartTime}
                                onChange={(e) => setNewScheduleStartTime(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-stone-300 rounded-lg outline-none font-mono bg-white"
                                required
                              />
                            </div>
                            <div>
                              <span className="block text-[10px] text-stone-500 font-medium mb-0.5">End Time (Optional)</span>
                              <input
                                type="time"
                                value={newScheduleEndTime}
                                onChange={(e) => setNewScheduleEndTime(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-stone-300 rounded-lg outline-none font-mono bg-white"
                              />
                            </div>
                          </div>
                          <div className="text-[10px] font-mono text-[#FF6B1A] font-bold flex items-center gap-1.5 bg-amber-50/80 px-2 py-1 rounded border border-amber-200/60">
                            <span>🕒 Timeline Badge:</span>
                            <span>{buildTimeRangeString(newScheduleStartTime, newScheduleEndTime) || "Select Start Time"}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            placeholder="Custom Time (e.g. Full Day, TBD)"
                            value={customScheduleTimeText}
                            onChange={(e) => setCustomScheduleTimeText(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none font-mono bg-white"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Title (e.g. Inauguration)"
                        value={newScheduleTitle}
                        onChange={(e) => setNewScheduleTitle(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border rounded-lg outline-none font-bold"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Tag (e.g. Inauguration, Check-in)"
                        value={newScheduleTag}
                        onChange={(e) => setNewScheduleTag(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border rounded-lg outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        placeholder="Venue (e.g. SGB Main Auditorium)"
                        value={newScheduleVenue}
                        onChange={(e) => setNewScheduleVenue(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border rounded-lg outline-none"
                      />
                    </div>

                    <textarea
                      placeholder="Brief description of this schedule entry..."
                      value={newScheduleDescription}
                      onChange={(e) => setNewScheduleDescription(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none resize-none h-16"
                    />

                    <button type="submit" className="w-full bg-[#FF6B1A] hover:bg-[#E8551F] text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs">
                      + Add Schedule Entry (Auto-Aligns on Timeline)
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SMTP & EMAIL BROADCASTS */}
        {activeTab === "smtp" && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
                  <Mail className="w-5 h-5 text-sky-600" />
                  <span>SMTP Configuration & Email Updates</span>
                </h3>
                <p className="text-xs text-[#64748B]">
                  Configure your SMTP mail server and dispatch event announcements, schedule updates, or reminders to registered students.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Card 1: SMTP Server Configuration */}
              <div className="dash-card p-6 space-y-5 border-l-4 border-sky-500">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                    <Server className="w-4 h-4 text-sky-600" />
                    <span>SMTP Mail Server Settings</span>
                  </h4>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    smtpForm.host ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {smtpForm.host ? "Configured" : "Not Configured"}
                  </span>
                </div>

                <form onSubmit={handleSaveSmtp} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#64748B] mb-1">SMTP Host *</label>
                      <input
                        type="text"
                        required
                        value={smtpForm.host}
                        onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                        placeholder="e.g. smtp.gmail.com"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">Port *</label>
                      <input
                        type="number"
                        required
                        value={smtpForm.port}
                        onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value, 10) || 587 })}
                        placeholder="587"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="smtpSecure"
                      checked={smtpForm.secure}
                      onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                      className="rounded border-gray-300 text-sky-600 focus:ring-sky-500 h-4 w-4"
                    />
                    <label htmlFor="smtpSecure" className="text-xs font-semibold text-[#475569]">
                      Use SSL/TLS (Enable for port 465, disable for port 587 STARTTLS)
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">Username / Email *</label>
                      <input
                        type="text"
                        required
                        value={smtpForm.user}
                        onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                        placeholder="e.g. username@gmail.com"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">
                        Password {smtpForm.hasPassword && <span className="text-emerald-600 font-normal">(Saved)</span>}
                      </label>
                      <input
                        type="password"
                        value={smtpForm.password}
                        onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                        placeholder={smtpForm.hasPassword ? "•••••••• (Leave blank to keep)" : "Enter App Password"}
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">From Sender Name</label>
                      <input
                        type="text"
                        value={smtpForm.fromName}
                        onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                        placeholder="e.g. Fest Coordination Team"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">From Email Address</label>
                      <input
                        type="email"
                        value={smtpForm.fromEmail}
                        onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                        placeholder="e.g. noreply@college.edu"
                        className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-sky-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSmtp}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0F172A] text-white hover:bg-slate-800 transition shadow-sm"
                  >
                    {savingSmtp ? "Saving SMTP Settings..." : "Save SMTP Settings"}
                  </button>
                </form>

                {/* Test Connection Box */}
                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <h5 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                    <span>Test SMTP Connection & Send Test Email</span>
                  </h5>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="Enter recipient email (e.g. your email)"
                      className="flex-1 px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-xl outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={testingSmtp || !smtpForm.host}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                    >
                      {testingSmtp ? "Testing..." : "Send Test"}
                    </button>
                  </div>
                  {smtpTestResult && (
                    <div className={`p-3 rounded-xl text-xs font-medium ${
                      smtpTestResult.success
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}>
                      {smtpTestResult.success ? "✓ " : "✕ "}
                      {smtpTestResult.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Send Broadcast Email to Students */}
              <div className="dash-card p-6 space-y-5 border-l-4 border-orange-500">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#FF6B1A]" />
                    <span>Dispatch Announcement / Event Update</span>
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-orange-100 text-orange-800 px-2 py-0.5 rounded-md">
                    Student Broadcast
                  </span>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">Target Audience *</label>
                    <select
                      value={broadcastForm.targetAudience}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl outline-none font-semibold"
                    >
                      <option value="ALL">All Registered Students (Site-wide)</option>
                      <option value="EVENT">Students Registered for a Specific Event</option>
                    </select>
                  </div>

                  {broadcastForm.targetAudience === "EVENT" && (
                    <div>
                      <label className="block text-xs font-bold text-[#64748B] mb-1">Select Event *</label>
                      <select
                        required
                        value={broadcastForm.targetEventId}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, targetEventId: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl outline-none"
                      >
                        <option value="">-- Choose an Event --</option>
                        {eventBreakdown.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.name} ({ev.registrationsCount} registered)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">Email Subject *</label>
                    <input
                      type="text"
                      required
                      value={broadcastForm.subject}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                      placeholder="e.g. Schedule Update: Coding Competition Venue Changed"
                      className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#64748B] mb-1">
                      Announcement Message (Supports paragraphs & line breaks) *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={broadcastForm.message}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                      placeholder="Write your announcement to registered students here..."
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl focus:ring-2 focus:ring-[#FF6B1A] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingBroadcast}
                    className="w-full btn-ember !py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingBroadcast ? "Dispatching Emails..." : "Send Announcement to Registered Students"}</span>
                  </button>
                </form>

                {/* Email Live Preview Accordion/Box */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                  <span className="font-bold text-[#0F172A]">📧 Branded Email Template:</span>
                  <p className="text-[11px] leading-relaxed">
                    Emails are automatically delivered in responsive HTML with <strong>{brandingForm.institutionName}</strong> header, custom logo, personalized delegate greeting, and organizing committee signoff.
                  </p>
                </div>
              </div>
            </div>

            {/* Broadcast Logs History Table */}
            <div className="dash-card p-6 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
                Recent Announcement Broadcasts ({broadcastHistory.length})
              </h4>

              {broadcastHistory.length === 0 ? (
                <p className="text-xs text-[#94A3B8] italic">No broadcast announcements have been sent yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase">
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Target Audience</th>
                        <th className="py-2.5 px-3">Recipients</th>
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-xs">
                      {broadcastHistory.map((b) => (
                        <tr key={b.id} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 font-semibold text-[#0F172A]">{b.subject}</td>
                          <td className="py-2.5 px-3 text-[#64748B]">
                            {b.targetAudience === "ALL" ? "All Students" : "Event Participants"}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{b.recipientCount} sent</td>
                          <td className="py-2.5 px-3 text-[#64748B]">
                            {new Date(b.sentAt).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === "SENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "PARTIAL"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: REGISTRATIONS MANAGEMENT */}
        {activeTab === "registrations" && (
          <div className="dash-card p-6 animate-fade-in space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Student Registrations & College Approvals</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Approve registrations college-wise in 1 click or inspect individual student details.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* View Mode Toggle */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRegViewMode("COLLEGE")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      regViewMode === "COLLEGE"
                        ? "bg-white text-[#FF6B1A] shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🏫 Group by College ({collegeGroups.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegViewMode("FLAT")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      regViewMode === "FLAT"
                        ? "bg-white text-[#FF6B1A] shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    📋 Flat List ({filteredRegistrations.length})
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search college, student, event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-[#CBD5E1] rounded-xl outline-none w-48 focus:border-[#FF6B1A] transition-colors"
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

                <button
                  type="button"
                  onClick={() => setShowCheckInModal(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan & Check-In</span>
                </button>
              </div>
            </div>

            {/* VIEW MODE 1: COMPRESSED COLLEGE-WISE CARDS */}
            {regViewMode === "COLLEGE" && (
              <div className="space-y-4">
                {collegeGroups.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-slate-200">
                    No college registrations match your filter criteria.
                  </div>
                ) : (
                  collegeGroups.map((group) => {
                    const isExpanded = !!expandedColleges[group.key];
                    return (
                      <div
                        key={group.key}
                        className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-5 hover:border-amber-400 transition-all shadow-2xs space-y-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-xs uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                                College Delegation
                              </span>
                              {group.paymentStatus === "PAID" || group.paymentStatus === "VERIFIED" ? (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                                  ✓ Fee Paid (₹{group.totalFee})
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300">
                                  Fee Pending (₹{group.totalFee})
                                </span>
                              )}
                            </div>

                            <h4 className="text-lg font-black text-stone-900 flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-[#FF6B1A]" />
                              <span>{group.collegeName}</span>
                            </h4>

                            <div className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-3">
                              <span>Lead: <strong>{group.teamLeadName}</strong> ({group.teamLeadPhone})</span>
                              {group.staffInchargeName && (
                                <span>• Faculty: <strong>{group.staffInchargeName}</strong></span>
                              )}
                              {group.teamName && (
                                <span>• Team: <strong>{group.teamName}</strong></span>
                              )}
                              <span className="text-stone-400">|</span>
                              <span className="font-bold text-stone-900">
                                👥 {group.uniqueStudentsCount} Participant(s) • 🎟️ {group.registrations.length} Event Registrations
                              </span>
                            </div>
                          </div>

                          {/* Approval Status & Batch Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                            {group.pendingCount === 0 && group.confirmedCount > 0 ? (
                              <span className="text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>ALL APPROVED ({group.confirmedCount}/{group.registrations.length})</span>
                              </span>
                            ) : group.pendingCount > 0 ? (
                              <span className="text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                <span>PENDING ({group.pendingCount} Pending)</span>
                              </span>
                            ) : (
                              <span className="text-xs font-black text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                <X className="w-4 h-4 text-rose-600" />
                                <span>REJECTED</span>
                              </span>
                            )}

                            {/* Approve Entire College Button */}
                            {group.pendingCount > 0 && (
                              <button
                                type="button"
                                onClick={() => approveEntireCollege(group)}
                                className="tap-target px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                                title={`Approve all ${group.uniqueStudentsCount} participants from ${group.collegeName}`}
                              >
                                <Check className="w-4 h-4" />
                                <span>Approve College ({group.uniqueStudentsCount})</span>
                              </button>
                            )}

                            {/* Collect Payment & Approve Button */}
                            {group.delegationId && group.paymentStatus !== "PAID" && group.paymentStatus !== "VERIFIED" && (
                              <button
                                type="button"
                                onClick={() => collectPaymentAndApproveDelegation(group.delegationId!, group.teamLeadName || group.collegeName, group.totalFee)}
                                className="tap-target px-3.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-300 hover:bg-amber-400 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                                title="Collect spot fee and activate official passes"
                              >
                                <ReceiptIndianRupee className="w-4 h-4 text-amber-900" />
                                <span>Collect ₹{group.totalFee} & Approve</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => rejectEntireCollege(group)}
                              className="tap-target p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
                              title="Reject all registrations for this college"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setExpandedColleges((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                              className="tap-target px-3 py-1.5 text-xs font-bold text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-100 transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? "Hide Details" : `View Roster (${group.registrations.length})`}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Roster Table */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-stone-200/80 animate-in fade-in duration-150">
                            <div className="table-responsive">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase">
                                    <th className="py-2 px-3">Student Participant</th>
                                    <th className="py-2 px-3">Registered Event</th>
                                    <th className="py-2 px-3">Pass Badge ID</th>
                                    <th className="py-2 px-3">Gate & Meal Status</th>
                                    <th className="py-2 px-3">Status</th>
                                    <th className="py-2 px-3">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200/60">
                                  {group.registrations.map((reg) => (
                                    <tr key={reg.id} className="hover:bg-white transition">
                                      <td className="py-2.5 px-3 font-bold text-stone-900">
                                        <div>{reg.user.name}</div>
                                        <div className="text-[11px] font-normal text-stone-500">{reg.user.email} • {reg.user.phone}</div>
                                      </td>
                                      <td className="py-2.5 px-3 font-semibold text-stone-800">
                                        {reg.event.name}
                                        <span className="text-[10px] text-stone-400 font-normal block">{reg.event.category}</span>
                                      </td>
                                      <td className="py-2.5 px-3">
                                        {reg.delegationMember?.badgeCode ? (
                                          <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100/70 border border-amber-300 px-1.5 py-0.5 rounded">
                                            {reg.delegationMember.badgeCode}
                                          </span>
                                        ) : (
                                          <span className="text-stone-400">-</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <div className="flex flex-wrap gap-1">
                                          {(reg.attended || reg.delegationMember?.eventCheckedIn) ? (
                                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                              Checked In
                                            </span>
                                          ) : (
                                            <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                                              Gate Pending
                                            </span>
                                          )}
                                          {reg.delegationMember?.foodTokenClaimed ? (
                                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                              Meal Claimed
                                            </span>
                                          ) : (
                                            <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                                              Meal Active
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3">
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
                                      <td className="py-2.5 px-3">
                                        <div className="flex items-center gap-1.5">
                                          {reg.status !== "CONFIRMED" && (
                                            <button
                                              onClick={() => updateRegistrationStatus(reg.id, "CONFIRMED")}
                                              className="p-1 bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200 transition"
                                              title="Approve student"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {reg.status !== "REJECTED" && (
                                            <button
                                              onClick={() => updateRegistrationStatus(reg.id, "REJECTED")}
                                              className="p-1 bg-rose-100 text-rose-800 rounded hover:bg-rose-200 transition"
                                              title="Reject student"
                                            >
                                              <X className="w-3.5 h-3.5" />
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
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* VIEW MODE 2: FLAT LIST OF ALL REGISTRATIONS */}
            {regViewMode === "FLAT" && (
              <div className="table-responsive">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">College</th>
                      <th className="py-3 px-4">Registered Event</th>
                      <th className="py-3 px-4">Payment Desk</th>
                      <th className="py-3 px-4">Gate & Meal Status</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-stone-50 transition">
                        <td className="py-3 px-4 font-bold text-[#0F172A]">
                          <div className="flex items-center gap-1.5">
                            <span>{reg.user.name}</span>
                            {reg.delegationMember?.badgeCode && (
                              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                {reg.delegationMember.badgeCode}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-normal text-[#64748B]">{reg.user.email}</div>
                          {reg.delegation?.teamName && (
                            <div className="text-[11px] text-amber-800 font-medium mt-0.5">
                              Team: {reg.delegation.teamName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#64748B]">
                          <div className="font-semibold text-slate-800">
                            {reg.delegation?.collegeName || reg.user.college || "N/A"}
                          </div>
                          {reg.delegation?.staffInchargeName && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Faculty: {reg.delegation.staffInchargeName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#0F172A]">{reg.event.name}</td>

                        {/* Payment Desk Status & Instant Collection */}
                        <td className="py-3 px-4">
                          {reg.delegation ? (
                            <div className="flex flex-col gap-1.5">
                              {reg.delegation.paymentStatus === "PAID" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded w-fit">
                                  <Check className="w-3 h-3" />
                                  ₹{reg.delegation.totalFee ?? 0} • PAID
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded w-fit">
                                    ₹{reg.delegation.totalFee ?? 0} • PENDING
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      collectPaymentAndApproveDelegation(
                                        reg.delegation!.id,
                                        reg.delegation!.teamLeadName,
                                        reg.delegation!.totalFee
                                      )
                                    }
                                    className="tap-target px-2.5 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-sm flex items-center gap-1 cursor-pointer w-fit"
                                    title="Collect registration fee at desk and dispatch official passes"
                                  >
                                    <ReceiptIndianRupee className="w-3 h-3" />
                                    <span>Collect & Approve</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Direct</span>
                          )}
                        </td>

                        {/* Gate & Meal Status Badges */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1.5">
                            {(reg.attended || reg.delegationMember?.eventCheckedIn) ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded w-fit">
                                <Check className="w-3 h-3" />
                                Present
                                {reg.delegationMember?.eventCheckedInAt && (
                                  <span className="text-[9px] font-normal text-emerald-600 ml-1">
                                    {new Date(reg.delegationMember.eventCheckedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit">
                                Absent
                              </span>
                            )}

                            {reg.delegationMember?.foodTokenClaimed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded w-fit">
                                <Utensils className="w-3 h-3" />
                                Food Received
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded w-fit">
                                Meal Pending
                              </span>
                            )}
                          </div>
                        </td>

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
            )}
          </div>
        )}
      </main>

      {/* CREATE NEW EDITION MODAL */}
      {showNewEditionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-[#0F172A]">Create New SHINE Edition</h3>
            <form onSubmit={handleCreateEdition} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Fest Name</label>
                <input
                  type="text"
                  required
                  value={newEditionData.name}
                  onChange={(e) => setNewEditionData({ ...newEditionData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Edition (e.g. 2027)</label>
                <input
                  type="text"
                  required
                  value={newEditionData.edition}
                  onChange={(e) => setNewEditionData({ ...newEditionData, edition: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#64748B] block mb-1">Tagline</label>
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

      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onCheckInComplete={loadAdminData}
      />
    </div>
  );
}
