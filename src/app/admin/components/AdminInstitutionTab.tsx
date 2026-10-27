"use client";

import React from "react";
import {
  Building2,
  Laptop,
  Phone,
  Utensils,
  Leaf,
  Upload,
  Check,
} from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";

interface AdminInstitutionTabProps {
  brandingForm: any;
  setBrandingForm: React.Dispatch<React.SetStateAction<any>>;
  handleFileUpload: (field: string, e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSaveBranding: () => Promise<void>;
  saving: boolean;
}

export default function AdminInstitutionTab({
  brandingForm,
  setBrandingForm,
  handleFileUpload,
  handleSaveBranding,
  saving,
}: AdminInstitutionTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--ink)] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--accent)]" />
            <span>Institution &amp; Department Setup</span>
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Configure the hosting college, department profile, and catering policies.
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
          Save Institution Profile
        </Button>
      </div>

      <div className="space-y-6">
        {/* 1. Institution Identity Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[var(--accent)]" />
              <span>1. Institution Identity &amp; Accreditations</span>
            </h3>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--ink-muted)]">
              College Profile
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">
              Full Institution Name *
            </label>
            <Input
              value={brandingForm.institutionName}
              onChange={(e) => setBrandingForm({ ...brandingForm, institutionName: e.target.value })}
              placeholder="e.g. Example College of Arts & Science"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">
                Short Name / Acronym
              </label>
              <Input
                value={brandingForm.institutionShortName}
                onChange={(e) => setBrandingForm({ ...brandingForm, institutionShortName: e.target.value })}
                placeholder="e.g. ECAS"
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">
                Campus Location
              </label>
              <Input
                value={brandingForm.institutionLocation}
                onChange={(e) => setBrandingForm({ ...brandingForm, institutionLocation: e.target.value })}
                placeholder="e.g. City — PIN code, State"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">
              Accreditation &amp; University Affiliation
            </label>
            <Textarea
              rows={2}
              value={brandingForm.accreditationText}
              onChange={(e) => setBrandingForm({ ...brandingForm, accreditationText: e.target.value })}
              placeholder="e.g. Accredited with 'A' Grade, Affiliated to Example University"
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">
              Institution Crest / Official Logo
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-[var(--surface-raised)] transition bg-[var(--surface)]">
                <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Upload Crest</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload("institutionCrestUrl", e)}
                />
              </label>
              <span className="text-xs text-[var(--ink-muted)]">or specify path:</span>
            </div>
            <Input
              value={brandingForm.institutionCrestUrl}
              onChange={(e) => setBrandingForm({ ...brandingForm, institutionCrestUrl: e.target.value })}
              placeholder="/uploads/crest.png or https://..."
              className="mt-2 text-xs font-mono"
            />
            {brandingForm.institutionCrestUrl && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-[var(--surface-raised)] rounded-lg border border-[var(--border)]">
                <img src={brandingForm.institutionCrestUrl} alt="Crest Preview" className="h-8 w-auto object-contain" />
                <span className="text-xs text-[var(--ink-muted)] font-medium">Crest Preview</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">
              About Institution (Landing Page Overview)
            </label>
            <Textarea
              rows={2}
              value={brandingForm.institutionAbout}
              onChange={(e) => setBrandingForm({ ...brandingForm, institutionAbout: e.target.value })}
              placeholder="Describe college heritage, campus, and academic distinction..."
              className="text-xs"
            />
          </div>
        </div>

        {/* 2. Department Identity Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[var(--accent)]" />
              <span>2. Host Department &amp; Program</span>
            </h3>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--ink-muted)]">
              Department Profile
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">
                Host Department Name *
              </label>
              <Input
                value={brandingForm.hostDepartment}
                onChange={(e) => setBrandingForm({ ...brandingForm, hostDepartment: e.target.value })}
                placeholder="e.g. Department of Physics"
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">
                Degree / Program
              </label>
              <Input
                value={brandingForm.departmentProgram}
                onChange={(e) => setBrandingForm({ ...brandingForm, departmentProgram: e.target.value })}
                placeholder="e.g. Postgraduate Program"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">
              Department Logo / Seal
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-[var(--surface-raised)] transition bg-[var(--surface)]">
                <Upload className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload("deptLogoUrl", e)}
                />
              </label>
              <span className="text-xs text-[var(--ink-muted)]">or specify path:</span>
            </div>
            <Input
              value={brandingForm.deptLogoUrl}
              onChange={(e) => setBrandingForm({ ...brandingForm, deptLogoUrl: e.target.value })}
              placeholder="/uploads/dept-logo.png"
              className="mt-2 text-xs font-mono"
            />
            {brandingForm.deptLogoUrl && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-[var(--surface-raised)] rounded-lg border border-[var(--border)]">
                <img src={brandingForm.deptLogoUrl} alt="Dept Logo Preview" className="h-8 w-auto object-contain" />
                <span className="text-xs text-[var(--ink-muted)] font-medium">Department Logo Preview</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Contact & Venue */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[var(--accent)]" />
              <span>3. Contact &amp; Campus Venue</span>
            </h3>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--ink-muted)]">
              Contact &amp; Dining
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">Contact Email</label>
              <Input
                type="email"
                value={brandingForm.contactEmail}
                onChange={(e) => setBrandingForm({ ...brandingForm, contactEmail: e.target.value })}
                placeholder="fest@college.edu"
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">Contact Phone</label>
              <Input
                value={brandingForm.contactPhone}
                onChange={(e) => setBrandingForm({ ...brandingForm, contactPhone: e.target.value })}
                placeholder="+91 9876543210"
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">Campus Venue</label>
              <Input
                value={brandingForm.venue}
                onChange={(e) => setBrandingForm({ ...brandingForm, venue: e.target.value })}
                placeholder="e.g. Main Auditorium"
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">Dining Hall Venue</label>
              <Input
                value={brandingForm.diningHallVenue}
                onChange={(e) => setBrandingForm({ ...brandingForm, diningHallVenue: e.target.value })}
                placeholder="e.g. Main Dining Hall"
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">Campus latitude</label>
              <Input
                type="number"
                step="any"
                min={-90}
                max={90}
                value={brandingForm.campusLatitude ?? ""}
                onChange={(e) => setBrandingForm({ ...brandingForm, campusLatitude: e.target.value })}
                placeholder="e.g. 12.9716"
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink-muted)] mb-1">Campus longitude</label>
              <Input
                type="number"
                step="any"
                min={-180}
                max={180}
                value={brandingForm.campusLongitude ?? ""}
                onChange={(e) => setBrandingForm({ ...brandingForm, campusLongitude: e.target.value })}
                placeholder="e.g. 77.5946"
                className="text-xs font-mono"
              />
            </div>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] -mt-2">
            Used for the floor plan&apos;s &quot;distance to campus&quot; check. Leave empty to disable.
          </p>

          {/* Catering Policy */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-[var(--ink)]">
              Institution Catering Policy *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBrandingForm({ ...brandingForm, mealOptions: "BOTH" })}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  (brandingForm.mealOptions || "BOTH") === "BOTH"
                    ? "bg-[var(--accent)]/10 border-[var(--accent)]"
                    : "bg-[var(--surface-raised)] border-[var(--border)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-xs font-semibold text-[var(--ink)]">
                    Vegetarian &amp; Non-Vegetarian (Both)
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Delegates choose dietary preference on registration.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBrandingForm({ ...brandingForm, mealOptions: "VEG_ONLY" })}
                className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  brandingForm.mealOptions === "VEG_ONLY"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500"
                    : "bg-[var(--surface-raised)] border-[var(--border)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-[var(--ink)]">
                    100% Pure Vegetarian Only
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  All meals provided are strictly vegetarian.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

