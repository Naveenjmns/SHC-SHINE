"use client";

import React from "react";
import { Plus, CheckCircle2, MapPin, Layers } from "lucide-react";
import { Button } from "@/components/ui";

export interface EventEditionItem {
  id: string;
  name: string;
  edition: string;
  slug: string;
  tagline: string | null;
  venue: string | null;
  startDate: string;
  isActive: boolean;
  logoUrl?: string | null;
  _count?: { events: number };
  [key: string]: any;
}

interface AdminEditionsTabProps {
  editions: EventEditionItem[];
  activeEdition: EventEditionItem | null;
  saving: boolean;
  onMakeEditionActive: (id: string) => void;
  onSelectEditionForEdit: (ed: EventEditionItem) => void;
  onOpenNewEditionModal: () => void;
}

export default function AdminEditionsTab({
  editions,
  activeEdition,
  saving,
  onMakeEditionActive,
  onSelectEditionForEdit,
  onOpenNewEditionModal,
}: AdminEditionsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-ink">
            Event Editions Architecture
          </h2>
          <p className="text-sm text-ink-muted">
            Manage annual editions (e.g. TechFest 2027, TechFest 2028). Only 1 edition serves live traffic.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewEditionModal}
          className="self-start sm:self-auto gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Edition</span>
        </Button>
      </div>

      {/* Editions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {editions.map((ed) => (
          <div
            key={ed.id}
            className={`bg-surface border rounded-2xl shadow-card p-5 relative transition-all ${
              ed.isActive
                ? "border-accent ring-1 ring-accent/30"
                : "border-border"
            }`}
          >
            {ed.isActive && (
              <span className="absolute top-4 right-4 bg-accent text-accent-ink text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full">
                Active
              </span>
            )}

            <div className="flex items-center gap-3 mb-3">
              {ed.logoUrl ? (
                <img
                  src={ed.logoUrl}
                  alt={ed.name}
                  className="h-10 w-auto max-w-[44px] object-contain shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-[8px] bg-surface-raised border border-border flex items-center justify-center font-bold text-[15px] text-accent shrink-0">
                  {(ed.name?.charAt(0) || "S").toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-ink">
                  {ed.name} {ed.edition}
                </h3>
                <span className="text-sm text-ink-muted font-mono">
                  Slug: {ed.slug}
                </span>
              </div>
            </div>

            {ed.tagline && (
              <p className="text-sm text-ink-muted italic mb-4 font-medium">
                "{ed.tagline}"
              </p>
            )}

            <div className="space-y-1.5 text-sm text-ink-muted mb-5">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                <span>Venue: {ed.venue || "College Campus"}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                <span>Competitions: {ed._count?.events || 0} events</span>
              </p>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
              {!ed.isActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMakeEditionActive(ed.id)}
                  loading={saving}
                  className="text-sm"
                >
                  Set as Active
                </Button>
              ) : (
                <span className="text-sm text-success-ink font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Serving Live
                </span>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectEditionForEdit(ed)}
                className="text-sm text-ink-muted hover:text-ink"
              >
                Configure →
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

