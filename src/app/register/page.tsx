"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  Theater,
  Laptop,
  Users,
  UserPlus,
  Trash2,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  Utensils,
  QrCode,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { safeJson } from "@/lib/safeFetch";

interface EventItem {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
  venue: string | null;
  rules: string | null;
}

interface MemberFormState {
  name: string;
  email: string;
  phone: string;
  eventIds: string[];
}

interface RegisteredDelegate {
  id: string;
  name: string;
  email: string;
  phone: string;
  badgeCode: string;
  foodTokenCode: string;
  qrData: string;
  foodQrData?: string;
  events: Array<{
    id: string;
    name: string;
    category: string;
    venue: string | null;
  }>;
}

interface SuccessResponse {
  message: string;
  delegation: {
    id: string;
    collegeName: string;
    department: string;
    teamName: string;
    teamLeadName: string;
    staffInchargeName: string | null;
    totalFee: number;
    paymentStatus: string;
  };
  delegates: RegisteredDelegate[];
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const preselectedEventId = searchParams.get("eventId") || searchParams.get("event");

  // Edition details
  const [festName, setFestName] = useState("SHINE");
  const [festEdition, setFestEdition] = useState("2026");
  const [participantFee, setParticipantFee] = useState<number>(0);
  const [institutionName, setInstitutionName] = useState("");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [registrationClosedNotice, setRegistrationClosedNotice] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Step 1: College Representation
  const [collegeName, setCollegeName] = useState("");
  const [department, setDepartment] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamLeadName, setTeamLeadName] = useState("");
  const [teamLeadEmail, setTeamLeadEmail] = useState("");
  const [teamLeadPhone, setTeamLeadPhone] = useState("");
  const [password, setPassword] = useState("");

  // Accompanying Faculty Incharge (Outer College)
  const [hasFacultyIncharge, setHasFacultyIncharge] = useState(false);
  const [facultyName, setFacultyName] = useState("");
  const [facultyEmail, setFacultyEmail] = useState("");
  const [facultyPhone, setFacultyPhone] = useState("");

  // Step 2: Student Contingent Members
  const [members, setMembers] = useState<MemberFormState[]>([
    { name: "", email: "", phone: "", eventIds: [] },
  ]);

  // Events
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Flow State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState<SuccessResponse | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventsRes, editionRes] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/edition/active"),
        ]);
        const eventsData = await safeJson(eventsRes, { success: false, events: [] });
        const editionData = await safeJson(editionRes, { success: false, edition: null });

        if (eventsData.success && Array.isArray(eventsData.events)) {
          setEvents(eventsData.events);
          if (preselectedEventId) {
            setMembers([
              { name: "", email: "", phone: "", eventIds: [preselectedEventId] },
            ]);
          }
        }
        if (editionData.success && editionData.edition) {
          setFestName(editionData.edition.name || "SHINE");
          setFestEdition(editionData.edition.edition || "2026");
          setParticipantFee(editionData.edition.participantFee || 0);
          setInstitutionName(editionData.edition.institutionName || "");
          setIsRegistrationOpen(editionData.edition.isRegistrationOpen ?? true);
          setRegistrationClosedNotice(
            editionData.edition.registrationClosedNotice ||
              "Registrations for this edition are currently closed. Please contact the event coordinators for queries."
          );
          setContactEmail(editionData.edition.contactEmail || "");
          setContactPhone(editionData.edition.contactPhone || "");
        }
      } catch (err) {
        console.error("Error loading events & edition data:", err);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadData();
  }, [preselectedEventId]);

  // Auto-sync Team Lead info with Member #1 if user hasn't explicitly diverged
  const handleTeamLeadNameChange = (val: string) => {
    setTeamLeadName(val);
    setMembers((prev) => {
      if (prev.length === 1 && (!prev[0].name || prev[0].name === teamLeadName)) {
        return [{ ...prev[0], name: val }];
      }
      return prev;
    });
  };

  const handleTeamLeadEmailChange = (val: string) => {
    setTeamLeadEmail(val);
    setMembers((prev) => {
      if (prev.length === 1 && (!prev[0].email || prev[0].email === teamLeadEmail)) {
        return [{ ...prev[0], email: val }];
      }
      return prev;
    });
  };

  const handleTeamLeadPhoneChange = (val: string) => {
    setTeamLeadPhone(val);
    setMembers((prev) => {
      if (prev.length === 1 && (!prev[0].phone || prev[0].phone === teamLeadPhone)) {
        return [{ ...prev[0], phone: val }];
      }
      return prev;
    });
  };

  // Member Management
  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      { name: "", email: "", phone: "", eventIds: [] },
    ]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof MemberFormState, value: any) => {
    setMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const toggleMemberEvent = (memberIndex: number, eventId: string) => {
    setMembers((prev) => {
      const copy = [...prev];
      const member = copy[memberIndex];
      const exists = member.eventIds.includes(eventId);
      const newEventIds = exists
        ? member.eventIds.filter((id) => id !== eventId)
        : [...member.eventIds, eventId];
      copy[memberIndex] = { ...member, eventIds: newEventIds };
      return copy;
    });
  };

  // Validation
  const validateStep1 = () => {
    setErrorMessage("");
    if (!collegeName.trim()) {
      setErrorMessage("Please enter your College or Institution name.");
      return false;
    }
    if (!teamLeadName.trim() || !teamLeadEmail.trim() || !teamLeadPhone.trim()) {
      setErrorMessage("Please provide the College Team Lead's name, email, and phone number.");
      return false;
    }
    if (hasFacultyIncharge && !facultyName.trim()) {
      setErrorMessage("Please enter the accompanying Faculty Incharge's name or uncheck the faculty option.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setErrorMessage("");
    if (members.length === 0) {
      setErrorMessage("Please add at least one student delegate.");
      return false;
    }
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim() || !m.email.trim() || !m.phone.trim()) {
        setErrorMessage(`Please fill in full name, email, and mobile for Delegate #${i + 1}.`);
        return false;
      }
      if (m.eventIds.length === 0) {
        setErrorMessage(`Please select at least one competition for Delegate #${i + 1} (${m.name || "Student"}).`);
        return false;
      }
    }
    return true;
  };

  const totalPayableFee = members.length * participantFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isRegistrationOpen) {
      setErrorMessage(
        registrationClosedNotice || "Registrations are currently closed by the administration."
      );
      return;
    }

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        collegeName: collegeName.trim(),
        department: department.trim() || undefined,
        teamName: teamName.trim() || undefined,
        teamLead: {
          name: teamLeadName.trim(),
          email: teamLeadEmail.trim(),
          phone: teamLeadPhone.trim(),
        },
        staffIncharge: hasFacultyIncharge && facultyName.trim() ? {
          name: facultyName.trim(),
          email: facultyEmail.trim() || undefined,
          phone: facultyPhone.trim() || undefined,
        } : null,
        password: password.trim() || undefined,
        members: members.map((m) => ({
          name: m.name.trim(),
          email: m.email.trim(),
          phone: m.phone.trim(),
          eventIds: m.eventIds,
        })),
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res, { success: false, message: "Server error occurred." });
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Registration failed. Please check inputs and try again.");
        setSubmitting(false);
        return;
      }

      setSuccessData(data);
    } catch (err) {
      console.error("Registration submission error:", err);
      setErrorMessage("A network error occurred. Please verify your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS VIEW: Digital ID Passes, QR codes & Food Tokens
  if (successData) {
    return (
      <div className="container-shine py-12 max-w-4xl mx-auto">
        <div className="bg-white border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-xl text-center">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <span className="status-badge status-badge-confirmed mb-2">
            Delegation Registered Successfully
          </span>

          <h2
            className="text-fluid-h1 font-black text-[#1C1917] mb-2 tracking-tight"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            Welcome, {successData.delegation.collegeName}!
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto mb-6">
            Your college contingent has been registered with{" "}
            <strong>{successData.delegates.length} delegate(s)</strong>. Official digital ID badges, gate verification QR codes, and meal coupons have been issued.
          </p>

          {/* Email alert confirmation callout */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-2xl mx-auto mb-8 text-left flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950">
              <strong className="block font-bold mb-0.5">Automated Notifications Triggered:</strong>
              Each delegate has been dispatched an official email with their digital ID pass, schedule, and food token. The event staff and student coordinators have also received the contingent roster.
            </div>
          </div>

          {/* Delegation Delegates Cards Grid */}
          <div className="text-left mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF6B1A]" />
                <span>Issued Delegate Passes ({successData.delegates.length})</span>
              </h3>
              <span className="text-xs font-bold text-[#D9A441] tabular-nums">
                Total Fee: ₹{successData.delegation.totalFee}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {successData.delegates.map((del) => (
                <div
                  key={del.id}
                  className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-400 transition-all shadow-2xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-amber-600 bg-amber-100/70 px-2 py-0.5 rounded">
                          {del.badgeCode}
                        </span>
                        <h4 className="text-base font-extrabold text-stone-900 mt-1">
                          {del.name}
                        </h4>
                        <div className="text-[11px] text-stone-500">{del.email} • {del.phone}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {del.qrData && (
                          <div className="text-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={del.qrData}
                              alt={`Event QR for ${del.badgeCode}`}
                              className="w-14 h-14 rounded-lg border border-stone-300 p-1 bg-white"
                            />
                            <span className="text-[8px] font-bold text-stone-500 block mt-0.5">Event QR</span>
                          </div>
                        )}
                        {del.foodQrData && (
                          <div className="text-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={del.foodQrData}
                              alt={`Food QR for ${del.foodTokenCode}`}
                              className="w-14 h-14 rounded-lg border border-amber-300 p-1 bg-white"
                            />
                            <span className="text-[8px] font-bold text-amber-800 block mt-0.5">Food QR</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Food Token Box */}
                    <div className="bg-amber-100/60 border border-amber-300/80 rounded-xl p-2.5 mb-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-amber-950 font-bold">
                        <Utensils className="w-4 h-4 text-amber-700" />
                        <span>Food & Lunch Token</span>
                      </div>
                      <span className="font-mono font-black text-stone-900 bg-white px-2 py-0.5 rounded border border-amber-300">
                        {del.foodTokenCode}
                      </span>
                    </div>

                    {/* Events Enrolled */}
                    <div className="text-xs text-stone-600 mb-3">
                      <div className="text-[10px] font-bold uppercase text-stone-400 mb-1">
                        Events Participating ({del.events.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {del.events.map((ev) => (
                          <span
                            key={ev.id}
                            className="text-[10px] bg-white border border-stone-200 rounded px-2 py-0.5 text-stone-800 font-medium"
                          >
                            {ev.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                    <Link
                      href={`/badge/${encodeURIComponent(del.badgeCode)}`}
                      target="_blank"
                      className="tap-target inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B1A] hover:underline"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View & Print ID Card</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 border-t border-stone-200">
            <Link
              href="/login"
              className="btn-ember px-8 py-3 text-xs font-bold rounded-xl"
            >
              Sign In to Contingent Portal
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccessData(null);
                setCurrentStep(1);
                setMembers([{ name: "", email: "", phone: "", eventIds: [] }]);
              }}
              className="tap-target px-6 py-3 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            >
              Register Another College Team
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shine py-12 max-w-3xl mx-auto">
      <div className="fest-card p-6 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20 text-xs font-bold uppercase tracking-wider mb-2">
            Intercollegiate Delegation Registration
          </span>
          <h1
            className="text-fluid-h1 font-black text-[#1C1917] tracking-tight"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            Register for <span className="hero-wordmark-gradient">{festName} {festEdition}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#57534E] mt-2 max-w-lg mx-auto">
            {institutionName ? `${institutionName} • ` : ""}
            Register your college team or individual delegates. Each registered student receives an official badge with gate QR code & lunch coupon.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Registration Fee: <strong>{participantFee > 0 ? `₹${participantFee} per delegate` : "Free"}</strong> (Includes all competitions + food token)</span>
          </div>
        </div>

        {!isRegistrationOpen ? (
          <div className="py-8 text-center max-w-xl mx-auto space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold uppercase tracking-wider">
                Registrations Closed
              </span>
              <h2
                className="text-2xl sm:text-3xl font-black text-[#1C1917]"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                Portal Currently Closed
              </h2>
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                {registrationClosedNotice ||
                  "Registrations for this edition of the symposium are currently closed by the event coordinators."}
              </p>
            </div>

            {(contactEmail || contactPhone) && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-left space-y-2">
                <span className="text-xs font-bold text-stone-900 block">
                  Event Coordination Helpdesk:
                </span>
                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
                  {contactPhone && (
                    <a
                      href={`tel:${contactPhone}`}
                      className="flex items-center gap-1.5 hover:text-[#FF6B1A] transition font-medium"
                    >
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{contactPhone}</span>
                    </a>
                  )}
                  {contactEmail && (
                    <a
                      href={`mailto:${contactEmail}`}
                      className="flex items-center gap-1.5 hover:text-[#FF6B1A] transition font-medium"
                    >
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span>{contactEmail}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/"
                className="btn-ember text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Home</span>
              </Link>
              <Link
                href="/#events"
                className="tap-target px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#1C1917] bg-stone-100 hover:bg-stone-200 transition"
              >
                Explore Competitions
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stepper Tabs */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`tap-target px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentStep === 1
                ? "bg-[#FF6B1A] text-white shadow-sm"
                : "bg-stone-200/70 text-[#57534E] hover:text-[#1C1917]"
            }`}
          >
            1. College & Lead
          </button>
          <span className="text-[#1C1917]/30">→</span>
          <button
            type="button"
            onClick={() => {
              if (validateStep1()) setCurrentStep(2);
            }}
            className={`tap-target px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentStep === 2
                ? "bg-[#FF6B1A] text-white shadow-sm"
                : "bg-stone-200/70 text-[#57534E] hover:text-[#1C1917]"
            }`}
          >
            2. Delegates & Events ({members.length})
          </button>
          <span className="text-[#1C1917]/30">→</span>
          <button
            type="button"
            onClick={() => {
              if (validateStep1() && validateStep2()) setCurrentStep(3);
            }}
            className={`tap-target px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentStep === 3
                ? "bg-[#FF6B1A] text-white shadow-sm"
                : "bg-stone-200/70 text-[#57534E] hover:text-[#1C1917]"
            }`}
          >
            3. Summary & Submit
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 text-xs sm:text-sm p-3.5 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: College Representation & Team Lead */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
                <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#FF6B1A]" />
                  <span>College / Institution Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                      College / Institution Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Loyola College / Sacred Heart College"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                      Department (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science / MCA"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                      Contingent / Team Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CyberKnights / Team SHC"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* College Team Lead Section */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#FF6B1A]" />
                    <span>Contingent Team Lead (Student Representative)</span>
                  </h3>
                  <span className="text-[10px] text-stone-500 font-semibold">Primary Point of Contact</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                      Team Lead Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sundaram"
                      value={teamLeadName}
                      onChange={(e) => handleTeamLeadNameChange(e.target.value)}
                      className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                      Team Lead Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. priya@college.ac.in"
                      value={teamLeadEmail}
                      onChange={(e) => handleTeamLeadEmailChange(e.target.value)}
                      className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                      WhatsApp / Mobile *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9840123456"
                      value={teamLeadPhone}
                      onChange={(e) => handleTeamLeadPhoneChange(e.target.value)}
                      className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Outer College Accompanying Faculty Section */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasFacultyIncharge}
                      onChange={(e) => setHasFacultyIncharge(e.target.checked)}
                      className="w-4 h-4 accent-[#FF6B1A] rounded"
                    />
                    <span className="text-xs font-bold text-stone-900">
                      Our college contingent is accompanied by an Outer Faculty Incharge
                    </span>
                  </label>
                  <span className="text-[10px] text-stone-500 font-semibold">Optional</span>
                </div>

                {hasFacultyIncharge && (
                  <div className="mt-4 pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                        Faculty Incharge Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. K. Ramesh"
                        value={facultyName}
                        onChange={(e) => setFacultyName(e.target.value)}
                        className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                        Faculty Mobile Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 9443123456"
                        value={facultyPhone}
                        onChange={(e) => setFacultyPhone(e.target.value)}
                        className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                        Faculty Email
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. ramesh@college.edu"
                        value={facultyEmail}
                        onChange={(e) => setFacultyEmail(e.target.value)}
                        className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#1C1917]/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setCurrentStep(2);
                  }}
                  className="btn-ember w-full sm:w-auto text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Delegate Roster & Events</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Student Contingent Roster & Event Selection */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider">
                    Student Contingent Roster
                  </h3>
                  <p className="text-xs text-stone-500">
                    Add each participating student delegate with their contact info and selected competitions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addMember}
                  className="tap-target inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-700 hover:bg-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Another Delegate</span>
                </button>
              </div>

              {loadingEvents ? (
                <div className="py-12 text-center text-xs text-[#57534E]">
                  Loading competitions catalogue...
                </div>
              ) : (
                <div className="space-y-6">
                  {members.map((member, mIdx) => (
                    <div
                      key={mIdx}
                      className="bg-stone-50 border border-stone-200 rounded-2xl p-5 relative shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1C1917] text-white text-[11px] font-bold flex items-center justify-center">
                            {mIdx + 1}
                          </span>
                          <span className="text-xs font-black text-stone-900 uppercase tracking-wider">
                            Delegate #{mIdx + 1} {mIdx === 0 && "(Team Lead)"}
                          </span>
                        </div>

                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMember(mIdx)}
                            className="tap-target text-stone-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove delegate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div>
                          <label className="block text-[11px] font-bold text-[#1C1917] mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Student Name"
                            value={member.name}
                            onChange={(e) => updateMember(mIdx, "name", e.target.value)}
                            className="w-full h-10 bg-white border border-[#1C1917]/15 rounded-xl px-3 text-xs text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#1C1917] mb-1">
                            Email (For Pass & Schedule) *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="student@mail.com"
                            value={member.email}
                            onChange={(e) => updateMember(mIdx, "email", e.target.value)}
                            className="w-full h-10 bg-white border border-[#1C1917]/15 rounded-xl px-3 text-xs text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#1C1917] mb-1">
                            WhatsApp / Mobile *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 9840123456"
                            value={member.phone}
                            onChange={(e) => updateMember(mIdx, "phone", e.target.value)}
                            className="w-full h-10 bg-white border border-[#1C1917]/15 rounded-xl px-3 text-xs text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors"
                          />
                        </div>
                      </div>

                      {/* Event Enrollment for this delegate */}
                      <div className="pt-3 border-t border-stone-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                            Competitions Opted ({member.eventIds.length}) *
                          </span>
                          <span className="text-[10px] text-stone-400">
                            Check all events this delegate will compete in
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {events.map((ev) => {
                            const isChecked = member.eventIds.includes(ev.id);
                            return (
                              <label
                                key={ev.id}
                                className={`flex items-start gap-2.5 p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-amber-50/80 border-amber-400"
                                    : "bg-white border-stone-200 hover:border-stone-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleMemberEvent(mIdx, ev.id)}
                                  className="mt-0.5 accent-[#FF6B1A] rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold text-stone-900 truncate">
                                      {ev.name}
                                    </span>
                                    <span
                                      className={`text-[9px] font-extrabold px-1 rounded ${
                                        ev.category === "ON_STAGE"
                                          ? "bg-purple-100 text-purple-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {ev.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
                                    </span>
                                  </div>
                                  {ev.venue && (
                                    <div className="text-[10px] text-stone-500 truncate">
                                      Venue: {ev.venue}
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-6 border-t border-[#1C1917]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="tap-target text-xs font-semibold text-[#57534E] hover:text-[#1C1917] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to College Info</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setCurrentStep(3);
                  }}
                  className="btn-ember w-full sm:w-auto text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Review Summary & Fee Breakdown</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Summary & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6">
                <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#FF6B1A]" />
                  <span>Registration Summary</span>
                </h3>

                <div className="space-y-3 text-xs text-stone-700">
                  <div className="flex justify-between pb-2 border-b border-stone-200">
                    <span className="text-stone-500">College / Institution:</span>
                    <strong className="text-stone-900 text-right">{collegeName}</strong>
                  </div>

                  {department && (
                    <div className="flex justify-between pb-2 border-b border-stone-200">
                      <span className="text-stone-500">Department:</span>
                      <span className="font-semibold text-stone-800">{department}</span>
                    </div>
                  )}

                  {teamName && (
                    <div className="flex justify-between pb-2 border-b border-stone-200">
                      <span className="text-stone-500">Contingent Team Name:</span>
                      <span className="font-semibold text-stone-800">{teamName}</span>
                    </div>
                  )}

                  <div className="flex justify-between pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Contingent Lead:</span>
                    <span className="font-semibold text-stone-900">
                      {teamLeadName} ({teamLeadPhone})
                    </span>
                  </div>

                  {hasFacultyIncharge && facultyName && (
                    <div className="flex justify-between pb-2 border-b border-stone-200">
                      <span className="text-stone-500">Visiting Faculty Incharge:</span>
                      <span className="font-semibold text-stone-900">
                        {facultyName} {facultyPhone && `(${facultyPhone})`}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Registered Delegates Count:</span>
                    <strong className="text-stone-900">{members.length} Student(s)</strong>
                  </div>

                  <div className="flex justify-between pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Fee Per Head:</span>
                    <span className="font-semibold text-stone-800">
                      {participantFee > 0 ? `₹${participantFee}` : "Free Entry"}
                    </span>
                  </div>

                  <div className="flex justify-between pt-2 text-sm font-black text-stone-900">
                    <span>Total Payable Delegation Fee:</span>
                    <span className="text-xl text-[#FF6B1A] tabular-nums">
                      {totalPayableFee > 0 ? `₹${totalPayableFee}` : "Free"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Roster Quick Preview */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                  Delegate Roster & Competitions
                </h4>
                <div className="space-y-2">
                  {members.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-stone-900">{m.name}</strong>
                        <span className="text-stone-400 text-[11px] ml-2">({m.phone})</span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        {m.eventIds.length} Event(s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Portal Password */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
                <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
                  Portal Login Password (Optional — default is Team Lead phone number)
                </label>
                <input
                  type="password"
                  placeholder="Set password for Team Lead login"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 bg-white border border-[#1C1917]/15 rounded-xl px-3.5 text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#FF6B1A] transition-colors shadow-2xs"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Use your email and this password to log in to the Student Dashboard to view live results and approval status.
                </p>
              </div>

              <div className="pt-6 border-t border-[#1C1917]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="tap-target text-xs font-semibold text-[#57534E] hover:text-[#1C1917] flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Roster</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-ember w-full sm:w-auto text-sm px-8 py-3.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Badges & Dispatches...</span>
                    </>
                  ) : (
                    <span>
                      Complete Delegation Registration ({members.length} Delegates)
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </>
    )}
  </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      <Navbar />
      <div className="pt-24 flex-1">
        <Suspense fallback={<div className="text-center py-20 text-xs text-[#57534E]">Loading registration portal...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
}
