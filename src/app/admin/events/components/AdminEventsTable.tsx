"use client";

import React from "react";
import {
  Theater,
  Laptop,
  MapPin,
  Clock,
  Users,
  Download,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";

export interface CoordinatorUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
  college?: string | null;
}

export interface EventItem {
  id: string;
  name: string;
  description: string | null;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  capacity: number | null;
  venue: string | null;
  venueZoneId?: string | null;
  dateTime: string;
  rules: string | null;
  hasPrelims?: boolean;
  prelimsDateTime?: string | null;
  prelimsVenue?: string | null;
  prelimsVenueZoneId?: string | null;
  prelimsRules?: string | null;
  firstPrize?: string | null;
  secondPrize?: string | null;
  thirdPrize?: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  staffCoordinatorName?: string | null;
  staffCoordinatorEmail?: string | null;
  staffCoordinatorPhone?: string | null;
  staffCoordinatorImageUrl?: string | null;
  studentCoordinatorName?: string | null;
  studentCoordinatorEmail?: string | null;
  studentCoordinatorPhone?: string | null;
  studentCoordinatorImageUrl?: string | null;
  staffCoordinator?: CoordinatorUser | null;
  studentCoordinator?: CoordinatorUser | null;
  coordinator?: CoordinatorUser | null;
  _count?: {
    registrations: number;
  };
}

interface AdminEventsTableProps {
  events: EventItem[];
  filteredEvents: EventItem[];
  onEdit: (event: EventItem) => void;
  onDelete: (id: string, name: string) => void;
  onInspectRoster: (event: EventItem) => void;
  onDownloadCSV: (id: string, name: string) => void;
  downloadingId: string | null;
}

export default function AdminEventsTable({
  events,
  filteredEvents,
  onEdit,
  onDelete,
  onInspectRoster,
  onDownloadCSV,
  downloadingId,
}: AdminEventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl shadow-card p-12 text-center">
        <p className="text-[15px] font-semibold text-ink-muted">
          No competitions created yet. Click "+ New Competition" above to add your first arena.
        </p>
      </div>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl shadow-card p-12 text-center">
        <p className="text-[15px] font-semibold text-ink-muted">
          No competitions match your current filter or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-raised text-xs font-bold text-ink-muted uppercase tracking-wider">
              <th className="py-3 px-4">Competition</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Venue & Time</th>
              <th className="py-3 px-4">Coordinators</th>
              <th className="py-3 px-4 text-center">Registrations</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredEvents.map((ev) => {
              const regCount = ev._count?.registrations ?? 0;
              const isDownloading = downloadingId === ev.id;
              const staffCoord = ev.staffCoordinatorName || ev.staffCoordinator?.name;
              const studentCoord = ev.studentCoordinatorName || ev.studentCoordinator?.name;

              return (
                <tr
                  key={ev.id}
                  className="hover:bg-surface-raised/60 transition-colors"
                >
                  {/* Event Name & Description */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[15px] text-ink">
                      {ev.name}
                    </div>
                    {ev.description && (
                      <p className="text-xs text-ink-muted line-clamp-1 max-w-xs mt-0.5">
                        {ev.description}
                      </p>
                    )}
                    {ev.hasPrelims && (
                      <span className="inline-block mt-1 text-xs font-semibold text-warning-ink bg-warning-surface border border-warning-border px-1.5 py-0.2 rounded">
                        Has Prelims
                      </span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {ev.category === "ON_STAGE" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-surface text-success-ink border border-success-border">
                        <Theater className="w-3 h-3" />
                        <span>On-Stage</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info-surface text-info-ink border border-info-border">
                        <Laptop className="w-3 h-3" />
                        <span>Off-Stage</span>
                      </span>
                    )}
                  </td>

                  {/* Venue & Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium text-ink">
                      <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>{ev.venue || "TBA"}</span>
                    </div>
                    {ev.dateTime && (
                      <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{new Date(ev.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    )}
                  </td>

                  {/* Coordinators */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 max-w-[200px]">
                      {staffCoord ? (
                        <div className="text-sm text-ink truncate" title={staffCoord}>
                          <span className="font-semibold text-xs text-ink-muted uppercase mr-1">Staff:</span>
                          {staffCoord}
                        </div>
                      ) : null}
                      {studentCoord ? (
                        <div className="text-xs text-ink-muted truncate" title={studentCoord}>
                          <span className="font-semibold text-xs text-ink-muted uppercase mr-1">Student:</span>
                          {studentCoord}
                        </div>
                      ) : null}
                      {!staffCoord && !studentCoord && (
                        <span className="text-xs text-ink-muted italic">Unassigned</span>
                      )}
                    </div>
                  </td>

                  {/* Registrations Count */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-raised border border-border font-bold text-sm text-ink">
                      <Users className="w-3 h-3 text-accent" />
                      <span>{regCount}</span>
                      {ev.capacity && <span className="text-ink-muted">/{ev.capacity}</span>}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onInspectRoster(ev)}
                        title="View registered delegates"
                        className="h-8 px-2 text-sm gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Roster</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadCSV(ev.id, ev.name)}
                        disabled={isDownloading}
                        title="Download CSV Roster"
                        className="h-8 px-2 text-sm"
                      >
                        {isDownloading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-accent" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(ev)}
                        title="Edit arena"
                        className="h-8 px-2 text-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(ev.id, ev.name)}
                        title="Delete arena"
                        className="h-8 px-2 text-sm hover:text-danger"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-danger" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

