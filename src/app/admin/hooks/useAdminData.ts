"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
import type { StatsData, EventBreakdown } from "../components/AdminOverviewTab";
import type { RegistrationRecord, CollegeGroup } from "../components/AdminRegistrationsTab";
import type { EventEditionItem } from "../components/AdminEditionsTab";
import type { WaypointNode, WaypointEdge } from "@/lib/wayfinding";
import { downloadEventParticipantsCSV } from "@/lib/exportEventCsv";
import { DEFAULT_EDITION_CONFIG } from "@/lib/editionDefaults";

// Form state for the Branding / Institution tabs, built from one edition record
function formFromEdition(ed: EventEditionItem) {
  return {
    name: ed.name || DEFAULT_EDITION_CONFIG.name,
    edition: ed.edition || DEFAULT_EDITION_CONFIG.edition,
    tagline: ed.tagline || "",
    metadataText: ed.metadataText || "",
    venue: ed.venue || "",
    startDate: ed.startDate ? new Date(ed.startDate).toISOString().slice(0, 16) : "",
    logoUrl: ed.logoUrl || "",
    primaryCtaText: ed.primaryCtaText || DEFAULT_EDITION_CONFIG.primaryCtaText || "",
    primaryCtaLink: ed.primaryCtaLink || DEFAULT_EDITION_CONFIG.primaryCtaLink || "",
    themePrimaryAccent: ed.themePrimaryAccent || DEFAULT_EDITION_CONFIG.themePrimaryAccent || "",
    themeSecondaryAccent: ed.themeSecondaryAccent || DEFAULT_EDITION_CONFIG.themeSecondaryAccent || "",
    themeBgColor: ed.themeBgColor || DEFAULT_EDITION_CONFIG.themeBgColor || "",
    institutionName: ed.institutionName || "",
    institutionShortName: ed.institutionShortName || "",
    institutionLocation: ed.institutionLocation || "",
    institutionAbout: ed.institutionAbout || "",
    accreditationText: ed.accreditationText || "",
    institutionCrestUrl: ed.institutionCrestUrl || "",
    jubileeBadgeUrl: ed.jubileeBadgeUrl || "",
    hostDepartment: ed.hostDepartment || "",
    departmentAbout: ed.departmentAbout || "",
    departmentProgram: ed.departmentProgram || "",
    deptLogoUrl: ed.deptLogoUrl || "",
    acronymExpansion: ed.acronymExpansion || "",
    stageHeaderBannerUrl: ed.stageHeaderBannerUrl || "",
    contactEmail: ed.contactEmail || "",
    contactPhone: ed.contactPhone || "",
    websiteUrl: ed.websiteUrl || "",
    diningHallVenue: ed.diningHallVenue || "",
    diningFacilityInfo: ed.diningFacilityInfo || "",
    mealOptions: ed.mealOptions || "BOTH",
    participantFee: ed.participantFee || 0,
    isRegistrationOpen: ed.isRegistrationOpen ?? true,
    registrationClosedNotice: ed.registrationClosedNotice || "",
    prizePool: ed.prizePool || "",
    expectedDelegates: ed.expectedDelegates || "",
    rulesEligibilityTitle: ed.rulesEligibilityTitle || DEFAULT_EDITION_CONFIG.rulesEligibilityTitle || "",
    rulesEligibilityText: ed.rulesEligibilityText || "",
    rulesTimingsTitle: ed.rulesTimingsTitle || DEFAULT_EDITION_CONFIG.rulesTimingsTitle || "",
    rulesTimingsText: ed.rulesTimingsText || "",
    rulesChampionshipTitle: ed.rulesChampionshipTitle || DEFAULT_EDITION_CONFIG.rulesChampionshipTitle || "",
    rulesChampionshipText: ed.rulesChampionshipText || "",
    defaultFirstPrize: ed.defaultFirstPrize || DEFAULT_EDITION_CONFIG.defaultFirstPrize || "",
    defaultSecondPrize: ed.defaultSecondPrize || DEFAULT_EDITION_CONFIG.defaultSecondPrize || "",
    defaultThirdPrize: ed.defaultThirdPrize || DEFAULT_EDITION_CONFIG.defaultThirdPrize || "",
    showStageModeInStudentPortal: Boolean(ed.showStageModeInStudentPortal),
    floorPlanUrl: ed.floorPlanUrl || DEFAULT_EDITION_CONFIG.floorPlanUrl || "",
    // Campus GPS for the floor plan's "distance to campus" check ("" = disabled)
    campusLatitude: ed.campusLatitude ?? "",
    campusLongitude: ed.campusLongitude ?? "",
  };
}

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
  // Edition whose settings the Branding / Institution tabs edit (null = the active edition)
  const [editingEditionId, setEditingEditionId] = useState<string | null>(null);
  const editingEditionIdRef = useRef<string | null>(null);
  const editingEdition = editions.find((e) => e.id === editingEditionId) || activeEdition;
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [downloadingEventId, setDownloadingEventId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Neutral defaults until an edition loads — never institution-specific text
  const [brandingForm, setBrandingForm] = useState<any>(() => formFromEdition({} as EventEditionItem));

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
        safeJson(historyRes, { success: false, broadcasts: [] }),
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
        // Keep editing the edition picked via "Configure", if it still exists
        const target = edData.editions.find((e: EventEditionItem) => e.id === editingEditionIdRef.current) || active;
        if (target?.id !== editingEditionIdRef.current) editingEditionIdRef.current = null;
        setEditingEditionId(editingEditionIdRef.current);

        if (target) {
          setBrandingForm(formFromEdition(target));

          setGraphData(target.waypointGraph || { nodes: [], edges: [] });
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

      if (historyData.success && historyData.broadcasts) {
        setBroadcastHistory(historyData.broadcasts);
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
      if (data.success && data.report) {
        setReportsData(data.report);
      } else {
        toast.error(data.message || "Failed to load reports");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  }, [toast]);

  // All edition settings (branding, institution, toggles) are saved through PATCH /api/admin/edition
  const patchEdition = async (editionId: string | undefined, fields: Record<string, unknown>) => {
    if (!editionId) {
      throw new Error("Create an edition first before saving settings.");
    }
    const res = await fetch("/api/admin/edition", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editionId, ...fields }),
    });
    const data = await safeJson(res);
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || "Failed to save settings");
    }
    return data;
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      await patchEdition(editingEdition?.id, brandingForm);
      toast.success("Settings saved successfully.");
      loadAdminData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRegistration = async () => {
    const nextState = !(activeEdition?.isRegistrationOpen ?? true);
    setSaving(true);
    try {
      await patchEdition(activeEdition?.id, { isRegistrationOpen: nextState });
      if (!editingEditionId || editingEditionId === activeEdition?.id) {
        setBrandingForm((prev: any) => ({ ...prev, isRegistrationOpen: nextState }));
      }
      setActiveEdition((prev) => (prev ? { ...prev, isRegistrationOpen: nextState } : prev));
      toast.success(nextState ? "Public registration reopened." : "Registration frozen.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStageMode = async (enabled: boolean) => {
    setSaving(true);
    try {
      await patchEdition(activeEdition?.id, { showStageModeInStudentPortal: enabled });
      if (!editingEditionId || editingEditionId === activeEdition?.id) {
        setBrandingForm((prev: any) => ({ ...prev, showStageModeInStudentPortal: enabled }));
      }
      setActiveEdition((prev) => (prev ? { ...prev, showStageModeInStudentPortal: enabled } : prev));
      toast.success(enabled ? "Stage Mode published to students." : "Stage Mode hidden.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMakeEditionActive = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edition", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, makeActive: true }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("Active edition updated.");
        loadAdminData();
      } else {
        toast.error(data.message || data.error || "Failed to activate edition.");
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
        body: JSON.stringify({ registrationId: id, status }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success(`Registration marked as ${status.toLowerCase()}.`);
        loadAdminData();
      } else {
        toast.error(data.message || "Failed to update registration");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update registration");
    }
  };

  const handleApproveCollege = async (group: CollegeGroup) => {
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_COLLEGE",
          delegationId: group.delegationId,
          collegeName: group.delegationId ? undefined : group.collegeName,
        }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success(`Approved ${group.uniqueStudentsCount} participants from ${group.collegeName}.`);
        loadAdminData();
      } else {
        toast.error(data.message || "Failed to batch approve");
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
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT_COLLEGE",
          delegationId: group.delegationId,
          collegeName: group.delegationId ? undefined : group.collegeName,
        }),
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
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "COLLECT_PAYMENT_APPROVE_DELEGATION", delegationId }),
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
        setSmtpForm((prev) => ({ ...prev, hasPassword: prev.hasPassword || Boolean(prev.password), password: "" }));
      } else {
        toast.error(data.message || data.error || "Failed to save SMTP configuration.");
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
        body: JSON.stringify({ testEmail: testEmailAddress }),
      });
      const data = await safeJson(res, { success: false });
      setSmtpTestResult({
        success: Boolean(data.success),
        message: data.message || data.error || (data.success ? "Test email sent." : "Test email failed."),
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleToggleTrigger = async (key: string, val: boolean) => {
    setSavingTriggerKey(key);
    try {
      const updated = { ...emailTriggers, [key]: val };
      const res = await fetch("/api/admin/smtp/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailTriggers: updated }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        setEmailTriggers(updated);
        toast.success("Email trigger updated.");
      } else {
        toast.error(data.message || data.error || "Failed to update email trigger.");
      }
    } finally {
      setSavingTriggerKey(null);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingBroadcast(true);
    try {
      if (broadcastForm.targetAudience === "EVENT" && !broadcastForm.targetEventId) {
        toast.error("Select the event whose participants should receive this broadcast.");
        return;
      }
      const res = await fetch("/api/admin/email/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastForm),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success(data.message || "Broadcast dispatched successfully.");
        setBroadcastForm({ targetAudience: "ALL", targetEventId: "", subject: "", message: "" });
        loadAdminData();
      } else {
        toast.error(data.message || data.error || "Failed to send broadcast.");
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
        body: JSON.stringify({ nodes: graphData.nodes, edges: graphData.edges }),
      });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("A* Wayfinding Graph saved.");
      } else {
        toast.error(data.message || data.error || "Failed to save graph.");
      }
    } finally {
      setSavingGraph(false);
    }
  };

  const uploadAsset = async (file: File, isFloorPlan = false): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    if (isFloorPlan) fd.append("isFloorPlan", "true");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await safeJson(res, { success: false });
      if (res.ok && data.success && data.url) return data.url as string;
      toast.error(data.error || data.message || "Upload failed.");
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    }
    return null;
  };

  const handleUploadField = async (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadAsset(file);
    if (url) setBrandingForm((prev: any) => ({ ...prev, [field]: url }));
  };

  const handleUploadFloorPlan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFloorPlan(true);
    try {
      const url = await uploadAsset(file, true);
      if (url) setBrandingForm((prev: any) => ({ ...prev, floorPlanUrl: url }));
    } finally {
      setUploadingFloorPlan(false);
    }
  };

  const handleScanZones = async () => {
    setLoadingZones(true);
    try {
      const url = brandingForm.floorPlanUrl ? `?url=${encodeURIComponent(brandingForm.floorPlanUrl)}` : "";
      const res = await fetch(`/api/admin/floorplan/zones${url}`);
      const data = await safeJson(res, { success: false, zones: [] });
      if (data.success) {
        setDetectedZones(data.zones || []);
        toast.success(`Detected ${data.zones?.length || 0} zones.`);
      } else {
        toast.error(data.error || "Failed to scan zones.");
      }
    } finally {
      setLoadingZones(false);
    }
  };

  // Navigation & schedule items are separate records, saved immediately through their own APIs
  const updateEditionList = (key: "navItems" | "scheduleItems", update: (items: any[]) => any[]) => {
    const targetId = editingEdition?.id;
    if (!targetId) return;
    const apply = (ed: EventEditionItem) => (ed.id === targetId ? { ...ed, [key]: update(ed[key] || []) } : ed);
    setEditions((prev) => prev.map(apply));
    setActiveEdition((prev) => (prev ? apply(prev) : prev));
  };

  const selectEditionForEdit = (ed: EventEditionItem) => {
    const id = ed.id === activeEdition?.id ? null : ed.id;
    editingEditionIdRef.current = id;
    setEditingEditionId(id);
    setBrandingForm(formFromEdition(ed));
    setGraphData(ed.waypointGraph || { nodes: [], edges: [] });
  };

  const editionItemRequest = async (path: string, init: RequestInit, failMessage: string) => {
    const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
    const data = await safeJson(res, { success: false });
    if (!res.ok || !data.success) {
      toast.error(data.error || data.message || failMessage);
      return null;
    }
    return data;
  };

  const handleAddNavItem = async (label: string, url: string) => {
    if (!editingEdition?.id) return;
    const order = (editingEdition.navItems?.length || 0) + 1;
    const data = await editionItemRequest(
      "/api/admin/navigation",
      { method: "POST", body: JSON.stringify({ editionId: editingEdition.id, label, url, order }) },
      "Failed to add navigation link."
    );
    if (data?.item) updateEditionList("navItems", (items) => [...items, data.item]);
  };

  const handleDeleteNavItem = async (id: string) => {
    const data = await editionItemRequest(`/api/admin/navigation?id=${encodeURIComponent(id)}`, { method: "DELETE" }, "Failed to delete navigation link.");
    if (data) updateEditionList("navItems", (items) => items.filter((n) => n.id !== id));
  };

  const handleToggleNavItem = async (id: string, isEnabled: boolean) => {
    const data = await editionItemRequest(
      "/api/admin/navigation",
      { method: "PATCH", body: JSON.stringify({ id, isEnabled }) },
      "Failed to update navigation link."
    );
    if (data) updateEditionList("navItems", (items) => items.map((n) => (n.id === id ? { ...n, isEnabled } : n)));
  };

  const handleAddScheduleItem = async (item: any) => {
    if (!editingEdition?.id) return;
    const data = await editionItemRequest(
      "/api/admin/schedule",
      { method: "POST", body: JSON.stringify({ ...item, editionId: editingEdition.id }) },
      "Failed to add schedule item."
    );
    if (data?.item) updateEditionList("scheduleItems", (items) => [...items, data.item]);
  };

  const handleDeleteScheduleItem = async (id: string) => {
    const data = await editionItemRequest(`/api/admin/schedule?id=${encodeURIComponent(id)}`, { method: "DELETE" }, "Failed to delete schedule item.");
    if (data) updateEditionList("scheduleItems", (items) => items.filter((it) => it.id !== id));
  };

  const handleResetData = async () => {
    const confirmed = await confirmAction({
      title: "Reset all registrations?",
      message:
        "This permanently deletes every registration, delegation, badge and meal token. Events, editions, staff accounts and settings are kept. Student login accounts are also kept.",
      confirmText: "Delete all registrations",
      isDestructive: true,
    });
    if (!confirmed) return;
    const res = await fetch("/api/admin/registrations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "RESET", clearStudentAccounts: false }),
    });
    const data = await safeJson(res, { success: false });
    if (res.ok && data.success) {
      toast.success(data.message || "All registrations cleared.");
      loadAdminData();
    } else {
      toast.error(data.message || "Failed to reset registrations.");
    }
  };

  // Grouped college records
  const collegeGroups: CollegeGroup[] = useMemo(() => {
    const map = new Map<string, CollegeGroup>();

    registrations.forEach((reg) => {
      const collegeName = reg.delegation?.collegeName || reg.user.college || "Individual Students";
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
          totalFee: reg.delegation?.totalFee ?? reg.event.fee,
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
          (r.delegation?.collegeName || r.user.college || "").toLowerCase().includes(q) ||
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
    editingEdition,
    selectEditionForEdit,
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
    handleUploadField,
    handleUploadFloorPlan,
    handleScanZones,
    handleAddNavItem,
    handleDeleteNavItem,
    handleToggleNavItem,
    handleAddScheduleItem,
    handleDeleteScheduleItem,
    handleResetData,
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
