"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegisterStepper from "./components/RegisterStepper";
import StepInstitutionDetails, { InstitutionFormState } from "./components/StepInstitutionDetails";
import StepMembersEvents, { MemberState, EventOption } from "./components/StepMembersEvents";
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
      foodPreference: "VEG",
    },
  ]);

  // Load events
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/events");
        const data = await safeJson(res, { success: false, events: [] });
        if (data.success && data.events) {
          setEvents(
            data.events.map((e: any) => ({
              id: e.id,
              name: e.name,
              category: e.category,
              fee: e.fee || 0,
            }))
          );
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

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setCurrentStep(2);
  };

  // Validate Step 2
  const handleStep2Next = () => {
    const errs: Record<string, string> = {};
    members.forEach((m, idx) => {
      if (!m.name.trim()) errs[`member_${idx}_name`] = "Name is required";
      if (!m.email.trim() || !isValidEmail(m.email)) errs[`member_${idx}_email`] = "Valid email is required";
      if (!m.phone.trim() || !isValidPhone(m.phone)) errs[`member_${idx}_phone`] = "10-digit phone is required";
      if (m.eventIds.length === 0) errs[`member_${idx}_events`] = "Assign at least 1 competition";
    });

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
      { name: "", email: "", phone: "", eventIds: [], foodPreference: "VEG" },
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
        teamLeadName: institution.teamLeadName,
        teamLeadEmail: institution.teamLeadEmail,
        teamLeadPhone: institution.teamLeadPhone,
        staffInchargeName: institution.staffInchargeName || null,
        staffInchargePhone: institution.staffInchargePhone || null,
        members: members.map((m) => ({
          name: m.name,
          email: m.email,
          phone: m.phone,
          eventIds: m.eventIds,
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

      setRegistrationResult(data.delegation);
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
              onStepClick={(step) => setCurrentStep(step)}
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
