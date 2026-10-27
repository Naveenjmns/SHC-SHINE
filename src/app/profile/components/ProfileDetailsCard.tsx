"use client";

import React from "react";
import { User, Mail, Phone, Building2, Utensils, Leaf, Drumstick } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface ProfileDetailsCardProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  phone: string;
  setPhone: (v: string) => void;
  college: string;
  setCollege: (v: string) => void;
  foodPreference: "VEG" | "NON_VEG";
  setFoodPreference: (v: "VEG" | "NON_VEG") => void;
  foodPreferenceLocked?: boolean;
  onSave: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
}

export default function ProfileDetailsCard({
  name,
  setName,
  email,
  phone,
  setPhone,
  college,
  setCollege,
  foodPreference,
  setFoodPreference,
  foodPreferenceLocked = false,
  onSave,
  saving,
}: ProfileDetailsCardProps) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--accent)]" />
            <span>Personal Information</span>
          </h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Manage your personal profile details and meal preference.
          </p>
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Full Name *
            </label>
            <Input
              required
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Email Address
            </label>
            <Input
              disabled
              value={email}
              className="opacity-70 bg-[var(--surface-raised)] cursor-not-allowed"
            />
            <span className="text-[10px] text-[var(--ink-muted)]">
              Account email cannot be modified directly.
            </span>
          </div>
        </div>

        {/* Phone & College */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Mobile Number
            </label>
            <Input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Institution / College
            </label>
            <Input
              placeholder="e.g. Your College Name"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
            />
          </div>
        </div>

        {/* Meal Preference Toggle */}
        <div>
          <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5 flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Festival Meal Preference</span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-w-sm">
            <button
              type="button"
              onClick={() => setFoodPreference("VEG")}
              disabled={foodPreferenceLocked}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                foodPreference === "VEG"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs"
                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vegetarian</span>
            </button>

            <button
              type="button"
              onClick={() => setFoodPreference("NON_VEG")}
              disabled={foodPreferenceLocked}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                foodPreference === "NON_VEG"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 shadow-xs"
                  : "bg-[var(--surface)] border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Drumstick className="w-3.5 h-3.5 text-amber-600" />
              <span>Non-Vegetarian</span>
            </button>
          </div>
          {foodPreferenceLocked && (
            <p className="mt-1.5 text-[11px] text-[var(--ink-muted)]">
              Your meal preference is fixed after registration. Contact the food desk to change it.
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2 border-t border-[var(--border)]">
          <Button variant="primary" size="sm" type="submit" loading={saving}>
            Save Profile Details
          </Button>
        </div>
      </form>
    </div>
  );
}

