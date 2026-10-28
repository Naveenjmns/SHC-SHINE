"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
import type { StatsData, EventBreakdown } from "../components/AdminOverviewTab";
import type { RegistrationRecord, CollegeGroup } from "../components/AdminRegistrationsTab";
import type { EventEditionItem } from "../components/AdminEditionsTab";
import type { WaypointNode, WaypointEdge } from "@/lib/wayfinding";
import { downloadEventParticipantsCSV } from "@/lib/exportEventCsv";
import {
  resolveEditionTheme,
  DEFAULT_PRIMARY_ACCENT,
  DEFAULT_SECONDARY_ACCENT,
  DEFAULT_BG_COLOR,
} from "@/lib/colorUtils";

export function useAdminData() {
  const { toast, confirmAction } = useToast();

  const [activeTab, setActiveTab] = useState<
    "overview" | "institution" | "editions" | "branding" | "floorplan" | "smtp" | "registrations" | "reports"
  >("overview");

  const [stats, setStats] = useState<StatsData | null>(null);
  const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [editions, setEditions] = useState<EventEditionItem[]>([]);
  const [activeEdition, setActiveEdition] = useState<EventEditionItem | null>(null);
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloadingEventId, setDownloadingEventId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [brandingForm, setBrandingForm] = useState<any>({
    name: "SHINE",
    edition: "26",
    tagline: "",
    metadataText: "",
    venue: "",
    startDate: "2026-09-17T09:30",
    logoUrl: "",
    primaryCtaText: "EXPLORE SHINE →",
    primaryCtaLink: "#events",
    themePrimaryAccent: DEFAULT_PRIMARY_ACCENT,
    themeSecondaryAccent: DEFAULT_SECONDARY_ACCENT,
    themeBgColor: DEFAULT_BG_COLOR,
    institutionName: "",
    institutionShortName: "SHC",
    institutionLocation: "",
    institutionAbout: "",
    accreditationText: "",
    institutionCrestUrl: "",
    jubileeBadgeUrl: "",
    hostDepartment: "",
    departmentAbout: "",
    departmentProgram: "MCA Program",
    deptLogoUrl: "",
    acronymExpansion: "",
    stageHeaderBannerUrl: "",
    contactEmail: "",
    contactPhone: "",
    websiteUrl: "",
    diningHallVenue: "",
    diningFacilityInfo: "",
    mealOptions: "BOTH",
    participantFee: 0,
    isRegistrationOpen: true,
    registrationClosedNotice: "",
    prizePool: "₹25K+",
    expectedDelegates: "500+",
    rulesEligibilityTitle: "Eligibility & Registration",
    rulesEligibilityText: "",
    rulesTimingsTitle: "Reporting & Timings",
    rulesTimingsText: "",
    rulesChampionshipTitle: "Overall Championship",
    rulesChampionshipText: "",
    defaultFirstPrize: "Cash Prize + Trophy + Certificate",
    defaultSecondPrize: "Cash Prize + Merit Certificate",
    defaultThirdPrize: "Distinction Certificate",
    showStageModeInStudentPortal: false,
    floorPlanUrl: "/uploads/campus-floorplan.svg",
  });

  const [smtpForm, setSmtpForm] = useState({
    host: "",
    port: "465",
    user: "",
    password: "",
    fromName: "",
    fromEmail: "",
    hasPassword: false,
  });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [emailTriggers, setEmailTriggers] = useState({
    emailServiceEnabled: true,
    sendOnRegistration: false,
    sendOnApproval: true,
    sendOnTeamLeadApproval: true,
    sendOnCoordinatorAlert: true,
    sendOnEventReminder: true,
  });
  const [savingTriggerKey, setSavingTriggerKey] = useState<string | null>(null);

  const [broadcastForm, setBroadcastForm] = useState({
    targetAudience: "ALL",
    targetEventId: "",
    subject: "",
    message: "",
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);

  // Floor plan and Graph
  const [graphData, setGraphData] = useState<{ nodes: WaypointNode[]; edges: WaypointEdge[] }>({
    nodes: [],
    edges: [],
  });
  const [savingGraph, setSavingGraph] = useState(false);
  const [detectedZones, setDetectedZones] = useState<any[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState(false);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, regRes, edRes, smtpRes, historyRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/registrations"),
        fetch("/api/admin/edition"),
        fetch("/api/admin/smtp"),
        fetch("/api/admin/email/history"),
      ]);

      const [statsData, regData, edData, smtpData, historyData] = await Promise.all([
        safeJson(statsRes, { success: false, stats: null, eventBreakdown: [] }),
        safeJson(regRes, { success: false, registrations: [] }),
        safeJson(edRes, { success: false, editions: [] }),
        safeJson(smtpRes, { success: false, smtp: null }),
        safeJson(historyRes, { success: false, history: [] }),
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
        setEventBreakdown(statsData.eventBreakdown || []);
      }

      if (regData.success) {
        setRegistrations(regData.registrations || []);
      }

      if (edData.success && edData.editions) {
        setEditions(edData.editions);
        const active = edData.editions.find((e: any) => e.isActive) || edData.editions[0] || null;
        setActiveEdition(active);

        if (active) {
          const theme = resolveEditionTheme(
            active.themePrimaryAccent,
            active.themeSecondaryAccent,
            active.themeBgColor
          );
          setBrandingForm({
            name: active.name || "SHINE",
            edition: active.edition || "26",
            tagline: active.tagline || "",
            metadataText: active.metadataText || "",
            venue: active.venue || "",
            startDate: active.startDate ? new Date(active.startDate).toISOString().slice(0, 16) : "2026-09-17T09:30",
            logoUrl: active.logoUrl || "",
            primaryCtaText: active.primaryCtaText || "EXPLORE SHINE →",
            primaryCtaLink: active.primaryCtaLink || "#events",
            themePrimaryAccent: theme.primary,
            themeSecondaryAccent: theme.secondary,
            themeBgColor: theme.bg,
            institutionName: active.institutionName || "",
            institutionShortName: active.institutionShortName || "SHC",
            institutionLocation: active.institutionLocation || "",
            institutionAbout: active.institutionAbout || "",
            accreditationText: active.accreditationText || "",
            institutionCrestUrl: active.institutionCrestUrl || "",
            jubileeBadgeUrl: active.jubileeBadgeUrl || "",
            hostDepartment: active.hostDepartment || "",
            departmentAbout: active.departmentAbout || "",
            departmentProgram: active.departmentProgram || "MCA Program",
            deptLogoUrl: active.deptLogoUrl || "",
            acronymExpansion: active.acronymExpansion || "",
            stageHeaderBannerUrl: active.stageHeaderBannerUrl || "",
            contactEmail: active.contactEmail || "",
            contactPhone: active.contactPhone || "",
            websiteUrl: active.websiteUrl || "",
            diningHallVenue: active.diningHallVenue || "",
            diningFacilityInfo: active.diningFacilityInfo || "",
            mealOptions: active.mealOptions || "BOTH",
            participantFee: active.participantFee || 0,
            isRegistrationOpen: active.isRegistrationOpen ?? true,
            registrationClosedNotice: active.registrationClosedNotice || "",
            prizePool: active.prizePool || "₹25K+",
            expectedDelegates: active.expectedDelegates || "500+",
            rulesEligibilityTitle: active.rulesEligibilityTitle || "Eligibility & Registration",
            rulesEligibilityText: active.rulesEligibilityText || "",
            rulesTimingsTitle: active.rulesTimingsTitle || "Reporting & Timings",
            rulesTimingsText: active.rulesTimingsText || "",
            rulesChampionshipTitle: active.rulesChampionshipTitle || "Overall Championship",
            rulesChampionshipText: active.rulesChampionshipText || "",
            defaultFirstPrize: active.defaultFirstPrize || "Cash Prize + Trophy + Certificate",
            defaultSecondPrize: active.defaultSecondPrize || "Cash Prize + Merit Certificate",
            defaultThirdPrize: active.defaultThirdPrize || "Distinction Certificate",
            showStageModeInStudentPortal: Boolean(active.showStageModeInStudentPortal),
            floorPlanUrl: active.floorPlanUrl || "/uploads/campus-floorplan.svg",
          });

          if (active.waypointGraph) {
            setGraphData(active.waypointGraph);
          }
        }
      }

      if (smtpData.success && smtpData.smtp) {
        setSmtpForm({
          host: smtpData.smtp.host || "",
          port: "465",
          user: smtpData.smtp.user || "",
          password: "",
          fromName: smtpData.smtp.fromName || "",
          fromEmail: smtpData.smtp.fromEmail || "",
          hasPassword: Boolean(smtpData.smtp.hasPassword),
        });
        if (smtpData.emailTriggers) {
          setEmailTriggers(smtpData.emailTriggers);
        }
      }

      if (historyData.success && historyData.history) {
        setBroadcastHistory(historyData.history);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/admin/reports");
      const data = await safeJson(res);
      if (data.success) {
        setReportsData(data);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  }, [toast]);

  // Live-preview theme edits across the console (ThemeInjector listens for this)
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("shine:theme-update", {
        detail: {
          primary: brandingForm.themePrimaryAccent,
          secondary: brandingForm.themeSecondaryAccent,
          bg: brandingForm.themeBgColor,
        },
      })
    );
  }, [brandingForm.themePrimaryAccent, brandingForm.themeSecondaryAccent, brandingForm.themeBgColor]);

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edition", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...brandingForm, id: activeEdition?.id }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("Settings saved successfully.");
        loadAdminData();
      } else {
        throw new Error(data.error || data.message || "Failed to save settings");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRegistration = async () => {
    const nextState = !brandingForm.isRegistrationOpen;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edition", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...brandingForm, id: activeEdition?.id, isRegistrationOpen: nextState }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        setBrandingForm((prev: any) => ({ ...prev, isRegistrationOpen: nextState }));
        toast.success(nextState ? "Public registration reopened." : "Registration frozen.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStageMode = async (enabled: boolean) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edition", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...brandingForm, id: activeEdition?.id, showStageModeInStudentPortal: enabled }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        setBrandingForm((prev: any) => ({ ...prev, showStageModeInStudentPortal: enabled }));
        toast.success(enabled ? "Stage Mode published to students." : "Stage Mode hidden.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleMakeEditionActive = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/editions/${id}/activate`, { method: "POST" });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("Active edition updated.");
        loadAdminData();
      }
    } finally {
      setSaving(false);
    }
  };

  const updateRegistrationStatus = async (id: string, status: "CONFIRMED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success(`Registration marked as ${status.toLowerCase()}.`);
        loadAdminData();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update registration");
    }
  };

  const handleApproveCollege = async (group: CollegeGroup) => {
    try {
      const ids = group.registrations.map((r) => r.id);
      const res = await fetch("/api/admin/registrations/batch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: "CONFIRMED" }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success(`Approved ${group.uniqueStudentsCount} participants from ${group.collegeName}.`);
        loadAdminData();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to batch approve");
    }
  };

  const handleRejectCollege = async (group: CollegeGroup) => {
    const confirmed = await confirmAction({
      title: "Reject College Delegation?",
      message: `Reject all registrations for ${group.collegeName}?`,
      confirmText: "Reject Delegation",
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      const ids = group.registrations.map((r) => r.id);
      const res = await fetch("/api/admin/registrations/batch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: "REJECTED" }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("Delegation rejected.");
        loadAdminData();
      } else {
        toast.error(data.message || "Failed to reject delegation.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error rejecting delegation.");
    }
  };

  const handleCollectPayment = async (delegationId: string, name: string, fee: number) => {
    const confirmed = await confirmAction({
      title: "Confirm Fee Payment",
      message: `Record spot payment of ₹${fee} for ${name}?`,
      confirmText: "Mark as Paid",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/delegations/${delegationId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("Payment recorded and passes activated.");
        loadAdminData();
      } else {
        toast.error(data.message || "Failed to record payment.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error recording payment.");
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    try {
      const res = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpForm),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("SMTP configuration saved.");
        setSmtpForm((prev) => ({ ...prev, hasPassword: true, password: "" }));
      }
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testEmailAddress) return;
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch("/api/admin/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailAddress }),
      });
      const data = await safeJson(res);
      setSmtpTestResult(data);
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleToggleTrigger = async (key: string, val: boolean) => {
    setSavingTriggerKey(key);
    try {
      const updated = { ...emailTriggers, [key]: val };
      const res = await fetch("/api/admin/email-triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        setEmailTriggers(updated);
        toast.success("Email trigger updated.");
      }
    } finally {
      setSavingTriggerKey(null);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingBroadcast(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastForm),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("Broadcast dispatched successfully.");
        setBroadcastForm({ targetAudience: "ALL", targetEventId: "", subject: "", message: "" });
        loadAdminData();
      }
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleSaveGraph = async () => {
    setSavingGraph(true);
    try {
      const res = await fetch("/api/admin/floorplan/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: graphData }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("A* Wayfinding Graph saved.");
      }
    } finally {
      setSavingGraph(false);
    }
  };

  // Grouped college records
  const collegeGroups: CollegeGroup[] = useMemo(() => {
    const map = new Map<string, CollegeGroup>();

    registrations.forEach((reg) => {
      const collegeName = reg.delegation?.collegeName || reg.user.collegeName || "Individual Students";
      const key = collegeName.toLowerCase().trim();

      if (!map.has(key)) {
        map.set(key, {
          key,
          collegeName,
          teamName: reg.delegation?.teamName || undefined,
          teamLeadName: reg.delegation?.teamLeadName || reg.user.name,
          teamLeadPhone: reg.delegation?.teamLeadPhone || reg.user.phone,
          staffInchargeName: reg.delegation?.staffInchargeName || undefined,
          delegationId: reg.delegation?.id,
          paymentStatus: reg.delegation?.paymentStatus || "PENDING",
          totalFee: reg.delegation?.totalAmount || reg.event.fee,
          registrations: [],
          pendingCount: 0,
          confirmedCount: 0,
          rejectedCount: 0,
          uniqueStudentsCount: 0,
        });
      }

      const grp = map.get(key)!;
      grp.registrations.push(reg);
      if (reg.status === "PENDING") grp.pendingCount++;
      if (reg.status === "CONFIRMED") grp.confirmedCount++;
      if (reg.status === "REJECTED") grp.rejectedCount++;
    });

    map.forEach((grp) => {
      const set = new Set(grp.registrations.map((r) => r.user.id));
      grp.uniqueStudentsCount = set.size;
    });

    return Array.from(map.values());
  }, [registrations]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          r.user.name.toLowerCase().includes(q) ||
          r.user.collegeName.toLowerCase().includes(q) ||
          r.event.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [registrations, statusFilter, searchTerm]);

  return {
    activeTab,
    setActiveTab,
    stats,
    eventBreakdown,
    registrations,
    editions,
    activeEdition,
    reportsData,
    loadingReports,
    loadReports,
    downloadingEventId,
    setDownloadingEventId,
    loading,
    saving,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    brandingForm,
    setBrandingForm,
    smtpForm,
    setSmtpForm,
    savingSmtp,
    handleSaveSmtp,
    testEmailAddress,
    setTestEmailAddress,
    testingSmtp,
    handleTestSmtp,
    smtpTestResult,
    emailTriggers,
    savingTriggerKey,
    handleToggleTrigger,
    broadcastForm,
    setBroadcastForm,
    sendingBroadcast,
    handleSendBroadcast,
    broadcastHistory,
    graphData,
    setGraphData,
    savingGraph,
    handleSaveGraph,
    detectedZones,
    setDetectedZones,
    loadingZones,
    uploadingFloorPlan,
    handleSaveBranding,
    handleToggleRegistration,
    handleToggleStageMode,
    handleMakeEditionActive,
    updateRegistrationStatus,
    handleApproveCollege,
    handleRejectCollege,
    handleCollectPayment,
    collegeGroups,
    filteredRegistrations,
    loadAdminData,
  };
}
