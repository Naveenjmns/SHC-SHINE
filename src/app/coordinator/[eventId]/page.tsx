"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckInModal from "@/components/CheckInModal";
import CoordinatorScoreModal, { ScoreRegistration } from "./components/CoordinatorScoreModal";
import CoordinatorParticipantTable, { ParticipantRow } from "./components/CoordinatorParticipantTable";
import { Input, Button, Badge, Card, StatCard } from "@/components/ui";
import {
  ArrowLeft,
  Search,
  Download,
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  Theater,
  Laptop,
  MapPin,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
import { generateEventParticipantsCsv, triggerCsvDownload } from "@/lib/exportEventCsv";

export default function CoordinatorEventDeskPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.eventId;

  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [event, setEvent] = useState<any | null>(null);
  const [registrations, setRegistrations] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [scoringReg, setScoringReg] = useState<ScoreRegistration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/coordinator/events/${eventId}/registrations`);
      const data = await safeJson(res, { success: false });

      if (data.success) {
        setEvent(data.event);
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      console.error("Failed to load coordinator event data:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/coordinator/${eventId}`);
      return;
    }
    if (status === "authenticated") {
      loadData();
    }
  }, [status, eventId, router, loadData]);

  const handleToggleAttendance = async (registrationId: string, currentAttended: boolean) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/checkin/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId,
          attended: !currentAttended,
        }),
      });

      const data = await safeJson(res, { success: false });
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update attendance");
      }

      toast.success(
        !currentAttended ? "Participant checked in" : "Check-in reversed",
        "Attendance Updated"
      );
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update attendance", "Error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCsv = () => {
    if (!event) return;
    try {
      const csv = generateEventParticipantsCsv(event, registrations as any);
      triggerCsvDownload(csv, `${event.name.replace(/\s+/g, "_")}_Participants.csv`);
      toast.success("CSV file downloaded", "Export Complete");
    } catch (err: any) {
      toast.error("Failed to export CSV", "Export Error");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const checkedInCount = registrations.filter(
    (r) => r.attended || r.delegationMember?.eventCheckedIn
  ).length;
  const pendingCount = registrations.length - checkedInCount;

  const filteredParticipants = registrations.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.user.name.toLowerCase().includes(q) ||
      r.user.email.toLowerCase().includes(q) ||
      (r.delegation?.collegeName && r.delegation.collegeName.toLowerCase().includes(q)) ||
      (r.delegationMember?.badgeCode && r.delegationMember.badgeCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-28 pb-16 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <Link
              href="/coordinator"
              className="p-2 rounded-[8px] border border-border bg-surface hover:border-accent text-ink-muted hover:text-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={event?.category === "ON_STAGE" ? "confirmed" : "neutral"} size="sm">
                  {event?.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-bold text-ink truncate">{event?.name}</h1>
              </div>
              <div className="text-[15px] text-ink-muted flex items-center gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                <span>{event?.venue || "Main Auditorium"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCheckInModal(true)}
              leftIcon={<QrCode className="w-3.5 h-3.5" />}
            >
              Check-In Desk
            </Button>
          </div>
        </div>

        {/* Live Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Registered"
            value={registrations.length}
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard
            label="Present & Checked In"
            value={checkedInCount}
            delta={{
              value: `${registrations.length > 0 ? Math.round((checkedInCount / registrations.length) * 100) : 0}%`,
              isPositive: true,
              label: "attendance rate",
            }}
            icon={<CheckCircle2 className="w-4 h-4 text-success" />}
          />
          <StatCard
            label="Pending Arrival"
            value={pendingCount}
            icon={<Clock className="w-4 h-4 text-warning" />}
          />
        </div>

        {/* Search & Actions Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by name, college, or badge code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startIcon={<Search className="w-4 h-4 text-ink-subtle" />}
            />
          </div>
        </div>

        {/* Participants Table */}
        <CoordinatorParticipantTable
          participants={filteredParticipants}
          onToggleAttendance={handleToggleAttendance}
          onOpenScoreModal={(reg) => setScoringReg(reg)}
          isProcessing={isProcessing}
        />
      </main>

      {/* Desk QR Check-In Modal */}
      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => {
          setShowCheckInModal(false);
          loadData();
        }}
        defaultEventId={eventId}
      />

      {/* Score & Award Modal */}
      <CoordinatorScoreModal
        isOpen={Boolean(scoringReg)}
        onClose={() => setScoringReg(null)}
        registration={scoringReg}
        onSaved={loadData}
      />

      <Footer />
    </div>
  );
}
