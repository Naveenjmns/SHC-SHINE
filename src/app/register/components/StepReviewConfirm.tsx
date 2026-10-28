import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Checkbox,
} from "@/components/ui";
import {
  ReceiptIndianRupee,
  Building2,
  Users,
  Utensils,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { InstitutionFormState } from "./StepInstitutionDetails";
import { MemberState, EventOption } from "./StepMembersEvents";

interface StepReviewConfirmProps {
  institution: InstitutionFormState;
  members: MemberState[];
  events: EventOption[];
  participantFee: number;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

export default function StepReviewConfirm({
  institution,
  members,
  events,
  participantFee = 0,
  onPrev,
  onSubmit,
  isSubmitting,
  submitError,
}: StepReviewConfirmProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Compute live fee summary
  const totalDelegates = members.length;
  const totalRegistrationFee = totalDelegates * participantFee;

  const getEventName = (id: string) => {
    return events.find((e) => e.id === id)?.name || id;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="eyebrow flex items-center gap-2 text-accent">
            <CheckCircle2 className="w-4 h-4" /> Step 3 of 3
          </div>
          <CardTitle>Review Delegation & Live Fee Summary</CardTitle>
          <CardDescription>
            Verify your delegation details before final submission. Instant QR passes will be generated.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Institution & Team Lead Summary */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <Building2 className="w-4 h-4 text-accent" /> Affiliated Institution
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-ink-muted">College Name:</div>
            <div className="font-semibold text-ink text-[15px] mt-0.5">{institution.collegeName}</div>
            {institution.department && (
              <div className="text-ink-subtle mt-0.5">{institution.department}</div>
            )}
          </div>

          <div>
            <div className="text-ink-muted">Team Lead:</div>
            <div className="font-semibold text-ink text-[15px] mt-0.5">{institution.teamLeadName}</div>
            <div className="text-ink-subtle mt-0.5">
              {institution.teamLeadEmail} • {institution.teamLeadPhone}
            </div>
          </div>
        </div>
      </Card>

      {/* Roster & Event Allocations */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <Users className="w-4 h-4 text-accent" /> Registered Delegates ({members.length})
          </div>
        </div>

        <div className="divide-y divide-border">
          {members.map((m, idx) => (
            <div key={idx} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-ink">
                  {idx + 1}. {m.name}
                  {idx === 0 && <span className="ml-1.5 text-accent text-xs font-bold">(Lead)</span>}
                </div>
                <Badge variant={m.foodPreference === "VEG" ? "confirmed" : "pending"} size="sm">
                  {m.foodPreference === "VEG" ? "Pure Veg" : "Non-Veg"}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1">
                {m.eventIds.map((evtId) => (
                  <span
                    key={evtId}
                    className="inline-block px-2 py-0.5 rounded-full bg-surface-raised text-xs font-medium text-ink-muted"
                  >
                    {getEventName(evtId)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Live Fee Summary */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <ReceiptIndianRupee className="w-4 h-4 text-accent" /> Live Fee Summary
          </div>
          <Badge variant="accent">Official Registration</Badge>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Per-Delegate Fee:</span>
            <span>{participantFee === 0 ? "Complimentary (₹0)" : `₹${participantFee}`}</span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Total Registered Delegates:</span>
            <span>{totalDelegates} Students</span>
          </div>
          <div className="pt-2 border-t border-border flex justify-between font-bold text-[15px] text-ink">
            <span>Total Payable Amount:</span>
            <span className="text-base text-accent">
              {totalRegistrationFee === 0 ? "₹0 (Free / Host Subsidized)" : `₹${totalRegistrationFee}`}
            </span>
          </div>
        </div>
      </Card>

      {/* Terms & Code of Conduct */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-card">
        <Checkbox
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          label="Symposium Code of Conduct"
          description="I confirm that all team members are bona fide students with valid college ID cards. We agree to adhere to the symposium regulations and event rules."
        />
      </div>

      {submitError && (
        <div className="p-4 rounded-2xl bg-danger-surface border border-danger-border text-sm text-danger-ink flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <div>{submitError}</div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 flex items-center justify-between">
        <Button
          variant="outline"
          size="md"
          onClick={onPrev}
          disabled={isSubmitting}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back: Roster
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={onSubmit}
          isLoading={isSubmitting}
          disabled={!agreedToTerms || isSubmitting}
          rightIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          {isSubmitting ? "Generating Passes..." : "Complete & Generate Badges"}
        </Button>
      </div>
    </div>
  );
}

