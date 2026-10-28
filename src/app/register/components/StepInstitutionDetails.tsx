import React from "react";
import { Input, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Building2, User, Phone, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export interface InstitutionFormState {
  collegeName: string;
  department: string;
  teamName: string;
  teamLeadName: string;
  teamLeadEmail: string;
  teamLeadPhone: string;
  staffInchargeName: string;
  staffInchargeEmail: string;
  staffInchargePhone: string;
}

interface StepInstitutionDetailsProps {
  formData: InstitutionFormState;
  onChange: (fields: Partial<InstitutionFormState>) => void;
  onNext: () => void;
  errors: Record<string, string>;
}

export default function StepInstitutionDetails({
  formData,
  onChange,
  onNext,
  errors,
}: StepInstitutionDetailsProps) {
  return (
    <Card className="max-w-3xl mx-auto rounded-3xl">
      <CardHeader>
        <div className="eyebrow flex items-center gap-2 text-accent">
          <Building2 className="w-4 h-4" /> Step 1 of 3
        </div>
        <CardTitle>Institution & Delegation Details</CardTitle>
        <CardDescription>
          Enter your affiliated institution information and primary student team lead contact details.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* Institution Fields */}
        <div className="space-y-4">
          <h3 className="text-[15px] font-semibold text-ink">
            College Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="College / Institution Full Name *"
                placeholder="e.g. Loyola College (Autonomous)"
                value={formData.collegeName}
                onChange={(e) => onChange({ collegeName: e.target.value })}
                error={errors.collegeName}
                startIcon={<Building2 className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Department / Program"
              placeholder="e.g. Department of Computer Science (PG)"
              value={formData.department}
              onChange={(e) => onChange({ department: e.target.value })}
            />

            <Input
              label="Delegation / Team Name (Optional)"
              placeholder="e.g. Loyola Tech Knights"
              value={formData.teamName}
              onChange={(e) => onChange({ teamName: e.target.value })}
            />
          </div>
        </div>

        {/* Team Lead Fields */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-[15px] font-semibold text-ink">
            Primary Team Lead Contact (Student)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Team Lead Full Name *"
                placeholder="Full name as printed on College ID"
                value={formData.teamLeadName}
                onChange={(e) => onChange({ teamLeadName: e.target.value })}
                error={errors.teamLeadName}
                startIcon={<User className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Academic Email Address *"
              type="email"
              placeholder="teamlead@college.edu"
              value={formData.teamLeadEmail}
              onChange={(e) => onChange({ teamLeadEmail: e.target.value })}
              error={errors.teamLeadEmail}
              startIcon={<Mail className="w-4 h-4" />}
              helperText="Pass codes and symposium updates will be sent here"
            />

            <Input
              label="Contact Phone Number *"
              type="tel"
              placeholder="10-digit mobile number"
              value={formData.teamLeadPhone}
              onChange={(e) => onChange({ teamLeadPhone: e.target.value })}
              error={errors.teamLeadPhone}
              startIcon={<Phone className="w-4 h-4" />}
              helperText="For urgent coordinate desk announcements"
            />
          </div>
        </div>

        {/* Faculty In-Charge (Optional) */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-ink">
              Faculty / Staff In-Charge (Optional)
            </h3>
            <span className="text-sm text-ink-subtle">Recommended for official letters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Faculty Advisor Name"
              placeholder="Prof. / Dr. Full Name"
              value={formData.staffInchargeName}
              onChange={(e) => onChange({ staffInchargeName: e.target.value })}
            />

            <Input
              label="Faculty Phone Number"
              type="tel"
              placeholder="Mobile number"
              value={formData.staffInchargePhone}
              onChange={(e) => onChange({ staffInchargePhone: e.target.value })}
            />
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-border flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={onNext}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Next: Add Delegation Members
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

