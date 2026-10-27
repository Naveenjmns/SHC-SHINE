"use client";

import React, { useState } from "react";
import { History, Search, RotateCcw, Leaf, Utensils, User } from "lucide-react";
import { Input, Button } from "@/components/ui";

export interface RecentClaim {
  id: string;
  name: string;
  collegeName: string;
  foodPreference: "VEG" | "NON_VEG";
  foodClaimedAt: string | null;
  foodClaimedBy: string | null;
  foodTokenCode: string;
  badgeCode: string;
}

interface FoodRecentHistoryProps {
  claims: RecentClaim[];
  onUndoClaim: (code: string) => void;
  actionLoading: boolean;
}

export default function FoodRecentHistory({
  claims,
  onUndoClaim,
  actionLoading,
}: FoodRecentHistoryProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredClaims = claims.filter((claim) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      claim.name.toLowerCase().includes(q) ||
      claim.foodTokenCode.toLowerCase().includes(q) ||
      claim.collegeName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-card p-5 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-ink">
            Recent Meal Distributions
          </h3>
        </div>
        <span className="text-xs text-ink-muted">
          {claims.length} logged
        </span>
      </div>

      {claims.length > 5 && (
        <div className="mb-3">
          <Input
            placeholder="Search recent claims..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="text-xs h-8"
          />
        </div>
      )}

      {filteredClaims.length === 0 ? (
        <div className="py-8 text-center text-xs text-ink-muted">
          {claims.length === 0
            ? "No meals distributed yet today."
            : "No claims match your search filter."}
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
          {filteredClaims.map((claim) => {
            const isVeg = claim.foodPreference === "VEG";
            return (
              <div
                key={claim.id}
                className="p-3 rounded-xl border border-border bg-surface-raised flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-md mt-0.5 shrink-0 ${
                      isVeg
                        ? "bg-success-surface text-success"
                        : "bg-warning-surface text-warning"
                    }`}
                  >
                    {isVeg ? (
                      <Leaf className="w-3.5 h-3.5" />
                    ) : (
                      <Utensils className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">
                      {claim.name}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">
                      {claim.collegeName} · <span className="font-mono">{claim.foodTokenCode}</span>
                    </p>
                    {claim.foodClaimedAt && (
                      <p className="text-[10px] text-ink-muted mt-0.5">
                        {new Date(claim.foodClaimedAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  loading={actionLoading}
                  onClick={() => onUndoClaim(claim.foodTokenCode)}
                  title="Undo claim"
                  className="text-danger hover:bg-danger-surface text-[11px] h-7 px-2 shrink-0"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Undo
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

