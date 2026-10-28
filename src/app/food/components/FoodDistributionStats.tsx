"use client";

import React from "react";
import { Leaf, Utensils, CheckCircle2, Clock } from "lucide-react";

export interface FoodStats {
  totalEligible: number;
  totalClaimed: number;
  totalRemaining: number;
  claimPercentage: number;
  veg: {
    requested: number;
    claimed: number;
    remaining: number;
  };
  nonVeg: {
    requested: number;
    claimed: number;
    remaining: number;
  };
}

export interface FoodEditionInfo {
  name?: string | null;
  edition?: string | null;
  diningHallVenue?: string | null;
  diningFacilityInfo?: string | null;
  institutionName?: string | null;
  mealOptions?: "BOTH" | "VEG_ONLY" | string;
  logoUrl?: string | null;
  institutionCrestUrl?: string | null;
}

interface FoodDistributionStatsProps {
  stats: FoodStats | null;
  edition: FoodEditionInfo | null;
}

export default function FoodDistributionStats({
  stats,
  edition,
}: FoodDistributionStatsProps) {
  const isVegOnly = edition?.mealOptions === "VEG_ONLY";
  const claimPct = stats?.claimPercentage ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Meals Progress */}
      <div className="bg-surface border border-border rounded-2xl shadow-card p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-ink-muted">
            Total Served
          </span>
          <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-surface-raised border border-border text-ink">
            {claimPct}%
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-bold text-ink tabular-nums">
            {stats?.totalClaimed ?? 0}
          </span>
          <span className="text-sm text-ink-muted">
            / {stats?.totalEligible ?? 0}
          </span>
        </div>
        <div className="mt-3 w-full bg-surface-raised rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-accent h-full rounded-full transition-all duration-300"
            style={{ width: `${claimPct}%` }}
          />
        </div>
      </div>

      {/* Vegetarian Counter */}
      <div className="bg-surface border border-border rounded-2xl shadow-card p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-ink-muted flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-success" />
            Vegetarian
          </span>
          <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-success-surface text-success-ink border border-success-border">
            {stats?.veg.remaining ?? 0} left
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-bold text-success-ink tabular-nums">
            {stats?.veg.claimed ?? 0}
          </span>
          <span className="text-sm text-ink-muted">
            of {stats?.veg.requested ?? 0}
          </span>
        </div>
        <div className="mt-3 w-full bg-surface-raised rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-success h-full rounded-full transition-all duration-300"
            style={{
              width: `${
                stats?.veg.requested
                  ? Math.min(100, Math.round((stats.veg.claimed / stats.veg.requested) * 100))
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Non-Veg Counter or Pure Veg Policy */}
      {isVegOnly ? (
        <div className="bg-surface border border-border rounded-2xl shadow-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-ink-muted flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-success" />
              Policy
            </span>
            <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-success-surface text-success-ink border border-success-border">
              Pure Veg
            </span>
          </div>
          <div className="text-lg font-semibold text-ink mt-1">
            100% Vegetarian
          </div>
          <p className="text-sm text-ink-muted mt-2">
            Host institution provides vegetarian catering for all delegates.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl shadow-card p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-ink-muted flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-warning" />
              Non-Vegetarian
            </span>
            <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-warning-surface text-warning-ink border border-warning-border">
              {stats?.nonVeg.remaining ?? 0} left
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-warning-ink tabular-nums">
              {stats?.nonVeg.claimed ?? 0}
            </span>
            <span className="text-sm text-ink-muted">
              of {stats?.nonVeg.requested ?? 0}
            </span>
          </div>
          <div className="mt-3 w-full bg-surface-raised rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-warning h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  stats?.nonVeg.requested
                    ? Math.min(100, Math.round((stats.nonVeg.claimed / stats.nonVeg.requested) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Queue Remaining */}
      <div className="bg-surface border border-border rounded-2xl shadow-card p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-ink-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-ink-muted" />
            Remaining Queue
          </span>
          <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-surface-raised border border-border text-ink">
            Pending
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-bold text-ink tabular-nums">
            {stats?.totalRemaining ?? 0}
          </span>
          <span className="text-sm text-ink-muted">delegates</span>
        </div>
        <p className="text-sm text-ink-muted mt-3 truncate">
          {isVegOnly
            ? `${stats?.totalRemaining ?? 0} Pure Veg Pending`
            : `${stats?.veg.remaining ?? 0} Veg · ${stats?.nonVeg.remaining ?? 0} Non-Veg`}
        </p>
      </div>
    </div>
  );
}

