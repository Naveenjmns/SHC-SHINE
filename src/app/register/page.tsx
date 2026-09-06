"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle, Theater, Laptop } from "lucide-react";

interface EventItem {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  venue: string | null;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const preselectedEventId = searchParams.get("eventId");

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Stepper state (1: Student Info, 2: Event Selection)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [password, setPassword] = useState("");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState<{
    message: string;
    totalFee: number;
    registrations: Array<{ eventName: string; status: string }>;
  } | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (data.success) {
          setEvents(data.events);
          if (preselectedEventId) {
            setSelectedEventIds([preselectedEventId]);
          }
        }
      } catch (err) {
        console.error("Error loading events:", err);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, [preselectedEventId]);

  const toggleEvent = (id: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalFee = events
    .filter((e) => selectedEventIds.includes(e.id))
    .reduce((sum, e) => sum + e.fee, 0);

  const validateStep1 = () => {
    setErrorMessage("");
    if (!name.trim() || !email.trim() || !phone.trim() || !college.trim()) {
      setErrorMessage("Please complete your name, email, phone, and college.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    if (selectedEventIds.length === 0) {
      setErrorMessage("Please select at least one event competition.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          college,
          password: password || undefined,
          eventIds: selectedEventIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Registration failed. Please try again.");
        setSubmitting(false);
        return;
      }

      setSuccessData(data);
    } catch (err) {
      console.error("Registration submit error:", err);
      setErrorMessage("A network error occurred. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-shine py-12 max-w-3xl mx-auto">
      {successData ? (
        <div className="fest-card p-8 sm:p-12 text-center border-amber-500/30">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <span className="status-badge status-badge-confirmed mb-3">
            Registration Submitted
          </span>
          <h2
            className="text-fluid-h1 font-extrabold text-white mb-3"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            Welcome to SHINE 26!
          </h2>
          <p className="text-sm text-[#9CA3AF] max-w-md mx-auto mb-8">
            Your registration has been logged with status <strong className="text-[#D9A441]">PENDING</strong>.
            Event coordinators will review and confirm your participation.
          </p>

          <div className="bg-[#141212] border border-white/10 rounded-xl p-6 mb-8 text-left max-w-md mx-auto">
            <h4 className="text-xs font-bold text-[#D9A441] uppercase tracking-wider mb-3">
              Selected Competitions
            </h4>
            <ul className="space-y-2 mb-4">
              {successData.registrations.map((r, i) => (
                <li key={i} className="flex justify-between text-xs sm:text-sm">
                  <span className="text-white font-medium">{r.eventName}</span>
                  <span className="status-badge status-badge-pending text-[10px] inline-flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{r.status}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/10 pt-3 flex justify-between items-center text-sm font-bold">
              <span className="text-[#9CA3AF]">Total Payable Fee:</span>
              <span className="text-[#D9A441] text-base tabular-nums">₹{successData.totalFee}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="btn-ember px-8 py-3 text-sm font-bold"
            >
              Sign In to Student Dashboard
            </Link>
            <Link
              href="/events"
              className="btn-gold-outline px-8 py-3 text-sm font-semibold"
            >
              Explore More Events
            </Link>
          </div>
        </div>
      ) : (
        <div className="fest-card p-6 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20 text-xs font-bold uppercase tracking-wider mb-2">
              Intercollegiate Fest Registration
            </span>
            <h1
              className="text-fluid-h1 font-black text-white tracking-tight"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              Register for <span className="hero-wordmark-gradient">SHINE 26</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#9CA3AF] mt-2 max-w-lg mx-auto">
              Open to students from all universities & colleges. Step through your details and pick your events below.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`tap-target px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                currentStep === 1
                  ? "bg-[#FF6B1A] text-white shadow-sm"
                  : "bg-[#252222] text-[#9CA3AF] hover:text-white"
              }`}
            >
              1. Participant Info
            </button>
            <span className="text-white/20">→</span>
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              className={`tap-target px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                currentStep === 2
                  ? "bg-[#FF6B1A] text-white shadow-sm"
                  : "bg-[#252222] text-[#9CA3AF] hover:text-white"
              }`}
            >
              2. Event Selection ({selectedEventIds.length})
            </button>
          </div>

          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm p-3.5 rounded-xl mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: Student Information */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sundaram"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 bg-[#1A1818] border border-[#2A2626] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-[#FF6B1A] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya@college.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 bg-[#1A1818] border border-[#2A2626] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-[#FF6B1A] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5">
                      WhatsApp / Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9840123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-11 bg-[#1A1818] border border-[#2A2626] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-[#FF6B1A] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5">
                      College / Institution Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Loyola College / Sacred Heart College"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full h-11 bg-[#1A1818] border border-[#2A2626] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-[#FF6B1A] transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5">
                      Portal Password (Optional — default is your phone number)
                    </label>
                    <input
                      type="password"
                      placeholder="Create a password for your Student Dashboard"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 bg-[#1A1818] border border-[#2A2626] rounded-xl px-3.5 text-sm text-white focus:outline-none focus:border-[#FF6B1A] transition-colors"
                    />
                    <p className="text-[11px] text-[#9CA3AF]/70 mt-1">
                      You will use your email and this password to log in and track your approval status and live results.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) setCurrentStep(2);
                    }}
                    className="btn-ember w-full sm:w-auto text-sm font-bold"
                  >
                    Continue to Event Selection →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Event Selection */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-[#9CA3AF]">
                    Choose the competitions you wish to participate in:
                  </div>
                  <div className="text-xs font-bold text-[#D9A441]">
                    {selectedEventIds.length} event(s) selected
                  </div>
                </div>

                {loadingEvents ? (
                  <div className="py-12 text-center text-xs text-[#9CA3AF]">
                    Loading competitions list...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {events.map((ev) => {
                      const isSelected = selectedEventIds.includes(ev.id);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => toggleEvent(ev.id)}
                          className={`tap-target p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none text-left ${
                            isSelected
                              ? "bg-[#FF6B1A]/10 border-[#FF6B1A] shadow-sm"
                              : "bg-[#141212] border-[#2A2626] hover:border-white/20"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 accent-[#FF6B1A] rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-sm font-bold text-white truncate">
                                {ev.name}
                              </span>
                              <span className="text-xs font-bold text-[#D9A441] tabular-nums shrink-0">
                                ₹{ev.fee}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#9CA3AF]">
                              <span className="badge badge-purple text-[10px] px-1.5 py-0.5 inline-flex items-center gap-1">
                                {ev.category === "ON_STAGE" ? (
                                  <>
                                    <Theater className="w-3 h-3" />
                                    <span>On-Stage</span>
                                  </>
                                ) : (
                                  <>
                                    <Laptop className="w-3 h-3" />
                                    <span>Off-Stage</span>
                                  </>
                                )}
                              </span>
                              {ev.venue && <span>• {ev.venue}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Summary & Submit */}
                <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="tap-target text-xs font-semibold text-[#9CA3AF] hover:text-white"
                  >
                    ← Back to Student Info
                  </button>

                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="text-center sm:text-right">
                      <div className="text-[11px] text-[#9CA3AF] uppercase">Total Entry Fee</div>
                      <div
                        className="text-2xl font-black text-white tabular-nums"
                        style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                      >
                        ₹{totalFee}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || selectedEventIds.length === 0}
                      className="btn-ember w-full sm:w-auto text-sm px-8 py-3.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Complete Registration (${selectedEventIds.length})`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#0B0A0A] text-[#F3F4F6]">
      <Navbar />
      <div className="pt-24 flex-1">
        <Suspense fallback={<div className="text-center py-20 text-xs text-[#9CA3AF]">Loading registration...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
