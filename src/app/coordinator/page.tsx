"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, FolderOpen, Theater, Laptop, MapPin, Clock, CheckCircle2, QrCode, User } from "lucide-react";
import { safeJson } from "@/lib/safeFetch";
import CheckInModal from "@/components/CheckInModal";
import Footer from "@/components/Footer";

interface CoordEvent {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  capacity: number | null;
  venue: string | null;
  dateTime: string;
  rules?: string | null;
  staffCoordinator?: {
    name: string;
    email: string;
  } | null;
  studentCoordinator?: {
    name: string;
    email: string;
  } | null;
  coordinator?: {
    name: string;
    email: string;
  } | null;
  registrations: Array<{
    id: string;
    status: "PENDING" | "CONFIRMED" | "REJECTED";
    result: string | null;
  }>;
  _count: {
    registrations: number;
  };
}

export default function CoordinatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<CoordEvent[]>([]);
  const [edition, setEdition] = useState<{
    id?: string;
    name?: string | null;
    edition?: string | null;
    logoUrl?: string | null;
    institutionCrestUrl?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/coordinator");
      return;
    }

    if (status === "authenticated") {
      const isCoordinatorRole =
        session.user.role === "COORDINATOR" ||
        session.user.role === "ADMIN" ||
        (session.user as any).isEventCoordinator;

      if (!isCoordinatorRole) {
        router.push("/dashboard");
        return;
      }

      async function loadCoordinatorEvents() {
        try {
          const res = await fetch("/api/coordinator/events");
          const data = await safeJson(res, { success: false, events: [] });
          if (data.success && data.events) {
            setEvents(data.events);
            if (data.edition) {
              setEdition(data.edition);
            }
          }
        } catch (err) {
          console.error("Coordinator events load error:", err);
        } finally {
          setLoading(false);
        }
      }
      loadCoordinatorEvents();
    }
  }, [status, session, router]);

  if (status === "loading" || loading) {
    return (
      <main className="dash-layout min-h-screen bg-canvas flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-accent-muted border-t-accent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-muted">Loading coordinator portal...</p>
        </div>
      </main>
    );
  }

  const totalRegistrations = events.reduce((sum, e) => sum + e._count.registrations, 0);
  const totalConfirmed = events.reduce(
    (sum, e) => sum + e.registrations.filter((r) => r.status === "CONFIRMED").length,
    0
  );
  const totalPending = events.reduce(
    (sum, e) => sum + e.registrations.filter((r) => r.status === "PENDING").length,
    0
  );

  const coordLogo = edition?.logoUrl || edition?.institutionCrestUrl;
  const festName = (edition?.name || "SHINE").trim();
  const festEdition = (edition?.edition || "26").trim();
  const festInitial = (festName?.[0] || "S").toUpperCase();

  return (
    <main className="dash-layout flex flex-col min-h-screen bg-canvas text-ink">
      {/* Calm Light Navigation */}
      <header className="bg-surface border-b border-border sticky top-0 z-20">
        <div className="container-shine py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              {coordLogo ? (
                <img
                  src={coordLogo}
                  alt={festName}
                  className="h-8 w-auto max-w-[40px] object-contain shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-[8px] bg-surface-inverse flex items-center justify-center text-white font-bold text-base shrink-0">
                  {festInitial}
                </div>
              )}
              <span className="font-bold text-ink tracking-tight text-base">
                {festName} <span className="text-accent">{festEdition}</span>
              </span>
            </Link>
            <span className="text-border-strong">/</span>
            <span className="pill-badge">
              Coordinator Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCheckInModal(true)}
              className="tap-target px-3.5 py-1.5 text-xs font-semibold text-accent-ink bg-accent hover:bg-accent-hover rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Check-in</span>
            </button>
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="tap-target px-3 py-1.5 text-xs font-semibold text-ink bg-surface border border-border hover:border-accent hover:text-accent rounded-[8px] transition-colors"
              >
                Switch to Admin Panel →
              </Link>
            )}
            <Link
              href="/leaderboard"
              className="tap-target px-3 py-1.5 text-xs font-semibold text-ink bg-surface border border-border hover:border-accent hover:text-accent rounded-[8px] transition-colors flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-gold" />
              Stage Results
            </Link>
            <Link
              href="/profile"
              className="tap-target px-3 py-1.5 text-xs font-semibold text-ink bg-surface border border-border hover:border-accent hover:text-accent rounded-[8px] transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-ink-muted" />
              <span>My Profile</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="tap-target px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-danger transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="container-shine py-8 flex-1">
        {/* Banner */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="eyebrow block mb-1">
                Faculty & Student Coordinator Desk
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                {session?.user?.name || "Event Coordinator"}
              </h1>
              <p className="text-sm text-ink-muted mt-1">
                {session?.user?.email} • Manage participant check-ins and enter official competition awards.
              </p>
            </div>

            <div className="bg-surface border border-border shadow-card rounded-2xl px-4 py-3 text-right">
              <div className="text-xs font-medium text-ink-muted">Total Assigned</div>
              <div className="text-xl font-bold text-ink tabular-nums">
                {events.length} Event(s)
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="dash-card p-5">
            <div className="text-xs font-medium text-ink-muted">Assigned Events</div>
            <div className="text-3xl font-bold text-ink mt-1 tabular-nums">
              {events.length}
            </div>
          </div>

          <div className="dash-card p-5">
            <div className="text-xs font-medium text-ink-muted">Total Registrations</div>
            <div className="text-3xl font-bold text-ink mt-1 tabular-nums">
              {totalRegistrations}
            </div>
          </div>

          <div className="dash-card p-5">
            <div className="text-xs font-medium text-ink-muted">Confirmed</div>
            <div className="text-3xl font-bold text-success mt-1 tabular-nums">
              {totalConfirmed}
            </div>
          </div>

          <div className="dash-card p-5">
            <div className="text-xs font-medium text-ink-muted">Needs Action (Pending)</div>
            <div className="text-3xl font-bold text-warning mt-1 tabular-nums">
              {totalPending}
            </div>
          </div>
        </div>

        {/* Events Cards */}
        <div>
          <h2 className="text-lg font-bold text-ink mb-4">
            Your Assigned Competitions
          </h2>

          {events.length === 0 ? (
            <div className="dash-card p-12 text-center max-w-md mx-auto">
              <FolderOpen className="w-10 h-10 text-ink-subtle mx-auto mb-3" />
              <h3 className="text-base font-bold text-ink mb-1">
                No Events Assigned Yet
              </h3>
              <p className="text-sm text-ink-muted">
                You do not currently have any events linked to your coordinator account. Contact the administrator to assign events.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((ev) => {
                const confirmedCount = ev.registrations.filter((r) => r.status === "CONFIRMED").length;
                const pendingCount = ev.registrations.filter((r) => r.status === "PENDING").length;

                return (
                  <div
                    key={ev.id}
                    className="dash-card p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center gap-2 mb-3">
                        <span className="pill-badge">
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
                        <span className="text-xs font-semibold text-ink-muted tabular-nums">
                          Fee: ₹{ev.fee}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-ink mb-2">
                        {ev.name}
                      </h3>

                      <div className="space-y-1 text-xs text-ink-muted mb-6">
                        {ev.venue && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                            <span>Venue: <strong className="text-ink">{ev.venue}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-ink-subtle shrink-0" />
                          <span>
                            Schedule:{" "}
                            <strong className="text-ink tabular-nums">
                              {new Date(ev.dateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Attendee Progress Bar */}
                      <div className="bg-surface-raised rounded-xl p-4 mb-6">
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-ink-muted">Total Registered:</span>
                          <span className="text-ink tabular-nums">{ev._count.registrations}</span>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <span className="text-success-ink font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                            <span>{confirmedCount} Confirmed</span>
                          </span>
                          <span className="text-warning-ink font-semibold inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-warning" />
                            <span>{pendingCount} Pending Triage</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/coordinator/${ev.id}`}
                      className="tap-target w-full bg-accent hover:bg-accent-hover text-accent-ink text-sm font-semibold rounded-[8px] flex items-center justify-center gap-2 transition-colors"
                    >
                      Manage Registrations & Results →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />

      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        mode="event_only"
      />
    </main>
  );
}
