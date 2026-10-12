"use client";

import React from "react";
import { Utensils, CheckCircle2, Clock, Leaf, Drumstick } from "lucide-react";
import { formatDateSafe } from "@/lib/dateUtils";

interface BadgeFoodCouponProps {
  foodTokenCode: string;
  foodPreference?: "VEG" | "NON_VEG";
  foodTokenClaimed: boolean;
  foodClaimedAt?: string | null;
  foodQrData?: string | null;
  diningHallVenue?: string;
}

export default function BadgeFoodCoupon({
  foodTokenCode,
  foodPreference = "VEG",
  foodTokenClaimed,
  foodClaimedAt,
  foodQrData,
  diningHallVenue = "SGB Quadrangle Dining Hall",
}: BadgeFoodCouponProps) {
  const isVeg = foodPreference === "VEG";

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-bold text-[var(--ink)]">
            Complimentary Meal Coupon
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Veg / Non-Veg Indicator */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isVeg
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            }`}
          >
            {isVeg ? (
              <>
                <Leaf className="w-3 h-3 text-emerald-600" />
                <span>Vegetarian</span>
              </>
            ) : (
              <>
                <Drumstick className="w-3 h-3 text-amber-600" />
                <span>Non-Vegetarian</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Token QR Code */}
        {foodQrData ? (
          <div className="shrink-0 p-2 bg-white border border-[var(--border)] rounded-xl shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foodQrData}
              alt={`Food QR for ${foodTokenCode}`}
              className="w-24 h-24 object-contain rounded-md"
            />
          </div>
        ) : null}

        {/* Voucher Metadata */}
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            Token Voucher Code
          </div>
          <div className="font-mono text-base font-bold text-[var(--ink)]">
            {foodTokenCode}
          </div>

          <div className="text-xs text-[var(--ink-muted)]">
            Venue: <span className="font-medium text-[var(--ink)]">{diningHallVenue}</span>
          </div>

          {/* Claim Status */}
          <div className="pt-1">
            {foodTokenClaimed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Meal Claimed
                  {foodClaimedAt ? ` • ${formatDateSafe(foodClaimedAt, { hour: "numeric", minute: "numeric" })}` : ""}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Unclaimed • Present at Dining Hall Counter</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

