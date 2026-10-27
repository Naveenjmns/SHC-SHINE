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
    <div className="bg-surface border border-border rounded-2xl shadow-card p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-bold text-ink">
            Complimentary Meal Coupon
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Veg / Non-Veg Indicator */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isVeg
                ? "bg-success-surface text-success-ink border border-success-border"
                : "bg-warning-surface text-warning-ink border border-warning-border"
            }`}
          >
            {isVeg ? (
              <>
                <Leaf className="w-3 h-3 text-success" />
                <span>Vegetarian</span>
              </>
            ) : (
              <>
                <Drumstick className="w-3 h-3 text-warning" />
                <span>Non-Vegetarian</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Token QR Code */}
        {foodQrData ? (
          <div className="shrink-0 p-2 bg-white border border-border rounded-2xl">
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
          <div className="text-xs font-medium text-ink-muted">
            Token Voucher Code
          </div>
          <div className="font-mono text-lg font-bold text-ink tabular-nums">
            {foodTokenCode}
          </div>

          <div className="text-xs text-ink-muted">
            Venue: <span className="font-medium text-ink">{diningHallVenue}</span>
          </div>

          {/* Claim Status */}
          <div className="pt-1">
            {foodTokenClaimed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-surface text-success-ink border border-success-border text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Meal Claimed
                  {foodClaimedAt ? ` • ${formatDateSafe(foodClaimedAt, { hour: "numeric", minute: "numeric" })}` : ""}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-surface text-warning-ink border border-warning-border text-xs font-semibold">
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

