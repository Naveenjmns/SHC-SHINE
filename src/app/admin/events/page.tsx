"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Download,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
import { downloadEventParticipantsCSV } from "@/lib/exportEventCsv";
import AdminEventsTable, { CoordinatorUser, EventItem } from "./components/AdminEventsTable";
import AdminEventFormModal from "./components/AdminEventFormModal";
import AdminEventRosterModal from "./components/AdminEventRosterModal";

export default function AdminEventsPage() {
  const { toast, confirmAction } = useToast();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [staffCoordinators, setStaffCoordinators] = useState<CoordinatorUser[]>([]);
  const [studentCoordinators, setStudentCoordinators] = useState<CoordinatorUser[]>([]);
  const [floorPlanZones, setFloorPlanZones] = useState<{ id: string; label: string }[]>([]);
  const [centralizedPrizes, setCentralizedPrizes] = useState({
    first: "Cash Prize + Trophy + Certificate",
    second: "Cash Prize + Merit Certificate",
    third: "Distinction Certificate",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "ON_STAGE" | "OFF_STAGE">("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [rosterModalEvent, setRosterModalEvent] = useState<EventItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, coordsRes, zonesRes, edRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/admin/users?role=COORDINATOR"),
        fetch("/api/admin/floorplan/zones"),
        fetch("/api/admin/edition"),
      ]);

      const [eventsData, coordsData, zonesData, edData] = await Promise.all([
        safeJson(eventsRes, { success: false, events: [] }),
        safeJson(coordsRes, { success: false, users: [] }),
        safeJson(zonesRes, { success: false, zones: [] }),
        safeJson(edRes, { success: false }),
      ]);

      if (eventsData.success) setEvents(eventsData.events || []);
      if (coordsData.success && coordsData.users) {
        setStaffCoordinators(coordsData.users.filter((u: any) => u.email?.endsWith("@shctpt.edu") || u.role === "COORDINATOR"));
        setStudentCoordinators(coordsData.users);
      }
      if (zonesData.success && zonesData.zones) setFloorPlanZones(zonesData.zones);
      if (edData.success && edData.edition) {
        setCentralizedPrizes({
          first: edData.edition.defaultFirstPrize || "Cash Prize + Trophy + Certificate",
          second: edData.edition.defaultSecondPrize || "Cash Prize + Merit Certificate",
          third: edData.edition.defaultThirdPrize || "Distinction Certificate",
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesCategory =
        categoryFilter === "ALL" || ev.category === categoryFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        ev.name.toLowerCase().includes(q) ||
        (ev.venue && ev.venue.toLowerCase().includes(q)) ||
        (ev.description && ev.description.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [events, categoryFilter, search]);

  const handleSave = async (payload: any) => {
    setSaving(true);
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);

      if (res.ok && data.success) {
        toast.success(editingEvent ? "Competition updated." : "Competition created.");
        setFormModalOpen(false);
        setEditingEvent(null);
        loadData();
      } else {
        toast.error(data.message || "Failed to save competition.");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error saving competition.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmAction({
      title: "Delete Competition?",
      message: `Are you sure you want to delete "${name}"? All associated registrations and scores will be removed.`,
      confirmText: "Delete Competition",
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const data = await safeJson(res);
      if (res.ok && data.success) {
        toast.success("Competition deleted.");
        loadData();
      } else {
        toast.error(data.message || "Failed to delete competition.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting competition.");
    }
  };

  const handleDownloadCSV = async (id: string, name: string) => {
    setDownloadingId(id);
    try {
      await downloadEventParticipantsCSV({ eventId: id, eventName: name });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingId("ALL");
    try {
      for (const ev of events) {
        await downloadEventParticipantsCSV({ eventId: ev.id, eventName: ev.name });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-canvas flex flex-col">
      {/* Sticky Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-semibold text-sm text-ink-muted hover:text-ink flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </Link>
            <span className="text-border">/</span>
            <span className="text-sm font-semibold text-ink">
              Arenas & Competitions ({events.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              disabled={downloadingId === "ALL"}
              className="text-sm gap-1.5 hidden sm:inline-flex"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Export All CSVs</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingEvent(null);
                setFormModalOpen(true);
              }}
              className="text-sm gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Competition</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-5">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-[8px]">
            {(["ALL", "ON_STAGE", "OFF_STAGE"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-[8px] text-sm font-semibold transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-surface-raised text-accent"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {cat === "ALL" ? "All Arenas" : cat === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search competitions, venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-[8px] border border-border bg-surface text-sm text-ink focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        {/* Competitions Table */}
        {loading ? (
          <div className="py-20 text-center text-sm text-ink-muted flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            <span>Loading fest competitions...</span>
          </div>
        ) : (
          <AdminEventsTable
            events={events}
            filteredEvents={filteredEvents}
            onEdit={(ev) => {
              setEditingEvent(ev);
              setFormModalOpen(true);
            }}
            onDelete={handleDelete}
            onInspectRoster={(ev) => setRosterModalEvent(ev)}
            onDownloadCSV={handleDownloadCSV}
            downloadingId={downloadingId}
          />
        )}
      </div>

      {/* Create / Edit Form Modal */}
      <AdminEventFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingEvent(null);
        }}
        editingEvent={editingEvent}
        staffCoordinators={staffCoordinators}
        studentCoordinators={studentCoordinators}
        floorPlanZones={floorPlanZones}
        centralizedPrizes={centralizedPrizes}
        onSave={handleSave}
        saving={saving}
      />

      {/* Roster Modal */}
      <AdminEventRosterModal
        isOpen={Boolean(rosterModalEvent)}
        onClose={() => setRosterModalEvent(null)}
        event={rosterModalEvent}
        onDownloadCSV={handleDownloadCSV}
        downloading={downloadingId === rosterModalEvent?.id}
      />
    </main>
  );
}
