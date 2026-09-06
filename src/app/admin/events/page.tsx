"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Theater, Laptop, MapPin, X } from "lucide-react";

interface CoordinatorUser {
  id: string;
  name: string;
  email: string;
}

interface EventItem {
  id: string;
  name: string;
  description: string | null;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  capacity: number | null;
  venue: string | null;
  dateTime: string;
  coordinator?: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count?: {
    registrations: number;
  };
}

export default function AdminEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [coordinators, setCoordinators] = useState<CoordinatorUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"ON_STAGE" | "OFF_STAGE">("ON_STAGE");
  const [fee, setFee] = useState("50");
  const [capacity, setCapacity] = useState("50");
  const [venue, setVenue] = useState("");
  const [dateTime, setDateTime] = useState("2026-10-15T10:00");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/events");
      return;
    }

    if (status === "authenticated") {
      if (session.user.role !== "ADMIN") {
        router.push("/dashboard");
        return;
      }

      async function loadData() {
        try {
          const [eventsRes, usersRes] = await Promise.all([
            fetch("/api/events"),
            fetch("/api/admin/users?role=COORDINATOR"),
          ]);
          const eventsData = await eventsRes.json();
          const usersData = await usersRes.json();

          if (eventsData.success) setEvents(eventsData.events);
          if (usersData.success) setCoordinators(usersData.users);
        } catch (err) {
          console.error("Error loading events admin data:", err);
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }
  }, [status, session, router]);

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setCategory("ON_STAGE");
    setFee("50");
    setCapacity("50");
    setVenue("");
    setDateTime("2026-10-15T10:00");
    setCoordinatorId(coordinators[0]?.id || "");
    setShowModal(true);
  };

  const openEditModal = (ev: EventItem) => {
    setEditingId(ev.id);
    setName(ev.name);
    setDescription(ev.description || "");
    setCategory(ev.category);
    setFee(ev.fee.toString());
    setCapacity(ev.capacity ? ev.capacity.toString() : "");
    setVenue(ev.venue || "");
    setDateTime(new Date(ev.dateTime).toISOString().slice(0, 16));
    setCoordinatorId(ev.coordinator?.id || "");
    setShowModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    const payload = {
      name,
      description,
      category,
      fee: parseFloat(fee) || 0,
      capacity: capacity ? parseInt(capacity, 10) : null,
      venue,
      dateTime: new Date(dateTime).toISOString(),
      coordinatorId: coordinatorId || null,
    };

    try {
      const url = editingId ? `/api/events/${editingId}` : "/api/events";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        const refreshed = await fetch("/api/events");
        const refData = await refreshed.json();
        if (refData.success) setEvents(refData.events);
        setShowModal(false);
      } else {
        alert(data.message || "Failed to save event.");
      }
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Error saving event.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string, evName: string) => {
    if (!confirm(`Are you sure you want to delete "${evName}"? All associated registrations will be removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert(data.message || "Failed to delete event.");
      }
    } catch (err) {
      console.error("Delete event error:", err);
      alert("Error deleting event.");
    }
  };

  if (status === "loading" || loading) {
    return (
      <main className="dash-layout flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading events manager...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dash-layout flex flex-col min-h-screen">
      {/* Light Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="container-wide py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/admin" className="hover:text-slate-900">
              Admin Master Control
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Events Management</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="tap-target px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              + Create New Event
            </button>
            <Link
              href="/admin"
              className="tap-target px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              ← Back to Control
            </Link>
          </div>
        </div>
      </header>

      {/* Main Wide Body */}
      <div className="container-wide py-8 flex-1">
        {/* Banner */}
        <div className="dash-card p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Competition Setup & Allocation
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Manage Events & Coordinators
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure competition rules, ticket prices, schedules, and link faculty/student coordinators.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="tap-target px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              + Add Competition
            </button>
          </div>
        </div>

        {/* Events Table */}
        <div className="dash-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Competition Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Venue & Time</th>
                  <th className="p-4">Fee & Capacity</th>
                  <th className="p-4">Assigned Coordinator</th>
                  <th className="p-4">Registrations</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-slate-900 text-sm">
                      {ev.name}
                    </td>

                    <td className="p-4">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase inline-flex items-center gap-1.5">
                        {ev.category === "ON_STAGE" ? (
                          <>
                            <Theater className="w-3.5 h-3.5" />
                            <span>On-Stage</span>
                          </>
                        ) : (
                          <>
                            <Laptop className="w-3.5 h-3.5" />
                            <span>Off-Stage</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-slate-600 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{ev.venue || "TBD"}</span>
                      </div>
                      <div className="tabular-nums font-mono text-[11px] text-slate-500">
                        {new Date(ev.dateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} • {new Date(ev.dateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 tabular-nums">₹{ev.fee}</div>
                      <div className="text-[11px] text-slate-500">
                        {ev.capacity ? `Max: ${ev.capacity}` : "Unlimited"}
                      </div>
                    </td>

                    <td className="p-4">
                      {ev.coordinator ? (
                        <div>
                          <div className="font-semibold text-slate-900">{ev.coordinator.name}</div>
                          <div className="text-[11px] text-slate-500">{ev.coordinator.email}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-bold text-slate-900 tabular-nums">
                      {ev._count?.registrations ?? 0}
                    </td>

                    <td className="p-4 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(ev)}
                        className="tap-target px-3 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.name)}
                        className="tap-target px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create / Edit Event */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingId ? "Edit Event Competition" : "Create New Event Competition"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="tap-target text-slate-400 hover:text-slate-900 cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Competition Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as "ON_STAGE" | "OFF_STAGE")}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    >
                      <option value="ON_STAGE">On-Stage Competition</option>
                      <option value="OFF_STAGE">Off-Stage Competition</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Registration Fee (₹) *</label>
                    <input
                      type="number"
                      required
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Venue</label>
                    <input
                      type="text"
                      placeholder="e.g. Main Auditorium"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Capacity Limit</label>
                    <input
                      type="number"
                      placeholder="Unlimited if blank"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign Coordinator</label>
                  <select
                    value={coordinatorId}
                    onChange={(e) => setCoordinatorId(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- No Coordinator Assigned --</option>
                    {coordinators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="tap-target px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="tap-target px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    {formSubmitting ? "Saving..." : editingId ? "Update Event" : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        SHINE 26 • Sacred Heart College (Autonomous), Tirupattur
      </footer>
    </main>
  );
}
