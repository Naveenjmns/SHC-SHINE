"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegisterStepper from "./components/RegisterStepper";
import StepInstitutionDetails, { InstitutionFormState } from "./components/StepInstitutionDetails";
import StepMembersEvents, { MemberState, EventOption, MAX_EVENTS_PER_DELEGATE } from "./components/StepMembersEvents";
import StepReviewConfirm from "./components/StepReviewConfirm";
import RegistrationSuccessView from "./components/RegistrationSuccessView";
import { safeJson } from "@/lib/safeFetch";
import { isValidEmail, isValidPhone } from "@/lib/validators";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [participantFee, setParticipantFee] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<any | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Institution form state
  const [institution, setInstitution] = useState<InstitutionFormState>({
    collegeName: "",
    department: "",
    teamName: "",
    teamLeadName: "",
    teamLeadEmail: "",
    teamLeadPhone: "",
    staffInchargeName: "",
    staffInchargeEmail: "",
    staffInchargePhone: "",
  });

  // 2. Members roster state (Lead + delegates)
  const [members, setMembers] = useState<MemberState[]>([
    {
      name: "",
      email: "",
      phone: "",
      eventIds: [],
      prelimsEventIds: [],
      foodPreference: "VEG",
    },
  ]);

  // Load the active edition's upcoming events and the per-delegate fee
  useEffect(() => {
    async function loadData() {
      try {
        const [eventsRes, editionRes] = await Promise.all([fetch("/api/events"), fetch("/api/edition/active")]);
        const [data, editionData] = await Promise.all([
          safeJson(eventsRes, { success: false, events: [] }),
          safeJson(editionRes, { success: false, edition: null }),
        ]);
        if (data.success && data.events) {
          const now = Date.now();
          setEvents(
            data.events
              // The server refuses entries once a competition has started
              .filter((e: any) => !e.dateTime || new Date(e.dateTime).getTime() > now)
              .map((e: any) => ({
                id: e.id,
                name: e.name,
                category: e.category,
                fee: e.fee || 0,
                hasPrelims: Boolean(e.hasPrelims),
              }))
          );
        }
        if (editionData.success && editionData.edition) {
          setParticipantFee(Number(editionData.edition.participantFee) || 0);
        }
      } catch (err) {
        console.error("Failed to load events for registration:", err);
      }
    }
    loadData();
  }, []);

  // Sync team lead personal details to Member #0
  const updateInstitution = (fields: Partial<InstitutionFormState>) => {
    setInstitution((prev) => {
      const updated = { ...prev, ...fields };
      // Keep member #0 in sync with team lead details
      setMembers((prevMembers) => {
        const first = { ...prevMembers[0] };
        if (fields.teamLeadName !== undefined) first.name = fields.teamLeadName;
        if (fields.teamLeadEmail !== undefined) first.email = fields.teamLeadEmail;
        if (fields.teamLeadPhone !== undefined) first.phone = fields.teamLeadPhone;
        return [first, ...prevMembers.slice(1)];
      });
      return updated;
    });
  };

  // Validate Step 1
  const handleStep1Next = () => {
    const errs: Record<string, string> = {};
    if (!institution.collegeName.trim()) errs.collegeName = "College name is required";
    if (!institution.teamLeadName.trim()) errs.teamLeadName = "Team lead name is required";
    if (!institution.teamLeadEmail.trim() || !isValidEmail(institution.teamLeadEmail))
      errs.teamLeadEmail = "Valid email is required";
    if (!institution.teamLeadPhone.trim() || !isValidPhone(institution.teamLeadPhone))
      errs.teamLeadPhone = "Valid 10-digit mobile number is required";
    if (institution.staffInchargeEmail.trim() && !isValidEmail(institution.staffInchargeEmail))
      errs.staffInchargeEmail = "Enter a valid email or leave it blank";
    if (institution.staffInchargePhone.trim() && !isValidPhone(institution.staffInchargePhone))
      errs.staffInchargePhone = "Enter a valid 10-digit mobile number or leave it blank";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setCurrentStep(2);
  };

  // Validate Step 2 (mirrors the rules enforced by /api/register)
  const handleStep2Next = () => {
    const errs: Record<string, string> = {};
    const seenEmails = new Map<string, number>();
    members.forEach((m, idx) => {
      if (!m.name.trim()) errs[`member_${idx}_name`] = "Name is required";
      if (!m.email.trim() || !isValidEmail(m.email)) errs[`member_${idx}_email`] = "Valid email is required";
      else {
        const key = m.email.trim().toLowerCase();
        if (seenEmails.has(key)) errs[`member_${idx}_email`] = `Same email as Delegate #${seenEmails.get(key)! + 1}`;
        else seenEmails.set(key, idx);
      }
      if (!m.phone.trim() || !isValidPhone(m.phone)) errs[`member_${idx}_phone`] = "10-digit phone is required";
      if (m.eventIds.length === 0) errs[`member_${idx}_events`] = "Assign at least 1 competition";
      else if (m.eventIds.length > MAX_EVENTS_PER_DELEGATE)
        errs[`member_${idx}_events`] = `At most ${MAX_EVENTS_PER_DELEGATE} competitions per delegate`;
    });

    // Every chosen competition with a prelims round needs exactly one nominated delegate
    for (const ev of events.filter((e) => e.hasPrelims)) {
      const entrants = members.map((m, idx) => ({ m, idx })).filter(({ m }) => m.eventIds.includes(ev.id));
      if (entrants.length === 0) continue;
      const nominated = entrants.filter(({ m }) => m.prelimsEventIds.includes(ev.id));
      if (nominated.length !== 1) {
        errs[`member_${entrants[0].idx}_events`] = `"${ev.name}" has a prelims round: tick "Attends the prelims" for exactly one delegate`;
      }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setCurrentStep(3);
  };

  const handleAddMember = () => {
    setMembers((prev) => [
      ...prev,
      { name: "", email: "", phone: "", eventIds: [], prelimsEventIds: [], foodPreference: "VEG" },
    ]);
  };

  const handleRemoveMember = (index: number) => {
    if (index === 0) return; // Cannot remove team lead
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMember = (index: number, fields: Partial<MemberState>) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...fields } : m))
    );
  };

  // Submit to /api/register
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        collegeName: institution.collegeName,
        department: institution.department || null,
        teamName: institution.teamName || null,
        teamLead: {
          name: institution.teamLeadName,
          email: institution.teamLeadEmail,
          phone: institution.teamLeadPhone,
        },
        staffIncharge: institution.staffInchargeName.trim()
          ? {
              name: institution.staffInchargeName,
              email: institution.staffInchargeEmail,
              phone: institution.staffInchargePhone,
            }
          : null,
        members: members.map((m) => ({
          name: m.name,
          email: m.email,
          phone: m.phone,
          eventIds: m.eventIds,
          prelimsEventIds: m.prelimsEventIds.filter((id) => m.eventIds.includes(id)),
          foodPreference: m.foodPreference,
        })),
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res, { success: false, message: "Server error" });

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit registration");
      }

      // The API returns the delegates alongside (not inside) the delegation
      setRegistrationResult({ ...data.delegation, members: data.delegates || [] });
    } catch (err: any) {
      setSubmitError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-28 pb-16">
        {registrationResult ? (
          <RegistrationSuccessView delegation={registrationResult} />
        ) : (
          <div className="space-y-6">
            <RegisterStepper
              currentStep={currentStep}
              // Only allow going back; moving forward must pass each step's validation
              onStepClick={(step) => step < currentStep && setCurrentStep(step)}
            />

            {currentStep === 1 && (
              <StepInstitutionDetails
                formData={institution}
                onChange={updateInstitution}
                onNext={handleStep1Next}
                errors={errors}
              />
            )}

            {currentStep === 2 && (
              <StepMembersEvents
                members={members}
                events={events}
                onUpdateMember={handleUpdateMember}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onPrev={() => setCurrentStep(1)}
                onNext={handleStep2Next}
                errors={errors}
              />
            )}

            {currentStep === 3 && (
              <StepReviewConfirm
                institution={institution}
                members={members}
                events={events}
                participantFee={participantFee}
                onPrev={() => setCurrentStep(2)}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
              />
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
