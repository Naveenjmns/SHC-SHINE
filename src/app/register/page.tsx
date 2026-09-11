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
  Clock,
  ReceiptIndianRupee,
  Check,
  Target,
} from "lucide-react";
import { safeJson } from "@/lib/safeFetch";

interface EventItem {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
  venue: string | null;
  rules: string | null;
  capacity?: number | null;
  hasPrelims?: boolean;
  prelimsDateTime?: string | null;
  prelimsVenue?: string | null;
}

interface MemberFormState {
  name: string;
  email: string;
  phone: string;
  eventIds: string[];
  prelimsEventIds?: string[];
  foodPreference?: "VEG" | "NON_VEG";
}

interface RegisteredDelegate {
  id: string;
  name: string;
  email: string;
  phone: string;
  badgeCode: string;
  foodTokenCode: string;
  foodPreference?: "VEG" | "NON_VEG";
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
    { name: "", email: "", phone: "", eventIds: [], foodPreference: "VEG" },
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
              { name: "", email: "", phone: "", eventIds: [preselectedEventId], foodPreference: "VEG" },
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
      { name: "", email: "", phone: "", eventIds: [], foodPreference: "VEG" },
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
      const targetEvent = events.find((e) => e.id === eventId);
      if (!targetEvent) return prev;

      const isChecked = member.eventIds.includes(eventId);
      let newEventIds: string[];

      if (isChecked) {
        // Unselect event
        newEventIds = member.eventIds.filter((id) => id !== eventId);
        const newPrelimsIds = (member.prelimsEventIds || []).filter((id) => id !== eventId);
        copy[memberIndex] = { ...member, eventIds: newEventIds, prelimsEventIds: newPrelimsIds };
        return copy;
      } else {
        // Check capacity limit for this event in current college delegation
        if (targetEvent.capacity && targetEvent.capacity > 0) {
          const currentCollegeCount = prev.filter((m) => m.eventIds.includes(eventId)).length;
          if (currentCollegeCount >= targetEvent.capacity) {
            // Already reached max allowed participants for this event in this college
            return prev;
          }
        }

        // Enforce max 1 per category: keep events of other categories and add current event
        const otherCategoryEvents = member.eventIds.filter((id) => {
          const ev = events.find((e) => e.id === id);
          return ev && ev.category !== targetEvent.category;
        });
        newEventIds = [...otherCategoryEvents, eventId];
      }

      copy[memberIndex] = { ...member, eventIds: newEventIds };
      return copy;
    });
  };

  const toggleMemberPrelims = (memberIndex: number, eventId: string) => {
    setMembers((prev) => {
      const copy = [...prev];
      const member = copy[memberIndex];
      const currentPrelims = member.prelimsEventIds || [];
      const isChecked = currentPrelims.includes(eventId);

      if (isChecked) {
        copy[memberIndex] = {
          ...member,
          prelimsEventIds: currentPrelims.filter((id) => id !== eventId),
        };
      } else {
        // Ensure student is registered for event
        if (!member.eventIds.includes(eventId)) return prev;

        // Ensure no other team member in this delegation has selected prelims for this event
        const existingNominee = prev.find((m, i) => i !== memberIndex && (m.prelimsEventIds || []).includes(eventId));
        if (existingNominee) return prev;

        copy[memberIndex] = {
          ...member,
          prelimsEventIds: [...currentPrelims, eventId],
        };
      }
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
      setErrorMessage("Please add at least one student participant.");
      return false;
    }
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim() || !m.email.trim() || !m.phone.trim()) {
        setErrorMessage(`Please fill in full name, email, and mobile for Participant #${i + 1}.`);
        return false;
      }
      if (m.eventIds.length === 0) {
        setErrorMessage(`Please select at least one competition for Participant #${i + 1} (${m.name || "Student"}).`);
        return false;
      }
      const onStageCount = m.eventIds.filter((id) => events.find((e) => e.id === id)?.category === "ON_STAGE").length;
      const offStageCount = m.eventIds.filter((id) => events.find((e) => e.id === id)?.category === "OFF_STAGE").length;
      if (onStageCount > 1 || offStageCount > 1) {
        setErrorMessage(`Participant #${i + 1} (${m.name || "Student"}) can select at most 1 On-Stage and 1 Off-Stage competition.`);
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
          prelimsEventIds: m.prelimsEventIds || [],
          foodPreference: m.foodPreference || "VEG",
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
    const isPaid = successData.delegation.paymentStatus === "PAID";

    return (
      <div className="container-shine py-12 max-w-4xl mx-auto">
        <div className={`bg-white border-2 ${isPaid ? "border-emerald-500/30" : "border-amber-500/40"} rounded-3xl p-6 sm:p-10 shadow-xl text-center`}>
          <div className={`w-16 h-16 ${isPaid ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-amber-500/10 border-amber-500/30 text-amber-600"} border rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            {isPaid ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <Clock className="w-8 h-8" />
            )}
          </div>

          <span
            className={`status-badge ${
              isPaid ? "status-badge-confirmed" : "status-badge-pending"
            } mb-2 inline-flex items-center gap-1.5`}
          >
            {isPaid ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Registration Confirmed & Passes Active</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>Status: Pending Payment at Venue Desk</span>
              </>
            )}
          </span>

          <h2
            className="text-fluid-h1 font-black text-[#1C1917] mb-2 tracking-tight"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            Welcome, {successData.delegation.collegeName}!
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto mb-6">
            Your college contingent registration has been submitted with{" "}
            <strong>{successData.delegates.length} participant(s)</strong>.
            {!isPaid && " Please complete payment at the venue desk to activate event check-in & meal services."}
          </p>

          {/* Payment Counter Callout for PENDING status */}
          {!isPaid && (
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 max-w-2xl mx-auto mb-8 text-left">
              <div className="flex items-start gap-3.5">
                <ReceiptIndianRupee className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-1.5">
                  <div className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
                    <span>Mandatory Next Step: Spot Registration Desk & Fee Clearance</span>
                    <span className="text-xs bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-black">
                      Pay ₹{successData.delegation.totalFee}
                    </span>
                  </div>
                  <p className="leading-relaxed text-stone-700">
                    On arrival at Sacred Heart College, please report to the <strong>Registration & Finance Desk</strong> with your Contingent Lead (<strong>{successData.delegation.teamLeadName}</strong>).
                    Pay the contingent fee of <strong>₹{successData.delegation.totalFee}</strong> to the desk coordinator.
                  </p>
                  <div className="text-[11px] text-stone-600 bg-white/70 p-2.5 rounded-xl border border-amber-200/60 leading-normal space-y-1.5">
                    <p className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Once payment is recorded as <strong>APPROVED</strong>, your 2 official QR badges (Event Entry QR + Food Token QR) are instantly activated.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>All participants will receive an email dispatch with their individual passes, and the Team Lead will receive the consolidated dossier for all {successData.delegates.length} members.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isPaid && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 max-w-2xl mx-auto mb-8 text-left flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950">
                <strong className="block font-bold mb-0.5">Automated Notifications Triggered:</strong>
                Each participant has been dispatched an official email with their digital ID pass, schedule, and food token. The event coordinators have also received the contingent roster.
              </div>
            </div>
          )}

          {/* Pending Approval Guidance Box */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-5 text-left text-xs text-amber-950 space-y-3 max-w-xl mx-auto my-6 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <Clock className="w-4.5 h-4.5 text-amber-600 shrink-0" />
              <span>Next Step: Coordinator / Admin Approval</span>
            </div>
            <p className="leading-relaxed text-amber-900/90">
              Your contingent registration for <strong>{successData.delegation.collegeName}</strong> with <strong>{successData.delegates.length} participant(s)</strong> has been submitted. Official <strong>Event Entry QR Passes</strong>, <strong>Food Token QR Badges</strong>, and <strong>Printable ID Cards</strong> will be activated inside your Student Portal as soon as your registration is approved by the Fest Admin or Event Coordinators.
            </p>
            <div className="pt-2.5 border-t border-amber-200/80 flex items-center justify-between text-[11px] font-medium text-amber-900">
              <span>Contingent Lead: <strong>{successData.delegation.teamLeadName}</strong></span>
              <span>Total Fee: <strong>₹{successData.delegation.totalFee}</strong></span>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 max-w-xl mx-auto mb-6 text-center text-xs text-stone-700 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-stone-500 shrink-0" />
            <span>
              <strong>Student Portal Access:</strong> Each registered participant can log in anytime at{" "}
              <Link href="/login" className="underline font-bold text-[#FF6B1A]">
                /login
              </Link>{" "}
              using their registered <strong>Email or Mobile Number</strong> (Default Password: <strong>Mobile Number</strong>).
            </span>
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
    <div className="container-shine py-6 sm:py-12 max-w-3xl mx-auto px-3 sm:px-4">
      <div className="fest-card p-4 sm:p-8 lg:p-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            Intercollegiate Delegation Registration
          </span>
          <h1
            className="text-fluid-h1 font-black text-[#1C1917] tracking-tight leading-tight"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            Register for <span className="hero-wordmark-gradient">{festName} {festEdition}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#57534E] mt-2 max-w-lg mx-auto">
            {institutionName ? `${institutionName} • ` : ""}
            Register your college team or individual participants. Each registered student receives an official badge with gate QR code & lunch coupon.
          </p>

          <div className="mt-3 sm:mt-4 inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold max-w-full flex-wrap text-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Registration Fee: <strong>{participantFee > 0 ? `₹${participantFee} per participant` : "Free"}</strong> (Includes all competitions + food token)</span>
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
            {/* Responsive Connected Stepper */}
            <div className="mb-6 sm:mb-8 max-w-lg mx-auto w-full px-1">
              <div className="relative flex items-center justify-between">
                {/* Background Track Line */}
                <div className="absolute left-6 right-6 top-4 sm:top-5 h-0.5 bg-stone-200 z-0" />
                {/* Active Progress Track Line */}
                <div
                  className="absolute left-6 top-4 sm:top-5 h-0.5 bg-gradient-to-r from-[#FF6B1A] to-[#D9A441] transition-all duration-300 z-0"
                  style={{
                    width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "calc(100% - 3rem)",
                  }}
                />

                {/* Step 1 Button */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      currentStep === 1
                        ? "bg-[#FF6B1A] text-white ring-4 ring-orange-100 scale-105"
                        : currentStep > 1
                        ? "bg-stone-900 text-white"
                        : "bg-white text-stone-400 border border-stone-300"
                    }`}
                  >
                    {currentStep > 1 ? <Check className="w-4 h-4 text-white" /> : "1"}
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] sm:text-xs font-bold transition-colors text-center ${
                      currentStep === 1 ? "text-[#FF6B1A]" : currentStep > 1 ? "text-stone-900" : "text-stone-400"
                    }`}
                  >
                    <span className="sm:hidden">College</span>
                    <span className="hidden sm:inline">1. College & Lead</span>
                  </span>
                </button>

                {/* Step 2 Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setCurrentStep(2);
                  }}
                  className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      currentStep === 2
                        ? "bg-[#FF6B1A] text-white ring-4 ring-orange-100 scale-105"
                        : currentStep > 2
                        ? "bg-stone-900 text-white"
                        : "bg-white text-stone-400 border border-stone-300"
                    }`}
                  >
                    {currentStep > 2 ? <Check className="w-4 h-4 text-white" /> : "2"}
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] sm:text-xs font-bold transition-colors text-center ${
                      currentStep === 2 ? "text-[#FF6B1A]" : currentStep > 2 ? "text-stone-900" : "text-stone-400"
                    }`}
                  >
                    <span className="sm:hidden">Delegates ({members.length})</span>
                    <span className="hidden sm:inline">2. Participants ({members.length})</span>
                  </span>
                </button>

                {/* Step 3 Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1() && validateStep2()) setCurrentStep(3);
                  }}
                  className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                      currentStep === 3
                        ? "bg-[#FF6B1A] text-white ring-4 ring-orange-100 scale-105"
                        : "bg-white text-stone-400 border border-stone-300"
                    }`}
                  >
                    3
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] sm:text-xs font-bold transition-colors text-center ${
                      currentStep === 3 ? "text-[#FF6B1A]" : "text-stone-400"
                    }`}
                  >
                    <span className="sm:hidden">Submit</span>
                    <span className="hidden sm:inline">3. Summary & Submit</span>
                  </span>
                </button>
              </div>
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
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                  <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#FF6B1A] shrink-0" />
                    <span>Contingent Team Lead (Student Rep)</span>
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
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasFacultyIncharge}
                      onChange={(e) => setHasFacultyIncharge(e.target.checked)}
                      className="w-4 h-4 accent-[#FF6B1A] rounded mt-0.5 shrink-0"
                    />
                    <span className="text-xs font-bold text-stone-900">
                      Our college contingent is accompanied by an Outer Faculty Incharge
                    </span>
                  </label>
                  <span className="text-[10px] text-stone-500 font-semibold shrink-0">Optional</span>
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
                  className="btn-ember w-full sm:w-auto text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 py-3"
                >
                  <span className="sm:hidden">Continue to Participants</span>
                  <span className="hidden sm:inline">Continue to Participant Roster & Competitions</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Student Contingent Roster & Event Selection */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-wider">
                    Student Contingent Roster
                  </h3>
                  <p className="text-xs text-stone-500">
                    Add each participating student with contact info and select max 1 On-Stage & 1 Off-Stage competition.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addMember}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-700 hover:bg-amber-500/20 transition-all cursor-pointer w-full sm:w-auto"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>Add Another Participant</span>
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
                      className="bg-stone-50 border border-stone-200 rounded-2xl p-5 relative shadow-2xs space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#1C1917] text-white text-[11px] font-bold flex items-center justify-center">
                            {mIdx + 1}
                          </span>
                          <span className="text-xs font-black text-stone-900 uppercase tracking-wider">
                            Participant #{mIdx + 1} {mIdx === 0 && "(Team Lead)"}
                          </span>
                        </div>

                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMember(mIdx)}
                            className="tap-target text-stone-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove participant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                      {/* Participant Dietary Preference for Food Committee */}
                      <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                          <label className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-amber-600" />
                            <span>Lunch Food Preference *</span>
                          </label>
                          <span className="text-[10px] text-stone-500">
                            Pre-allocates lunch counter token
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => updateMember(mIdx, "foodPreference", "VEG")}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              (member.foodPreference || "VEG") === "VEG"
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                : "bg-white border-stone-200 text-stone-700 hover:border-emerald-300"
                            }`}
                          >
                            <span>🥗 Vegetarian</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateMember(mIdx, "foodPreference", "NON_VEG")}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              member.foodPreference === "NON_VEG"
                                ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                                : "bg-white border-stone-200 text-stone-700 hover:border-amber-300"
                            }`}
                          >
                            <span>🍗 Non-Vegetarian</span>
                          </button>
                        </div>
                      </div>

                      {/* Event Enrollment for this participant (Categorized into On-Stage & Off-Stage) */}
                      <div className="pt-4 border-t border-stone-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-xs font-black text-stone-900 uppercase tracking-wider">
                            Select Competitions ({member.eventIds.length} Selected) *
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100/80 border border-amber-300 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                            Rule: Max 1 On-Stage + Max 1 Off-Stage Event
                          </span>
                        </div>

                        {/* 1. On-Stage Competitions Section */}
                        <div className="bg-purple-50/50 border border-purple-200/80 p-3.5 rounded-2xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
                              <Theater className="w-4 h-4 text-purple-600" />
                              <span>On-Stage Competitions</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                              {member.eventIds.filter((id) => events.find((e) => e.id === id)?.category === "ON_STAGE").length}/1 Selected
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {events.filter((e) => e.category === "ON_STAGE").map((ev) => {
                              const isChecked = member.eventIds.includes(ev.id);
                              const collegeCount = members.filter((m) => m.eventIds.includes(ev.id)).length;
                              const isCapacityFull = ev.capacity && ev.capacity > 0 ? collegeCount >= ev.capacity : false;
                              const isDisabled = !isChecked && isCapacityFull;

                              return (
                                <div
                                  key={ev.id}
                                  className={`p-2.5 rounded-xl border text-left transition-all ${
                                    isDisabled
                                      ? "bg-stone-100/90 border-stone-200 opacity-60 cursor-not-allowed select-none"
                                      : isChecked
                                      ? "bg-purple-100/90 border-purple-500 shadow-2xs"
                                      : "bg-white border-purple-100 hover:border-purple-300"
                                  }`}
                                >
                                  <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isDisabled}
                                      onChange={() => toggleMemberEvent(mIdx, ev.id)}
                                      className="mt-0.5 accent-purple-600 rounded disabled:opacity-50"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-1.5">
                                        <span className="font-bold text-xs text-stone-900 leading-snug">
                                          {ev.name}
                                        </span>
                                        {ev.capacity && ev.capacity > 0 && (
                                          <span
                                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                                              isCapacityFull
                                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                                : "bg-purple-100/70 text-purple-800"
                                            }`}
                                          >
                                            {collegeCount}/{ev.capacity} Slots
                                          </span>
                                        )}
                                      </div>
                                      {isDisabled ? (
                                        <div className="text-[10px] font-bold text-rose-600 mt-0.5">
                                          College Capacity Full ({ev.capacity}/{ev.capacity})
                                        </div>
                                      ) : ev.venue ? (
                                        <div className="text-[10px] text-stone-500 truncate">
                                          Venue: {ev.venue}
                                        </div>
                                      ) : null}
                                    </div>
                                  </label>

                                  {/* PRELIMS NOMINATION OPTION */}
                                  {ev.hasPrelims && isChecked && (
                                    <div className="mt-2 pt-2 border-t border-purple-200/80">
                                      {(() => {
                                        const isPrelimsNominated = (member.prelimsEventIds || []).includes(ev.id);
                                        const otherNominee = members.find(
                                          (m, idx) => idx !== mIdx && (m.prelimsEventIds || []).includes(ev.id)
                                        );
                                        const isPrelimsDisabled = !isPrelimsNominated && !!otherNominee;

                                        return (
                                          <label
                                            onClick={(e) => e.stopPropagation()}
                                            className={`flex items-center gap-1.5 text-[10px] font-bold ${
                                              isPrelimsDisabled
                                                ? "text-stone-400 cursor-not-allowed"
                                                : isPrelimsNominated
                                                ? "text-amber-900 font-extrabold"
                                                : "text-stone-700 cursor-pointer"
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isPrelimsNominated}
                                              disabled={isPrelimsDisabled}
                                              onChange={() => toggleMemberPrelims(mIdx, ev.id)}
                                              className="accent-amber-600 rounded cursor-pointer disabled:opacity-40"
                                            />
                                            <span className="inline-flex items-center gap-1">
                                              <Target className="w-3 h-3 text-amber-800 shrink-0" />
                                              <span>Nominate for Prelims</span>
                                            </span>
                                            {isPrelimsDisabled && (
                                              <span className="text-[9px] text-rose-600 font-semibold block ml-1">
                                                (1 student from college already nominated)
                                              </span>
                                            )}
                                          </label>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Off-Stage Competitions Section */}
                        <div className="bg-blue-50/50 border border-blue-200/80 p-3.5 rounded-2xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                              <Laptop className="w-4 h-4 text-blue-600" />
                              <span>Off-Stage Competitions</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                              {member.eventIds.filter((id) => events.find((e) => e.id === id)?.category === "OFF_STAGE").length}/1 Selected
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {events.filter((e) => e.category === "OFF_STAGE").map((ev) => {
                              const isChecked = member.eventIds.includes(ev.id);
                              const collegeCount = members.filter((m) => m.eventIds.includes(ev.id)).length;
                              const isCapacityFull = ev.capacity && ev.capacity > 0 ? collegeCount >= ev.capacity : false;
                              const isDisabled = !isChecked && isCapacityFull;

                              return (
                                <div
                                  key={ev.id}
                                  className={`p-2.5 rounded-xl border text-left transition-all ${
                                    isDisabled
                                      ? "bg-stone-100/90 border-stone-200 opacity-60 cursor-not-allowed select-none"
                                      : isChecked
                                      ? "bg-blue-100/90 border-blue-500 shadow-2xs"
                                      : "bg-white border-blue-100 hover:border-blue-300"
                                  }`}
                                >
                                  <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isDisabled}
                                      onChange={() => toggleMemberEvent(mIdx, ev.id)}
                                      className="mt-0.5 accent-blue-600 rounded disabled:opacity-50"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-1.5">
                                        <span className="font-bold text-xs text-stone-900 leading-snug">
                                          {ev.name}
                                        </span>
                                        {ev.capacity && ev.capacity > 0 && (
                                          <span
                                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                                              isCapacityFull
                                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                                : "bg-blue-100/70 text-blue-800"
                                            }`}
                                          >
                                            {collegeCount}/{ev.capacity} Slots
                                          </span>
                                        )}
                                      </div>
                                      {isDisabled ? (
                                        <div className="text-[10px] font-bold text-rose-600 mt-0.5">
                                          College Capacity Full ({ev.capacity}/{ev.capacity})
                                        </div>
                                      ) : ev.venue ? (
                                        <div className="text-[10px] text-stone-500 truncate">
                                          Venue: {ev.venue}
                                        </div>
                                      ) : null}
                                    </div>
                                  </label>

                                  {/* PRELIMS NOMINATION OPTION */}
                                  {ev.hasPrelims && isChecked && (
                                    <div className="mt-2 pt-2 border-t border-blue-200/80">
                                      {(() => {
                                        const isPrelimsNominated = (member.prelimsEventIds || []).includes(ev.id);
                                        const otherNominee = members.find(
                                          (m, idx) => idx !== mIdx && (m.prelimsEventIds || []).includes(ev.id)
                                        );
                                        const isPrelimsDisabled = !isPrelimsNominated && !!otherNominee;

                                        return (
                                          <label
                                            onClick={(e) => e.stopPropagation()}
                                            className={`flex items-center gap-1.5 text-[10px] font-bold ${
                                              isPrelimsDisabled
                                                ? "text-stone-400 cursor-not-allowed"
                                                : isPrelimsNominated
                                                ? "text-amber-900 font-extrabold"
                                                : "text-stone-700 cursor-pointer"
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isPrelimsNominated}
                                              disabled={isPrelimsDisabled}
                                              onChange={() => toggleMemberPrelims(mIdx, ev.id)}
                                              className="accent-amber-600 rounded cursor-pointer disabled:opacity-40"
                                            />
                                            <span className="inline-flex items-center gap-1">
                                              <Target className="w-3 h-3 text-amber-800 shrink-0" />
                                              <span>Nominate for Prelims</span>
                                            </span>
                                            {isPrelimsDisabled && (
                                              <span className="text-[9px] text-rose-600 font-semibold block ml-1">
                                                (1 student from college already nominated)
                                              </span>
                                            )}
                                          </label>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-6 border-t border-[#1C1917]/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto py-2.5 text-xs font-semibold text-[#57534E] hover:text-[#1C1917] flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to College Info</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setCurrentStep(3);
                  }}
                  className="btn-ember w-full sm:w-auto text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 py-3"
                >
                  <span>Review Summary & Fee Breakdown</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
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
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-2 border-b border-stone-200 gap-0.5 sm:gap-2">
                    <span className="text-stone-500">College / Institution:</span>
                    <strong className="text-stone-900 sm:text-right">{collegeName}</strong>
                  </div>

                  {department && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-2 border-b border-stone-200 gap-0.5 sm:gap-2">
                      <span className="text-stone-500">Department:</span>
                      <span className="font-semibold text-stone-800 sm:text-right">{department}</span>
                    </div>
                  )}

                  {teamName && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-2 border-b border-stone-200 gap-0.5 sm:gap-2">
                      <span className="text-stone-500">Contingent Team Name:</span>
                      <span className="font-semibold text-stone-800 sm:text-right">{teamName}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-2 border-b border-stone-200 gap-0.5 sm:gap-2">
                    <span className="text-stone-500">Contingent Lead:</span>
                    <span className="font-semibold text-stone-900 sm:text-right">
                      {teamLeadName} ({teamLeadPhone})
                    </span>
                  </div>

                  {hasFacultyIncharge && facultyName && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-2 border-b border-stone-200 gap-0.5 sm:gap-2">
                      <span className="text-stone-500">Visiting Faculty Incharge:</span>
                      <span className="font-semibold text-stone-900 sm:text-right">
                        {facultyName} {facultyPhone && `(${facultyPhone})`}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Registered Participants Count:</span>
                    <strong className="text-stone-900">{members.length} Student(s)</strong>
                  </div>

                  <div className="flex justify-between pb-2 border-b border-stone-200">
                    <span className="text-stone-500">Catering Food Breakdown:</span>
                    <span className="font-semibold text-stone-800">
                      🥗 {members.filter((m) => (m.foodPreference || "VEG") === "VEG").length} Veg • 🍗 {members.filter((m) => m.foodPreference === "NON_VEG").length} Non-Veg
                    </span>
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
              <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
                  Participant Roster & Competitions
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            (m.foodPreference || "VEG") === "VEG"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-amber-100 text-amber-900 border border-amber-200"
                          }`}
                        >
                          {(m.foodPreference || "VEG") === "VEG" ? "🥗 Veg" : "🍗 Non-Veg"}
                        </span>
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shrink-0">
                          {m.eventIds.length} Event(s)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Portal Password */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5">
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

              <div className="pt-6 border-t border-[#1C1917]/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto py-2.5 text-xs font-semibold text-[#57534E] hover:text-[#1C1917] flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Roster</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-ember w-full sm:w-auto text-xs sm:text-sm px-6 sm:px-8 py-3.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Badges & Dispatches...</span>
                    </>
                  ) : (
                    <span>
                      Complete Delegation Registration ({members.length} {members.length === 1 ? "Participant" : "Participants"})
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
