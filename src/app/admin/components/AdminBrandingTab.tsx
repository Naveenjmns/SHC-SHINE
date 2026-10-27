"use client";

import React from "react";
import {
  Palette,
  Sparkles,
  Trophy,
  Users,
  Lock,
  Unlock,
  Upload,
  Check,
  FileText,
} from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import AdminThemePresetsCard from "./AdminThemePresetsCard";
import AdminNavItemsEditor, { NavItemData } from "./AdminNavItemsEditor";
import AdminScheduleManager, { ScheduleItemData } from "./AdminScheduleManager";

interface AdminBrandingTabProps {
  brandingForm: any;
  setBrandingForm: React.Dispatch<React.SetStateAction<any>>;
  activeEdition: any;
  saving: boolean;
  handleFileUpload: (field: string, e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSaveBranding: () => Promise<void>;
  handleToggleStageMode: (enabled: boolean) => Promise<void>;
  onColorChange: (primary: string, secondary: string, bg: string) => void;
  onAddNavItem: (label: string, url: string) => Promise<void>;
  onDeleteNavItem: (id: string) => Promise<void>;
  onToggleNavItem: (id: string, isEnabled: boolean) => Promise<void>;
  onAddScheduleItem: (item: any) => Promise<void>;
  onDeleteScheduleItem: (id: string) => Promise<void>;
}

export default function AdminBrandingTab({
  brandingForm,
  setBrandingForm,
  activeEdition,
  saving,
  handleFileUpload,
  handleSaveBranding,
  handleToggleStageMode,
  onColorChange,
  onAddNavItem,
  onDeleteNavItem,
  onToggleNavItem,
  onAddScheduleItem,
  onDeleteScheduleItem,
}: AdminBrandingTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
            <Palette className="w-5 h-5 text-accent" />
            <span>Branding &amp; Content Management</span>
          </h2>
          <p className="text-xs text-ink-muted">
            Configure fest hero copy, event logo, rules, awards, and theme colors dynamically.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveBranding}
          loading={saving}
          className="self-start sm:self-auto"
        >
          <Check className="w-4 h-4 mr-1.5" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Identity & Theme */}
        <div className="space-y-6">
          {/* Event Identity */}
          <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-4">
            <h3 className="text-xs font-semibold text-ink pb-2 border-b border-border">
              1. Fest Edition Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">
                  Fest Name
                </label>
                <Input
                  value={brandingForm.name}
                  onChange={(e) => setBrandingForm({ ...brandingForm, name: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">
                  Edition
                </label>
                <Input
                  value={brandingForm.edition}
                  onChange={(e) => setBrandingForm({ ...brandingForm, edition: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Fest Tagline
              </label>
              <Input
                value={brandingForm.tagline}
                onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                placeholder="Where Ideas Begin to Shine"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">
                  Prize Pool Text
                </label>
                <Input
                  value={brandingForm.prizePool}
                  onChange={(e) => setBrandingForm({ ...brandingForm, prizePool: e.target.value })}
                  placeholder="₹25K+"
                  className="text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">
                  Expected Delegates
                </label>
                <Input
                  value={brandingForm.expectedDelegates}
                  onChange={(e) => setBrandingForm({ ...brandingForm, expectedDelegates: e.target.value })}
                  placeholder="500+"
                  className="text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Delegate Registration Fee (₹)
              </label>
              <Input
                type="number"
                min={0}
                value={brandingForm.participantFee}
                onChange={(e) => setBrandingForm({ ...brandingForm, participantFee: parseFloat(e.target.value) || 0 })}
                className="text-xs"
              />
            </div>

            {/* Event Logo */}
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Fest Logo
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-[8px] text-xs font-semibold hover:bg-surface-raised transition bg-surface">
                  <Upload className="w-3.5 h-3.5 text-accent" />
                  <span>Upload Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload("logoUrl", e)}
                  />
                </label>
                <span className="text-xs text-ink-muted">or specify path:</span>
              </div>
              <Input
                value={brandingForm.logoUrl}
                onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                placeholder="/uploads/logo.png"
                className="mt-2 text-xs font-mono"
              />
            </div>
          </div>

          {/* Theme Presets */}
          <AdminThemePresetsCard
            primaryAccent={brandingForm.themePrimaryAccent}
            secondaryAccent={brandingForm.themeSecondaryAccent}
            bgColor={brandingForm.themeBgColor}
            onChangeColor={onColorChange}
          />

          {/* Navigation Links */}
          <AdminNavItemsEditor
            navItems={activeEdition.navItems || []}
            onAddNavItem={onAddNavItem}
            onDeleteNavItem={onDeleteNavItem}
            onToggleNavItem={onToggleNavItem}
          />
        </div>

        {/* Right Column: Rules, Stage Mode & Timeline */}
        <div className="space-y-6">
          {/* Stage Mode in Student Portal Toggle */}
          <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-xs font-semibold text-ink flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                <span>Student Portal Stage Mode (Podium Results)</span>
              </h3>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  brandingForm.showStageModeInStudentPortal
                    ? "bg-success-surface text-success-ink"
                    : "bg-surface-raised text-ink-muted"
                }`}
              >
                {brandingForm.showStageModeInStudentPortal ? "Published" : "Hidden"}
              </span>
            </div>

            <p className="text-xs text-ink-muted">
              Controls whether delegates see live winner podiums and final rankings in their dashboard.
            </p>

            <Button
              variant={brandingForm.showStageModeInStudentPortal ? "outline" : "primary"}
              size="sm"
              onClick={() => handleToggleStageMode(!brandingForm.showStageModeInStudentPortal)}
              loading={saving}
              className="w-full text-xs"
            >
              {brandingForm.showStageModeInStudentPortal
                ? "Hide Stage Mode from Students"
                : "Publish Stage Mode to Students"}
            </Button>
          </div>

          {/* Rules and Guidelines */}
          <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-4">
            <h3 className="text-xs font-semibold text-ink pb-2 border-b border-border flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span>Symposium Guidelines &amp; Rules Cards</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Card 1: Eligibility Title
              </label>
              <Input
                value={brandingForm.rulesEligibilityTitle}
                onChange={(e) => setBrandingForm({ ...brandingForm, rulesEligibilityTitle: e.target.value })}
                className="text-xs mb-1.5"
              />
              <Textarea
                rows={2}
                value={brandingForm.rulesEligibilityText}
                onChange={(e) => setBrandingForm({ ...brandingForm, rulesEligibilityText: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Card 2: Reporting &amp; Timings Title
              </label>
              <Input
                value={brandingForm.rulesTimingsTitle}
                onChange={(e) => setBrandingForm({ ...brandingForm, rulesTimingsTitle: e.target.value })}
                className="text-xs mb-1.5"
              />
              <Textarea
                rows={2}
                value={brandingForm.rulesTimingsText}
                onChange={(e) => setBrandingForm({ ...brandingForm, rulesTimingsText: e.target.value })}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Card 3: Championship Title
              </label>
              <Input
                value={brandingForm.rulesChampionshipTitle}
                onChange={(e) => setBrandingForm({ ...brandingForm, rulesChampionshipTitle: e.target.value })}
                className="text-xs mb-1.5"
              />
              <Textarea
                rows={2}
                value={brandingForm.rulesChampionshipText}
                onChange={(e) => setBrandingForm({ ...brandingForm, rulesChampionshipText: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          {/* Schedule Manager */}
          <AdminScheduleManager
            scheduleItems={activeEdition.scheduleItems || []}
            onAddScheduleItem={onAddScheduleItem}
            onDeleteScheduleItem={onDeleteScheduleItem}
          />
        </div>
      </div>
    </div>
  );
}

