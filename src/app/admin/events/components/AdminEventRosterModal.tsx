"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, Download, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { EventItem } from "./AdminEventsTable";
import { safeJson } from "@/lib/safeFetch";

interface AdminEventRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  onDownloadCSV: (id: string, name: string) => void;
  downloading: boolean;
}

export default function AdminEventRosterModal({
  isOpen,
  onClose,
  event,
  onDownloadCSV,
  downloading,
}: AdminEventRosterModalProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !event) return;
    let isMounted = true;

    async function loadParticipants() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/events/${event?.id}/participants`);
        const data = await safeJson(res, { success: false, registrations: [] });
        if (isMounted && data.success) {
          setParticipants(data.registrations || []);
        }
      } catch (err) {
        console.error("Failed to fetch event participants:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadParticipants();
    return () => {
      isMounted = false;
    };
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b3558]/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface border border-border rounded-3xl max-w-2xl w-full p-6 shadow-modal space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <span>{event.name} — Delegate Roster</span>
            </h3>
            <p className="text-xs text-ink-muted">
              {event.venue || "Venue Unassigned"} • {event.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[8px] text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rules Collapsible or Preview */}
        {event.rules && (
          <div className="p-3 bg-surface-raised border border-border rounded-2xl text-xs space-y-1 shrink-0">
            <div className="font-bold text-ink flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <span>Rules & Constraints</span>
            </div>
            <p className="text-ink-muted whitespace-pre-wrap font-mono text-[11px] max-h-24 overflow-y-auto">
              {event.rules}
            </p>
          </div>
        )}

        {/* Participant Table */}
        <div className="flex-1 overflow-y-auto border border-border rounded-2xl">
          {loading ? (
            <div className="py-12 text-center text-xs text-ink-muted flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-accent" />
              <span>Loading delegates...</span>
            </div>
          ) : participants.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-muted">
              No registered participants found for this competition yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-raised border-b border-border text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  <th className="py-2.5 px-3">Participant</th>
                  <th className="py-2.5 px-3">College</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {participants.map((p: any) => (
                  <tr key={p.id} className="hover:bg-surface-raised/40">
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      {p.user?.name || "Student"}
                      <div className="text-[10px] text-ink-muted font-normal">
                        {p.user?.email}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted">
                      {p.delegation?.collegeName || p.user?.college || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-raised border border-border">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold ${
                          p.attended ? "text-success" : "text-ink-muted"
                        }`}
                      >
                        {p.attended ? "Present" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownloadCSV(event.id, event.name)}
            disabled={downloading}
            className="text-xs gap-1.5"
          >
            {downloading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-accent" />
            )}
            <span>Export Roster CSV</span>
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

