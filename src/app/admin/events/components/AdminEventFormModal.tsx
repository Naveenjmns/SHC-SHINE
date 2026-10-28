"use client";

import React, { useState, useEffect } from "react";
import { X, Theater, Laptop, MapPin, Clock, Trophy, GraduationCap, Users } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { CoordinatorUser, EventItem } from "./AdminEventsTable";

function toLocalDatetime(dateVal?: Date | string | null, fallback = "2026-10-15T10:00"): string {
  if (!dateVal) return fallback;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return fallback;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface AdminEventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEvent: EventItem | null;
  staffCoordinators: CoordinatorUser[];
  studentCoordinators: CoordinatorUser[];
  floorPlanZones: { id: string; label: string }[];
  centralizedPrizes: { first: string; second: string; third: string };
  onSave: (payload: any) => Promise<void>;
  saving: boolean;
}

export default function AdminEventFormModal({
  isOpen,
  onClose,
  editingEvent,
  staffCoordinators,
  studentCoordinators,
  floorPlanZones,
  centralizedPrizes,
  onSave,
  saving,
}: AdminEventFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [category, setCategory] = useState<"ON_STAGE" | "OFF_STAGE">("ON_STAGE");
  const [capacity, setCapacity] = useState("");
  const [venue, setVenue] = useState("");
  const [venueZoneId, setVenueZoneId] = useState("");
  const [dateTime, setDateTime] = useState("2026-10-15T10:00");
  const [hasPrelims, setHasPrelims] = useState(false);
  const [prelimsDateTime, setPrelimsDateTime] = useState("2026-10-15T09:00");
  const [prelimsVenue, setPrelimsVenue] = useState("");
  const [prelimsVenueZoneId, setPrelimsVenueZoneId] = useState("");
  const [prelimsRules, setPrelimsRules] = useState("");
  const [firstPrize, setFirstPrize] = useState(centralizedPrizes.first);
  const [secondPrize, setSecondPrize] = useState(centralizedPrizes.second);
  const [thirdPrize, setThirdPrize] = useState(centralizedPrizes.third);
  const [staffCoordName, setStaffCoordName] = useState("");
  const [staffCoordEmail, setStaffCoordEmail] = useState("");
  const [staffCoordPhone, setStaffCoordPhone] = useState("");
  const [studentCoordName, setStudentCoordName] = useState("");
  const [studentCoordEmail, setStudentCoordEmail] = useState("");
  const [studentCoordPhone, setStudentCoordPhone] = useState("");

  useEffect(() => {
    if (editingEvent) {
      setName(editingEvent.name || "");
      setDescription(editingEvent.description || "");
      setRules(editingEvent.rules || "");
      setCategory(editingEvent.category || "ON_STAGE");
      setCapacity(editingEvent.capacity ? String(editingEvent.capacity) : "");
      setVenue(editingEvent.venue || "");
      setVenueZoneId(editingEvent.venueZoneId || "");
      setDateTime(toLocalDatetime(editingEvent.dateTime));
      setHasPrelims(Boolean(editingEvent.hasPrelims));
      setPrelimsDateTime(toLocalDatetime(editingEvent.prelimsDateTime, "2026-10-15T09:00"));
      setPrelimsVenue(editingEvent.prelimsVenue || "");
      setPrelimsVenueZoneId(editingEvent.prelimsVenueZoneId || "");
      setPrelimsRules(editingEvent.prelimsRules || "");
      setFirstPrize(editingEvent.firstPrize || centralizedPrizes.first);
      setSecondPrize(editingEvent.secondPrize || centralizedPrizes.second);
      setThirdPrize(editingEvent.thirdPrize || centralizedPrizes.third);
      setStaffCoordName(editingEvent.staffCoordinatorName || editingEvent.staffCoordinator?.name || "");
      setStaffCoordEmail(editingEvent.staffCoordinatorEmail || editingEvent.staffCoordinator?.email || "");
      setStaffCoordPhone(editingEvent.staffCoordinatorPhone || editingEvent.staffCoordinator?.phone || "");
      setStudentCoordName(editingEvent.studentCoordinatorName || editingEvent.studentCoordinator?.name || "");
      setStudentCoordEmail(editingEvent.studentCoordinatorEmail || editingEvent.studentCoordinator?.email || "");
      setStudentCoordPhone(editingEvent.studentCoordinatorPhone || editingEvent.studentCoordinator?.phone || "");
    } else {
      setName("");
      setDescription("");
      setRules("");
      setCategory("ON_STAGE");
      setCapacity("");
      setVenue("");
      setVenueZoneId("");
      setDateTime("2026-10-15T10:00");
      setHasPrelims(false);
      setPrelimsDateTime("2026-10-15T09:00");
      setPrelimsVenue("");
      setPrelimsVenueZoneId("");
      setPrelimsRules("");
      setFirstPrize(centralizedPrizes.first);
      setSecondPrize(centralizedPrizes.second);
      setThirdPrize(centralizedPrizes.third);
      setStaffCoordName("");
      setStaffCoordEmail("");
      setStaffCoordPhone("");
      setStudentCoordName("");
      setStudentCoordEmail("");
      setStudentCoordPhone("");
    }
  }, [editingEvent, centralizedPrizes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      description,
      rules,
      category,
      capacity: capacity ? parseInt(capacity, 10) : null,
      venue,
      venueZoneId: venueZoneId || null,
      dateTime: new Date(dateTime).toISOString(),
      hasPrelims,
      prelimsDateTime: hasPrelims ? new Date(prelimsDateTime).toISOString() : null,
      prelimsVenue: hasPrelims ? prelimsVenue : null,
      prelimsVenueZoneId: hasPrelims ? (prelimsVenueZoneId || null) : null,
      prelimsRules: hasPrelims ? prelimsRules : null,
      firstPrize,
      secondPrize,
      thirdPrize,
      staffCoordinatorName: staffCoordName || null,
      staffCoordinatorEmail: staffCoordEmail || null,
      staffCoordinatorPhone: staffCoordPhone || null,
      studentCoordinatorName: studentCoordName || null,
      studentCoordinatorEmail: studentCoordEmail || null,
      studentCoordinatorPhone: studentCoordPhone || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b3558]/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface border border-border rounded-3xl max-w-3xl w-full p-6 shadow-modal max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border shrink-0">
          <div>
            <h3 className="text-base font-bold text-ink">
              {editingEvent ? `Edit Competition: ${editingEvent.name}` : "Create New Competition"}
            </h3>
            <p className="text-sm text-ink-muted">
              Configure event arena specifications, reporting venues, and coordinators.
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                Competition Name *
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. Code & Conquer"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                Category *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("ON_STAGE")}
                  className={`py-2 px-3 rounded-[8px] text-sm font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    category === "ON_STAGE"
                      ? "bg-surface-raised border-accent text-accent"
                      : "bg-surface border-border text-ink-muted"
                  }`}
                >
                  <Theater className="w-3.5 h-3.5" />
                  <span>On-Stage</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("OFF_STAGE")}
                  className={`py-2 px-3 rounded-[8px] text-sm font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    category === "OFF_STAGE"
                      ? "bg-surface-raised border-accent text-accent"
                      : "bg-surface border-border text-ink-muted"
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Off-Stage</span>
                </button>
              </div>
            </div>
          </div>

          {/* Venue, Zone, and Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                Reporting Venue
              </label>
              <Input
                type="text"
                placeholder="e.g. Main Auditorium"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                Floor Plan Zone
              </label>
              <select
                value={venueZoneId}
                onChange={(e) => setVenueZoneId(e.target.value)}
                className="w-full h-9 rounded-[8px] border border-border bg-surface text-ink px-2.5 text-sm focus:outline-none focus:border-accent"
              >
                <option value="">-- Link to Zone (Optional) --</option>
                {floorPlanZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label} ({z.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                Date & Time
              </label>
              <Input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
              />
            </div>
          </div>

          {/* Staff Coordinator */}
          <div className="p-3.5 bg-surface-raised border border-border rounded-2xl space-y-2.5">
            <div className="text-sm font-bold text-ink flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-accent" />
              <span>Staff Coordinator (Faculty Incharge)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                placeholder="Staff Full Name"
                value={staffCoordName}
                onChange={(e) => setStaffCoordName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Staff Email"
                value={staffCoordEmail}
                onChange={(e) => setStaffCoordEmail(e.target.value)}
              />
              <Input
                type="tel"
                placeholder="Staff Phone"
                value={staffCoordPhone}
                onChange={(e) => setStaffCoordPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Student Coordinator */}
          <div className="p-3.5 bg-surface-raised border border-border rounded-2xl space-y-2.5">
            <div className="text-sm font-bold text-ink flex items-center gap-1.5">
              <Users className="w-4 h-4 text-accent" />
              <span>Student Coordinator</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                placeholder="Student Full Name"
                value={studentCoordName}
                onChange={(e) => setStudentCoordName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Student Email"
                value={studentCoordEmail}
                onChange={(e) => setStudentCoordEmail(e.target.value)}
              />
              <Input
                type="tel"
                placeholder="Student Phone"
                value={studentCoordPhone}
                onChange={(e) => setStudentCoordPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Description & Rules */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                Brief Description
              </label>
              <textarea
                rows={2}
                placeholder="Short summary displayed on public cards..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-[8px] border border-border bg-surface text-ink p-2.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                Rules & Regulations
              </label>
              <textarea
                rows={3}
                placeholder="Competition guidelines and constraints..."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="w-full rounded-[8px] border border-border bg-surface text-ink p-2.5 text-sm font-mono focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border shrink-0">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              {editingEvent ? "Update Competition" : "Save Competition"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

