"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Theater,
  Laptop,
  MapPin,
  X,
  History,
  BookOpen,
  UserCheck,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  Camera,
  Phone,
  Mail,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";

interface CoordinatorUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
  college?: string | null;
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
  rules: string | null;
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

export default function AdminEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast, confirmAction } = useToast();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [staffCoordinators, setStaffCoordinators] = useState<CoordinatorUser[]>([]);
  const [studentCoordinators, setStudentCoordinators] = useState<CoordinatorUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [category, setCategory] = useState<"ON_STAGE" | "OFF_STAGE">("ON_STAGE");
  const [isUnlimitedCapacity, setIsUnlimitedCapacity] = useState(true);
  const [capacity, setCapacity] = useState("");
  const [venue, setVenue] = useState("");
  const [dateTime, setDateTime] = useState("2026-10-15T10:00");
  const [imageUrl, setImageUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Staff Coordinator form fields
  const [staffCoordinatorId, setStaffCoordinatorId] = useState("");
  const [staffCoordName, setStaffCoordName] = useState("");
  const [staffCoordEmail, setStaffCoordEmail] = useState("");
  const [staffCoordPhone, setStaffCoordPhone] = useState("");
  const [staffCoordImageUrl, setStaffCoordImageUrl] = useState("");

  // Student Coordinator form fields
  const [studentCoordinatorId, setStudentCoordinatorId] = useState("");
  const [studentCoordName, setStudentCoordName] = useState("");
  const [studentCoordEmail, setStudentCoordEmail] = useState("");
  const [studentCoordPhone, setStudentCoordPhone] = useState("");
  const [studentCoordImageUrl, setStudentCoordImageUrl] = useState("");

  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Rules viewer modal
  const [viewingRulesEvent, setViewingRulesEvent] = useState<EventItem | null>(null);

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
            fetch("/api/admin/users"),
          ]);
          const eventsData = await safeJson(eventsRes, { success: false, events: [] });
          const usersData = await safeJson(usersRes, { success: false, users: [] });

          if (eventsData.success && eventsData.events) setEvents(eventsData.events);
          if (usersData.success && usersData.users) {
            const allUsers: CoordinatorUser[] = usersData.users;
            // Staff Coordinators: COORDINATOR or ADMIN
            setStaffCoordinators(allUsers.filter((u) => u.role === "COORDINATOR" || u.role === "ADMIN"));
            // Student Coordinators: STUDENT or COORDINATOR
            setStudentCoordinators(allUsers.filter((u) => u.role === "STUDENT" || u.role === "COORDINATOR"));
          }
        } catch (err) {
          console.error("Error loading events admin data:", err);
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }
  }, [status, session, router]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    fieldKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldKey);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await safeJson(res, { success: false, error: "Upload failed." });
      if (data.success && data.url) {
        setter(data.url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error(data.error || "Failed to upload image.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("An error occurred during file upload.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleStaffSelect = (userId: string) => {
    setStaffCoordinatorId(userId);
    if (userId) {
      const u = staffCoordinators.find((c) => c.id === userId);
      if (u) {
        setStaffCoordName(u.name);
        setStaffCoordEmail(u.email);
        if (u.phone) setStaffCoordPhone(u.phone);
        if (u.avatarUrl) setStaffCoordImageUrl(u.avatarUrl);
      }
    }
  };

  const handleStudentSelect = (userId: string) => {
    setStudentCoordinatorId(userId);
    if (userId) {
      const u = studentCoordinators.find((c) => c.id === userId);
      if (u) {
        setStudentCoordName(u.name);
        setStudentCoordEmail(u.email);
        if (u.phone) setStudentCoordPhone(u.phone);
        if (u.avatarUrl) setStudentCoordImageUrl(u.avatarUrl);
      }
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setRules("");
    setCategory("ON_STAGE");
    setIsUnlimitedCapacity(true);
    setCapacity("");
    setVenue("");
    setDateTime("2026-10-15T10:00");
    setImageUrl("");
    setLogoUrl("");
    setStaffCoordinatorId("");
    setStaffCoordName("");
    setStaffCoordEmail("");
    setStaffCoordPhone("");
    setStaffCoordImageUrl("");
    setStudentCoordinatorId("");
    setStudentCoordName("");
    setStudentCoordEmail("");
    setStudentCoordPhone("");
    setStudentCoordImageUrl("");
    setShowModal(true);
  };

  const openEditModal = (ev: EventItem) => {
    setEditingId(ev.id);
    setName(ev.name);
    setDescription(ev.description || "");
    setRules(ev.rules || "");
    setCategory(ev.category);
    setIsUnlimitedCapacity(!ev.capacity);
    setCapacity(ev.capacity ? ev.capacity.toString() : "");
    setVenue(ev.venue || "");
    setDateTime(new Date(ev.dateTime).toISOString().slice(0, 16));
    setImageUrl(ev.imageUrl || "");
    setLogoUrl(ev.logoUrl || "");
    setStaffCoordinatorId(ev.staffCoordinator?.id || ev.coordinator?.id || "");
    setStaffCoordName(ev.staffCoordinatorName || ev.staffCoordinator?.name || ev.coordinator?.name || "");
    setStaffCoordEmail(ev.staffCoordinatorEmail || ev.staffCoordinator?.email || ev.coordinator?.email || "");
    setStaffCoordPhone(ev.staffCoordinatorPhone || ev.staffCoordinator?.phone || ev.coordinator?.phone || "");
    setStaffCoordImageUrl(ev.staffCoordinatorImageUrl || ev.staffCoordinator?.avatarUrl || ev.coordinator?.avatarUrl || "");
    setStudentCoordinatorId(ev.studentCoordinator?.id || "");
    setStudentCoordName(ev.studentCoordinatorName || ev.studentCoordinator?.name || "");
    setStudentCoordEmail(ev.studentCoordinatorEmail || ev.studentCoordinator?.email || "");
    setStudentCoordPhone(ev.studentCoordinatorPhone || ev.studentCoordinator?.phone || "");
    setStudentCoordImageUrl(ev.studentCoordinatorImageUrl || ev.studentCoordinator?.avatarUrl || "");
    setShowModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    const payload = {
      name,
      description,
      rules,
      category,
      capacity: isUnlimitedCapacity ? null : capacity ? parseInt(capacity, 10) : null,
      venue,
      dateTime: new Date(dateTime).toISOString(),
      imageUrl: imageUrl.trim() || null,
      logoUrl: logoUrl.trim() || null,
      staffCoordinatorId: staffCoordinatorId || null,
      staffCoordinatorName: staffCoordName.trim() || null,
      staffCoordinatorEmail: staffCoordEmail.trim() || null,
      staffCoordinatorPhone: staffCoordPhone.trim() || null,
      staffCoordinatorImageUrl: staffCoordImageUrl.trim() || null,
      studentCoordinatorId: studentCoordinatorId || null,
      studentCoordinatorName: studentCoordName.trim() || null,
      studentCoordinatorEmail: studentCoordEmail.trim() || null,
      studentCoordinatorPhone: studentCoordPhone.trim() || null,
      studentCoordinatorImageUrl: studentCoordImageUrl.trim() || null,
    };

    try {
      const url = editingId ? `/api/events/${editingId}` : "/api/events";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res, { success: false, message: "Network error occurred." });
      if (data.success) {
        toast.success(editingId ? "Event updated successfully." : "Event competition created successfully.");
        const refreshed = await fetch("/api/events");
        const refData = await safeJson(refreshed, { success: false, events: [] });
        if (refData.success && refData.events) setEvents(refData.events);
        setShowModal(false);
      } else {
        toast.error(data.message || "Failed to save event.");
      }
    } catch (err) {
      console.error("Error saving event:", err);
      toast.error("Error saving event.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string, evName: string) => {
    const confirmed = await confirmAction({
      title: "Delete Event Competition",
      message: `Are you sure you want to delete "${evName}"? All associated registrations, attendance records, and award placements will be permanently removed.`,
      confirmText: "Delete Competition",
      cancelText: "Keep Competition",
      isDestructive: true,
    });
    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const data = await safeJson(res, { success: false, message: "Network error occurred." });
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        toast.success(`Event "${evName}" has been removed.`);
      } else {
        toast.error(data.message || "Failed to delete event.");
      }
    } catch (err) {
      console.error("Delete event error:", err);
      toast.error("Error deleting event.");
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
            <Link
              href="/admin/logs"
              className="tap-target px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-orange-600" />
              <span>Activity Logs</span>
            </Link>
            <button
              onClick={openCreateModal}
              className="tap-target px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
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
                Competition Setup & Dual-Coordinator Allocation
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Manage Events & Coordinators
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Configure competition tracks, venue schedules, rules & regulations, and assign both a
                Faculty (Staff) Incharge and a Student Incharge to manage live delegate registrations.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="tap-target btn-primary text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm shrink-0"
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
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Staff Coordinator (Faculty)</th>
                  <th className="p-4">Student Coordinator</th>
                  <th className="p-4">Rules</th>
                  <th className="p-4">Registered</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev) => {
                  const staffName = ev.staffCoordinatorName || ev.staffCoordinator?.name || ev.coordinator?.name;
                  const staffEmail = ev.staffCoordinatorEmail || ev.staffCoordinator?.email || ev.coordinator?.email;
                  const staffPhone = ev.staffCoordinatorPhone || ev.staffCoordinator?.phone || ev.coordinator?.phone;
                  const staffPhoto = ev.staffCoordinatorImageUrl || ev.staffCoordinator?.avatarUrl || ev.coordinator?.avatarUrl;

                  const studentName = ev.studentCoordinatorName || ev.studentCoordinator?.name;
                  const studentEmail = ev.studentCoordinatorEmail || ev.studentCoordinator?.email;
                  const studentPhone = ev.studentCoordinatorPhone || ev.studentCoordinator?.phone;
                  const studentPhoto = ev.studentCoordinatorImageUrl || ev.studentCoordinator?.avatarUrl;

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {ev.imageUrl || ev.logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={ev.imageUrl || ev.logoUrl || ""}
                              alt={ev.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                              {ev.category === "ON_STAGE" ? <Theater className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{ev.name}</div>
                            {ev.description && (
                              <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{ev.description}</div>
                            )}
                          </div>
                        </div>
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
                        {ev.capacity ? (
                          <span className="font-semibold text-slate-700 tabular-nums">Max {ev.capacity}</span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Unlimited
                          </span>
                        )}
                      </td>

                      {/* Staff Coordinator */}
                      <td className="p-4">
                        {staffName ? (
                          <div className="flex items-center gap-2.5">
                            {staffPhoto ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={staffPhoto}
                                alt={staffName}
                                className="w-8 h-8 rounded-full object-cover border border-orange-300 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-bold text-xs shrink-0">
                                {staffName.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 text-xs truncate flex items-center gap-1">
                                <span>{staffName}</span>
                              </div>
                              {staffPhone && <div className="text-[11px] text-slate-600 font-mono">{staffPhone}</div>}
                              {staffEmail && <div className="text-[10px] text-slate-400 truncate">{staffEmail}</div>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400">Unassigned</span>
                        )}
                      </td>

                      {/* Student Coordinator */}
                      <td className="p-4">
                        {studentName ? (
                          <div className="flex items-center gap-2.5">
                            {studentPhoto ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={studentPhoto}
                                alt={studentName}
                                className="w-8 h-8 rounded-full object-cover border border-blue-300 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                                {studentName.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 text-xs truncate flex items-center gap-1">
                                <span>{studentName}</span>
                              </div>
                              {studentPhone && <div className="text-[11px] text-slate-600 font-mono">{studentPhone}</div>}
                              {studentEmail && <div className="text-[10px] text-slate-400 truncate">{studentEmail}</div>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-400">Unassigned</span>
                        )}
                      </td>

                      <td className="p-4">
                        {ev.rules ? (
                          <button
                            onClick={() => setViewingRulesEvent(ev)}
                            className="tap-target inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>View Rules</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">None</span>
                        )}
                      </td>

                      <td className="p-4 font-bold text-slate-900 tabular-nums">
                        {ev._count?.registrations ?? 0}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(ev)}
                            className="tap-target px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id, ev.name)}
                            className="tap-target px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl my-8">
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {editingId ? "Edit Event Competition" : "Create New Event Competition"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure competition track, upload poster, and assign staff & student coordinators with photos.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="tap-target text-slate-400 hover:text-slate-900 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Competition Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Code Hackathon, Web Odyssey, Quiz Arena"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>

                {/* Event Image / Poster / Logo */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
                      <span>Event Poster / Logo Image</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {imageUrl ? (
                      <div className="relative w-16 h-16 rounded-xl border border-slate-300 overflow-hidden bg-white shrink-0 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="Event preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrl("")}
                          className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-white shrink-0">
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="tap-target px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-orange-600" />
                          <span>{uploadingField === "eventImage" ? "Uploading..." : "Upload Image"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, setImageUrl, "eventImage")}
                          />
                        </label>
                        <span className="text-[11px] text-slate-400">or paste URL:</span>
                      </div>
                      <input
                        type="url"
                        placeholder="https://... or /uploads/..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full h-9 bg-white border border-slate-300 rounded-lg px-3 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as "ON_STAGE" | "OFF_STAGE")}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                    >
                      <option value="ON_STAGE">On-Stage Competition</option>
                      <option value="OFF_STAGE">Off-Stage Competition</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Lab Room</label>
                    <input
                      type="text"
                      placeholder="e.g. MCA Lab 3 / SGB Auditorium"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Capacity with "No Limit" option */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Participation Capacity Limit</span>
                      <span className="text-[11px] text-slate-500">Allow unlimited delegate registrations or restrict to maximum seats</span>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnlimitedCapacity}
                        onChange={(e) => {
                          setIsUnlimitedCapacity(e.target.checked);
                          if (e.target.checked) setCapacity("");
                        }}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-700">No Limit (Unlimited)</span>
                    </label>
                  </div>

                  {!isUnlimitedCapacity && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Max Participant / Team Capacity *</label>
                      <input
                        type="number"
                        min={1}
                        required={!isUnlimitedCapacity}
                        placeholder="e.g. 50"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-full h-10 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>

                {/* Staff Coordinator Section */}
                <div className="bg-orange-50/50 border border-orange-200/80 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-orange-600" />
                      <span>Staff Coordinator (Faculty Incharge)</span>
                    </label>
                    <span className="text-[10px] text-orange-800 font-semibold bg-orange-100/60 px-2 py-0.5 rounded">Event Incharge</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select from Registered Staff (Auto-fills below)</label>
                    <select
                      value={staffCoordinatorId}
                      onChange={(e) => handleStaffSelect(e.target.value)}
                      className="w-full h-10 bg-white border border-slate-300 rounded-xl px-3 text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                    >
                      <option value="">-- Custom or Select Registered Staff --</option>
                      {staffCoordinators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Staff Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. A. Mary"
                        value={staffCoordName}
                        onChange={(e) => setStaffCoordName(e.target.value)}
                        className="w-full h-9 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Staff Email Address</label>
                      <input
                        type="email"
                        placeholder="mary@college.edu"
                        value={staffCoordEmail}
                        onChange={(e) => setStaffCoordEmail(e.target.value)}
                        className="w-full h-9 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Staff Mobile / Contact</label>
                      <input
                        type="tel"
                        placeholder="+91 9840123456"
                        value={staffCoordPhone}
                        onChange={(e) => setStaffCoordPhone(e.target.value)}
                        className="w-full h-9 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Staff Photo Upload */}
                  <div className="pt-2 border-t border-orange-200/60 flex items-center gap-3">
                    {staffCoordImageUrl ? (
                      <div className="relative w-11 h-11 rounded-full border border-orange-300 overflow-hidden bg-white shrink-0 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={staffCoordImageUrl} alt="Staff preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setStaffCoordImageUrl("")}
                          className="absolute inset-0 bg-black/60 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-orange-100/70 border border-orange-300 flex items-center justify-center text-orange-600 shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <label className="tap-target px-2.5 py-1 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs shrink-0">
                        <Upload className="w-3.5 h-3.5 text-orange-600" />
                        <span>{uploadingField === "staffPhoto" ? "Uploading..." : "Upload Staff Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setStaffCoordImageUrl, "staffPhoto")}
                        />
                      </label>
                      <input
                        type="url"
                        placeholder="Staff photo URL (optional)"
                        value={staffCoordImageUrl}
                        onChange={(e) => setStaffCoordImageUrl(e.target.value)}
                        className="w-full h-8 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Student Coordinator Section */}
                <div className="bg-blue-50/50 border border-blue-200/80 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Student Coordinator (Student Incharge)</span>
                    </label>
                    <span className="text-[10px] text-blue-800 font-semibold bg-blue-100/60 px-2 py-0.5 rounded">Student Lead</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select from Registered Students (Auto-fills below)</label>
                    <select
                      value={studentCoordinatorId}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                      className="w-full h-10 bg-white border border-slate-300 rounded-xl px-3 text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                    >
                      <option value="">-- Custom or Select Registered Student --</option>
                      {studentCoordinators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Student Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={studentCoordName}
                        onChange={(e) => setStudentCoordName(e.target.value)}
                        className="w-full h-9 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Student Email Address</label>
                      <input
                        type="email"
                        placeholder="rahul@student.edu"
                        value={studentCoordEmail}
                        onChange={(e) => setStudentCoordEmail(e.target.value)}
                        className="w-full h-9 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Student Mobile / WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="+91 9840998877"
                        value={studentCoordPhone}
                        onChange={(e) => setStudentCoordPhone(e.target.value)}
                        className="w-full h-9 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Student Photo Upload */}
                  <div className="pt-2 border-t border-blue-200/60 flex items-center gap-3">
                    {studentCoordImageUrl ? (
                      <div className="relative w-11 h-11 rounded-full border border-blue-300 overflow-hidden bg-white shrink-0 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={studentCoordImageUrl} alt="Student preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setStudentCoordImageUrl("")}
                          className="absolute inset-0 bg-black/60 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-100/70 border border-blue-300 flex items-center justify-center text-blue-600 shrink-0">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <label className="tap-target px-2.5 py-1 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs shrink-0">
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>{uploadingField === "studentPhoto" ? "Uploading..." : "Upload Student Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setStudentCoordImageUrl, "studentPhoto")}
                        />
                      </label>
                      <input
                        type="url"
                        placeholder="Student photo URL (optional)"
                        value={studentCoordImageUrl}
                        onChange={(e) => setStudentCoordImageUrl(e.target.value)}
                        className="w-full h-8 bg-white border border-slate-300 rounded-lg px-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brief Description</label>
                  <textarea
                    rows={2}
                    placeholder="Short summary displayed on public event arena cards..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>

                {/* Rules and Regulations */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Rules & Regulations</label>
                    <span className="text-[11px] text-slate-400 font-medium">Competition guidelines and constraints</span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="1. Each team may consist of maximum 2 members from the same college.&#10;2. College ID cards are mandatory for verification.&#10;3. External libraries or internet access will be restricted.&#10;4. Decision of the jury panel is final and binding."
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 font-mono text-xs text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs leading-relaxed"
                  />
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
                    className="tap-target px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? "Saving..." : editingId ? "Update Competition" : "Save Competition"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rules Viewer Modal */}
        {viewingRulesEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    {viewingRulesEvent.name} — Rules
                  </h3>
                </div>
                <button
                  onClick={() => setViewingRulesEvent(null)}
                  className="tap-target p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 whitespace-pre-wrap font-mono text-xs text-slate-800 leading-relaxed max-h-72 overflow-y-auto">
                {viewingRulesEvent.rules || "No specific rules published for this competition."}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewingRulesEvent(null)}
                  className="tap-target px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
