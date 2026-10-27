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
import { DEFAULT_EDITION_CONFIG, festTitle } from "@/lib/editionDefaults";
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
  } = useAdminData();

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showPrintableQrModal, setShowPrintableQrModal] = useState(false);
  const [showInteractiveModal, setShowInteractiveModal] = useState(false);
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
      <div className="min-h-screen bg-[var(--surface-raised)] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <p className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
            Loading Admin Console...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface-raised)] flex flex-col">
      <AdminHeader
        festName={activeEdition?.name || DEFAULT_EDITION_CONFIG.name}
        editionNumber={activeEdition?.edition || ""}
        onOpenCheckIn={() => setShowCheckInModal(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[var(--border)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === "reports" && !reportsData) {
                    loadReports();
                  }
                }}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--surface)] text-[var(--accent)] border border-[var(--border)] shadow-xs"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--ink)]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Editing a non-live edition via "Configure" */}
        {editingEdition && activeEdition && editingEdition.id !== activeEdition.id &&
          (activeTab === "branding" || activeTab === "institution" || activeTab === "floorplan") && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs">
              <span className="text-[var(--ink)]">
                Editing <strong>{editingEdition.name} {editingEdition.edition}</strong>, which is not the live edition.
              </span>
              <button
                type="button"
                onClick={() => selectEditionForEdit(activeEdition)}
                className="font-semibold text-[var(--accent)] hover:underline cursor-pointer"
              >
                Back to live edition
              </button>
            </div>
          )}

        {/* Tab Views */}
        {activeTab === "overview" && stats && (
          <AdminOverviewTab
            stats={stats}
            eventBreakdown={eventBreakdown}
            activeEdition={activeEdition}
            saving={saving}
            onToggleRegistration={handleToggleRegistration}
            onOpenCheckIn={() => setShowCheckInModal(true)}
            onOpenResetModal={handleResetData}
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
            onSelectEditionForEdit={(ed) => {
              selectEditionForEdit(ed);
              setActiveTab("branding");
            }}
            onOpenNewEditionModal={() => setShowNewEditionModal(true)}
          />
        )}

        {activeTab === "institution" && (
          <AdminInstitutionTab
            brandingForm={brandingForm}
            setBrandingForm={setBrandingForm}
            handleFileUpload={handleUploadField}
            handleSaveBranding={handleSaveBranding}
            saving={saving}
          />
        )}

        {activeTab === "branding" && (
          <AdminBrandingTab
            brandingForm={brandingForm}
            setBrandingForm={setBrandingForm}
            activeEdition={editingEdition}
            saving={saving}
            handleFileUpload={handleUploadField}
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
            onAddNavItem={handleAddNavItem}
            onDeleteNavItem={handleDeleteNavItem}
            onToggleNavItem={handleToggleNavItem}
            onAddScheduleItem={handleAddScheduleItem}
            onDeleteScheduleItem={handleDeleteScheduleItem}
          />
        )}

        {activeTab === "floorplan" && (
          <AdminFloorplanTab
            floorPlanUrl={brandingForm.floorPlanUrl || "/uploads/campus-floorplan.svg"}
            onChangeFloorPlanUrl={(url) => setBrandingForm((prev: any) => ({ ...prev, floorPlanUrl: url }))}
            onUploadSvg={handleUploadFloorPlan}
            uploading={uploadingFloorPlan}
            detectedZones={detectedZones}
            loadingZones={loadingZones}
            onScanZones={handleScanZones}
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
        editionName={activeEdition ? festTitle(activeEdition) : undefined}
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
