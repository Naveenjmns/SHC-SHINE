"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  GraduationCap,
  CheckCircle2,
  Clock,
  ClipboardList,
  Theater,
  Laptop,
  Check,
  X,
  MapPin,
} from "lucide-react";

interface RegistrationItem {
  id: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  result: string | null;
  createdAt: string;
  event: {
    id: string;
    name: string;
    category: "ON_STAGE" | "OFF_STAGE";
    fee: number;
    venue: string | null;
    dateTime: string;
    coordinator: {
      name: string;
      email: string;
      phone: string | null;
    } | null;
  };
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }

    if (status === "authenticated") {
      async function loadRegistrations() {
        try {
          const res = await fetch("/api/student/registrations");
          const data = await res.json();
          if (data.success) {
            setRegistrations(data.registrations);
          }
        } catch (err) {
          console.error("Failed to load registrations:", err);
        } finally {
          setLoading(false);
        }
      }
      loadRegistrations();
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <main className="dash-layout flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading student portal...</p>
        </div>
      </main>
    );
  }

  const confirmed = registrations.filter((r) => r.status === "CONFIRMED");
  const pending = registrations.filter((r) => r.status === "PENDING");
  const rejected = registrations.filter((r) => r.status === "REJECTED");

  return (
    <main className="dash-layout flex flex-col min-h-screen">
      {/* Calm Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="container-shine py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                S
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base">
                SHINE <span className="text-orange-600">26</span>
              </span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
              Student Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/events"
              className="tap-target px-3.5 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              + Register More
            </Link>
            <Link
              href="/leaderboard"
              className="tap-target px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors hidden sm:inline-flex items-center gap-1.5"
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

      {/* Main Content Body */}
      <div className="container-shine py-8 flex-1">
        {/* Welcome Banner */}
        <div className="dash-card p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verified Participant
                </span>
                {session?.user?.college && (
                  <span className="text-xs text-slate-500 font-medium inline-flex items-center gap-1">
                    • <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{session.user.college}</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome, {session?.user?.name || "Participant"}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Sacred Heart College (Autonomous) • Fest Date: October 15, 2026
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-500">Account ID</div>
              <div className="text-xs font-mono tabular-nums text-slate-900 font-bold">
                {session?.user?.id?.slice(-8).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* High-Scannability Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="dash-card p-5 border-l-4 border-l-emerald-500">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Confirmed Entries
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {confirmed.length}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ready for venue check-in</span>
            </div>
          </div>

          <div className="dash-card p-5 border-l-4 border-l-amber-500">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Approval
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {pending.length}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1 inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Awaiting coordinator review</span>
            </div>
          </div>

          <div className="dash-card p-5 border-l-4 border-l-slate-400">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Registrations
            </div>
            <div className="text-3xl font-black text-slate-900 mt-1 tabular-nums">
              {registrations.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Across on-stage & off-stage
            </div>
          </div>
        </div>

        {/* Registrations List with Priority Left Borders */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>My Registered Competitions</span>
            <span className="text-xs font-medium text-slate-500">
              {registrations.length} total event(s)
            </span>
          </h2>

          {registrations.length === 0 ? (
            <div className="dash-card p-12 text-center max-w-md mx-auto">
              <ClipboardList className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">
                No Event Registrations Found
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                You have not registered for any SHINE 26 competitions yet. Browse the lineup and enroll today!
              </p>
              <Link
                href="/events"
                className="tap-target px-5 py-2.5 bg-orange-600 text-white rounded-lg text-xs font-bold"
              >
                Explore Events
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => {
                const eventDate = new Date(reg.event.dateTime);
                const borderClass =
                  reg.status === "CONFIRMED"
                    ? "dash-row-confirmed"
                    : reg.status === "REJECTED"
                    ? "dash-row-rejected"
                    : "dash-row-pending";

                return (
                  <div
                    key={reg.id}
                    className={`dash-card p-5 sm:p-6 transition-all ${borderClass}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase inline-flex items-center gap-1.5">
                            {reg.event.category === "ON_STAGE" ? (
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

                          {reg.status === "CONFIRMED" && (
                            <span className="status-badge status-badge-confirmed inline-flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Confirmed</span>
                            </span>
                          )}
                          {reg.status === "PENDING" && (
                            <span className="status-badge status-badge-pending inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Pending Review</span>
                            </span>
                          )}
                          {reg.status === "REJECTED" && (
                            <span className="status-badge status-badge-rejected inline-flex items-center gap-1">
                              <X className="w-3 h-3" />
                              <span>Rejected</span>
                            </span>
                          )}

                          {reg.result && (
                            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                              <Trophy className="w-3.5 h-3.5 text-amber-700" />
                              <span>Award: {reg.result}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-slate-900">
                          {reg.event.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          {reg.event.venue && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>Venue: <strong className="text-slate-700">{reg.event.venue}</strong></span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Time:{" "}
                              <strong className="text-slate-700 tabular-nums">
                                {eventDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </strong>
                            </span>
                          </span>
                          <span>
                            Fee: <strong className="text-slate-900 tabular-nums">₹{reg.event.fee}</strong>
                          </span>
                          {reg.event.coordinator && (
                            <span>
                              Coordinator: <strong className="text-slate-700">{reg.event.coordinator.name}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-left md:text-right shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto">
                        <div className="text-[11px] text-slate-400">Registration Reference</div>
                        <div className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                          REG-{reg.id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(reg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Calm Light Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        SHINE 26 • Department of Computer Applications (PG), Sacred Heart College (Autonomous), Tirupattur
      </footer>
    </main>
  );
}
