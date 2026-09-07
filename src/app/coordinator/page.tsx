"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, FolderOpen, Theater, Laptop, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { safeJson } from "@/lib/safeFetch";

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
  const [loading, setLoading] = useState(true);

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
      <main className="dash-layout flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading coordinator portal...</p>
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

  return (
    <main className="dash-layout flex flex-col min-h-screen">
      {/* Calm Light Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="container-shine py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                S
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base">
                SHINE <span className="text-orange-600">26</span>
              </span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
              Coordinator Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="tap-target px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Switch to Admin Panel →
              </Link>
            )}
            <Link
              href="/leaderboard"
              className="tap-target px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              Stage Results
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="tap-target px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="container-shine py-8 flex-1">
        {/* Banner */}
        <div className="dash-card p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Faculty & Student Coordinator Desk
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {session?.user?.name || "Event Coordinator"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {session?.user?.email} • Manage participant check-ins and enter official competition awards.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-right">
              <div className="text-[11px] font-bold text-amber-900 uppercase">Total Assigned</div>
              <div className="text-xl font-black text-amber-900 tabular-nums">
                {events.length} Event(s)
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="dash-card p-5 border-l-4 border-l-slate-400">
            <div className="text-xs font-bold text-slate-500 uppercase">Assigned Events</div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {events.length}
            </div>
          </div>

          <div className="dash-card p-5 border-l-4 border-l-orange-500">
            <div className="text-xs font-bold text-slate-500 uppercase">Total Registrations</div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {totalRegistrations}
            </div>
          </div>

          <div className="dash-card p-5 border-l-4 border-l-emerald-500">
            <div className="text-xs font-bold text-slate-500 uppercase">Confirmed</div>
            <div className="text-3xl font-black text-emerald-600 mt-1 tabular-nums">
              {totalConfirmed}
            </div>
          </div>

          <div className="dash-card p-5 border-l-4 border-l-amber-500">
            <div className="text-xs font-bold text-slate-500 uppercase">Needs Action (Pending)</div>
            <div className="text-3xl font-black text-amber-600 mt-1 tabular-nums">
              {totalPending}
            </div>
          </div>
        </div>

        {/* Events Cards */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Your Assigned Competitions
          </h2>

          {events.length === 0 ? (
            <div className="dash-card p-12 text-center max-w-md mx-auto">
              <FolderOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No Events Assigned Yet
              </h3>
              <p className="text-xs text-slate-500">
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
                    className="dash-card p-6 flex flex-col justify-between border-t-4 border-t-slate-800"
                  >
                    <div>
                      <div className="flex justify-between items-center gap-2 mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 inline-flex items-center gap-1.5">
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
                        <span className="text-xs font-bold text-slate-800 tabular-nums">
                          Fee: ₹{ev.fee}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {ev.name}
                      </h3>

                      <div className="space-y-1 text-xs text-slate-500 mb-6">
                        {ev.venue && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Venue: <strong className="text-slate-800">{ev.venue}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Schedule:{" "}
                            <strong className="text-slate-800 tabular-nums">
                              {new Date(ev.dateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Attendee Progress Bar */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span className="text-slate-600">Total Registered:</span>
                          <span className="text-slate-900 tabular-nums">{ev._count.registrations}</span>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{confirmedCount} Confirmed</span>
                          </span>
                          <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{pendingCount} Pending Triage</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/coordinator/${ev.id}`}
                      className="tap-target w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
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

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        SHINE 26 • Department of Computer Applications (PG), Sacred Heart College (Autonomous)
      </footer>
    </main>
  );
}
