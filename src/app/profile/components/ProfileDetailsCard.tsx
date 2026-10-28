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
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-card space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            <span>Personal Information</span>
          </h3>
          <p className="text-sm text-ink-muted">
            Manage your personal profile details and meal preference.
          </p>
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        {/* Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">
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
            <label className="block text-sm font-semibold text-ink mb-1">
              Email Address
            </label>
            <Input
              disabled
              value={email}
              className="opacity-70 bg-surface-raised cursor-not-allowed"
            />
            <span className="text-xs text-ink-muted">
              Account email cannot be modified directly.
            </span>
          </div>
        </div>

        {/* Phone & College */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">
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
            <label className="block text-sm font-semibold text-ink mb-1">
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
          <label className="block text-sm font-semibold text-ink mb-1.5 flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-accent" />
            <span>Festival Meal Preference</span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-w-sm">
            <button
              type="button"
              onClick={() => setFoodPreference("VEG")}
              disabled={foodPreferenceLocked}
              className={`py-2 px-3 rounded-[8px] text-sm font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                foodPreference === "VEG"
                  ? "bg-success-surface border-success-border text-success-ink"
                  : "bg-surface border-border text-ink-muted hover:text-ink"
              }`}
            >
              <Leaf className="w-3.5 h-3.5 text-success" />
              <span>Vegetarian</span>
            </button>

            <button
              type="button"
              onClick={() => setFoodPreference("NON_VEG")}
              disabled={foodPreferenceLocked}
              className={`py-2 px-3 rounded-[8px] text-sm font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                foodPreference === "NON_VEG"
                  ? "bg-warning-surface border-warning-border text-warning-ink"
                  : "bg-surface border-border text-ink-muted hover:text-ink"
              }`}
            >
              <Drumstick className="w-3.5 h-3.5 text-warning" />
              <span>Non-Vegetarian</span>
            </button>
          </div>
          {foodPreferenceLocked && (
            <p className="mt-1.5 text-xs text-ink-muted">
              Your meal preference is fixed after registration. Contact the food desk to change it.
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="primary" size="sm" type="submit" loading={saving}>
            Save Profile Details
          </Button>
        </div>
      </form>
    </div>
  );
}

