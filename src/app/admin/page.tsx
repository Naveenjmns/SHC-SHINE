"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Palette,
  MapPin,
  Mail,
  FileText,
  RefreshCw,
} from "lucide-react";
import CheckInModal from "@/components/CheckInModal";
import PrintableQrModal from "@/components/PrintableQrModal";
import InteractiveFloorPlanModal from "@/components/InteractiveFloorPlanModal";
import { downloadEventParticipantsCSV } from "@/lib/exportEventCsv";
import { useAdminData } from "./hooks/useAdminData";
import AdminHeader from "./components/AdminHeader";
import AdminOverviewTab from "./components/AdminOverviewTab";
import AdminRegistrationsTab from "./components/AdminRegistrationsTab";
import AdminEditionsTab from "./components/AdminEditionsTab";
import AdminInstitutionTab from "./components/AdminInstitutionTab";
import AdminBrandingTab from "./components/AdminBrandingTab";
import AdminFloorplanTab from "./components/AdminFloorplanTab";
import AdminSmtpTab from "./components/AdminSmtpTab";
import AdminReportsTab from "./components/AdminReportsTab";
import AdminNewEditionModal from "./components/AdminNewEditionModal";

export default function AdminOverviewPage() {
  const {
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
  } = useAdminData();

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showPrintableQrModal, setShowPrintableQrModal] = useState(false);
  const [showInteractiveModal, setShowInteractiveModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showNewEditionModal, setShowNewEditionModal] = useState(false);

  const handleDownloadSingleCSV = async (eventId: string, eventName: string) => {
    setDownloadingEventId(eventId);
    try {
      await downloadEventParticipantsCSV({ eventId, eventName });
    } finally {
      setDownloadingEventId(null);
    }
  };

  const handleDownloadAllCSVs = async () => {
    setDownloadingEventId("ALL");
    try {
      for (const ev of eventBreakdown) {
        await downloadEventParticipantsCSV({ eventId: ev.id, eventName: ev.name });
      }
    } finally {
      setDownloadingEventId(null);
    }
  };

  interface AdminTabItem {
    id: "overview" | "registrations" | "editions" | "institution" | "branding" | "floorplan" | "smtp" | "reports";
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const tabs: AdminTabItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "registrations", label: "Registrations", icon: Users, badge: registrations.length },
    { id: "editions", label: "Editions", icon: Calendar },
    { id: "institution", label: "Institution", icon: Building2 },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "floorplan", label: "Floor Plan", icon: MapPin },
    { id: "smtp", label: "Mail & Alerts", icon: Mail },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm font-semibold text-ink-muted uppercase tracking-wider">
            Loading Admin Console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-canvas flex flex-col">
      <AdminHeader
        editionNumber={activeEdition?.edition || "26"}
        onOpenCheckIn={() => setShowCheckInModal(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 flex-1 w-full space-y-6">
        {/* Navigation tabs — sticky, swipeable on phones */}
        <nav
          aria-label="Admin sections"
          className="sticky top-16 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 bg-canvas/95 backdrop-blur-md"
        >
          <div className="relative">
            <div
              role="tablist"
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar snap-x [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] lg:[mask-image:none] pr-8 lg:pr-0"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    ref={(el) => {
                      if (isActive && el) el.scrollIntoView({ block: "nearest", inline: "nearest" });
                    }}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      if (tab.id === "reports" && !reportsData) {
                        loadReports();
                      }
                    }}
                    className={`snap-start shrink-0 min-h-[44px] px-4 text-[15px] font-semibold rounded-full transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      isActive
                        ? "bg-surface-inverse text-white"
                        : "text-ink-muted hover:text-ink hover:bg-surface-raised"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`min-w-6 h-6 px-1.5 inline-flex items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                          isActive ? "bg-white/20 text-white" : "bg-accent-muted text-accent-strong"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Tab Views */}
        {activeTab === "overview" && stats && (
          <AdminOverviewTab
            stats={stats}
            eventBreakdown={eventBreakdown}
            activeEdition={activeEdition}
            saving={saving}
            onToggleRegistration={handleToggleRegistration}
            onOpenCheckIn={() => setShowCheckInModal(true)}
            onOpenResetModal={() => setShowResetModal(true)}
            onDownloadEventCSV={handleDownloadSingleCSV}
            onDownloadAllEventCSVs={handleDownloadAllCSVs}
            downloadingEventId={downloadingEventId}
          />
        )}

        {activeTab === "registrations" && (
          <AdminRegistrationsTab
            registrations={registrations}
            collegeGroups={collegeGroups}
            filteredRegistrations={filteredRegistrations}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onApproveSingle={(id) => updateRegistrationStatus(id, "CONFIRMED")}
            onRejectSingle={(id) => updateRegistrationStatus(id, "REJECTED")}
            onApproveCollege={handleApproveCollege}
            onRejectCollege={handleRejectCollege}
            onCollectPayment={handleCollectPayment}
          />
        )}

        {activeTab === "editions" && (
          <AdminEditionsTab
            editions={editions}
            activeEdition={activeEdition}
            saving={saving}
            onMakeEditionActive={handleMakeEditionActive}
            onSelectEditionForEdit={() => setActiveTab("branding")}
            onOpenNewEditionModal={() => setShowNewEditionModal(true)}
          />
        )}

        {activeTab === "institution" && (
          <AdminInstitutionTab
            brandingForm={brandingForm}
            setBrandingForm={setBrandingForm}
            handleFileUpload={async (field, e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              const res = await fetch("/api/upload", { method: "POST", body: fd });
              const d = await res.json();
              if (d.url) setBrandingForm((prev: any) => ({ ...prev, [field]: d.url }));
            }}
            handleSaveBranding={handleSaveBranding}
            saving={saving}
          />
        )}

        {activeTab === "branding" && (
          <AdminBrandingTab
            brandingForm={brandingForm}
            setBrandingForm={setBrandingForm}
            activeEdition={activeEdition}
            saving={saving}
            handleFileUpload={async (field, e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              const res = await fetch("/api/upload", { method: "POST", body: fd });
              const d = await res.json();
              if (d.url) setBrandingForm((prev: any) => ({ ...prev, [field]: d.url }));
            }}
            handleSaveBranding={handleSaveBranding}
            handleToggleStageMode={handleToggleStageMode}
            onColorChange={(p, s, b) => {
              setBrandingForm((prev: any) => ({
                ...prev,
                themePrimaryAccent: p,
                themeSecondaryAccent: s,
                themeBgColor: b,
              }));
            }}
            onAddNavItem={async (label, url) => {
              const updated = [...(activeEdition?.navItems || []), { id: `nav-${Date.now()}`, label, url, order: 0, isEnabled: true }];
              setBrandingForm((prev: any) => ({ ...prev, navItems: updated }));
            }}
            onDeleteNavItem={async (id) => {
              const updated = (activeEdition?.navItems || []).filter((n: any) => n.id !== id);
              setBrandingForm((prev: any) => ({ ...prev, navItems: updated }));
            }}
            onToggleNavItem={async (id, isEnabled) => {
              const updated = (activeEdition?.navItems || []).map((n: any) => (n.id === id ? { ...n, isEnabled } : n));
              setBrandingForm((prev: any) => ({ ...prev, navItems: updated }));
            }}
            onAddScheduleItem={async (item) => {
              const updated = [...(activeEdition?.scheduleItems || []), { ...item, id: `sched-${Date.now()}`, order: 0 }];
              setBrandingForm((prev: any) => ({ ...prev, scheduleItems: updated }));
            }}
            onDeleteScheduleItem={async (id) => {
              const updated = (activeEdition?.scheduleItems || []).filter((s: any) => s.id !== id);
              setBrandingForm((prev: any) => ({ ...prev, scheduleItems: updated }));
            }}
          />
        )}

        {activeTab === "floorplan" && (
          <AdminFloorplanTab
            floorPlanUrl={brandingForm.floorPlanUrl || "/uploads/campus-floorplan.svg"}
            onChangeFloorPlanUrl={(url) => setBrandingForm((prev: any) => ({ ...prev, floorPlanUrl: url }))}
            onUploadSvg={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              const res = await fetch("/api/upload", { method: "POST", body: fd });
              const d = await res.json();
              if (d.url) setBrandingForm((prev: any) => ({ ...prev, floorPlanUrl: d.url }));
            }}
            uploading={uploadingFloorPlan}
            detectedZones={detectedZones}
            loadingZones={loadingZones}
            onScanZones={() => {}}
            graphData={graphData}
            setGraphData={setGraphData}
            onSaveGraph={handleSaveGraph}
            savingGraph={savingGraph}
            onOpenPrintableQr={() => setShowPrintableQrModal(true)}
            onOpenInteractiveModal={() => setShowInteractiveModal(true)}
          />
        )}

        {activeTab === "smtp" && (
          <AdminSmtpTab
            smtpForm={smtpForm}
            setSmtpForm={setSmtpForm}
            savingSmtp={savingSmtp}
            handleSaveSmtp={handleSaveSmtp}
            testEmailAddress={testEmailAddress}
            setTestEmailAddress={setTestEmailAddress}
            testingSmtp={testingSmtp}
            handleTestSmtp={handleTestSmtp}
            smtpTestResult={smtpTestResult}
            emailTriggers={emailTriggers}
            savingTriggerKey={savingTriggerKey}
            handleToggleTrigger={handleToggleTrigger}
            broadcastForm={broadcastForm}
            setBroadcastForm={setBroadcastForm}
            sendingBroadcast={sendingBroadcast}
            handleSendBroadcast={handleSendBroadcast}
            eventBreakdown={eventBreakdown}
            broadcastHistory={broadcastHistory}
          />
        )}

        {activeTab === "reports" && (
          <AdminReportsTab
            reportsData={reportsData}
            loadingReports={loadingReports}
            onRefreshReports={loadReports}
          />
        )}
      </div>

      {/* Global Modals */}
      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        onCheckInComplete={loadAdminData}
      />

      <PrintableQrModal
        isOpen={showPrintableQrModal}
        onClose={() => setShowPrintableQrModal(false)}
        waypoints={graphData.nodes}
        editionName={activeEdition ? `${activeEdition.name} ${activeEdition.edition}` : "SHINE 26"}
      />

      <InteractiveFloorPlanModal
        isOpen={showInteractiveModal}
        onClose={() => setShowInteractiveModal(false)}
        floorPlanUrl={brandingForm.floorPlanUrl || "/uploads/campus-floorplan.svg"}
      />

      <AdminNewEditionModal
        isOpen={showNewEditionModal}
        onClose={() => setShowNewEditionModal(false)}
        onEditionCreated={loadAdminData}
      />
    </main>
  );
}
