import React from "react";
import Link from "next/link";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { CheckCircle2, QrCode, Printer, ArrowRight, Building2, Utensils, Download } from "lucide-react";

interface RegisteredMemberResult {
  id: string;
  name: string;
  email: string;
  badgeCode: string;
  foodTokenCode: string;
  foodPreference: string;
}

interface DelegationResult {
  id: string;
  collegeName: string;
  teamLeadName: string;
  totalFee: number;
  members: RegisteredMemberResult[];
}

interface RegistrationSuccessViewProps {
  delegation: DelegationResult;
}

export default function RegistrationSuccessView({ delegation }: RegistrationSuccessViewProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Success Banner */}
      <Card className="p-6 text-center space-y-3 bg-surface border-success-border">
        <div className="w-12 h-12 rounded-full bg-success-surface border border-success-border flex items-center justify-center mx-auto text-success">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-display text-ink">
            Registration Confirmed!
          </h1>
          <p className="text-xs text-ink-muted max-w-md mx-auto">
            Your delegation has been registered for SHINE 2026. Digital QR passes have been generated below.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-raised border border-border text-xs font-mono text-ink-muted">
          <span>Delegation ID:</span>
          <span className="font-bold text-accent">{delegation.id}</span>
        </div>
      </Card>

      {/* College Info */}
      <Card className="p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-accent shrink-0" />
          <div>
            <div className="font-semibold text-ink">{delegation.collegeName}</div>
            <div className="text-ink-muted">Team Lead: {delegation.teamLeadName}</div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          leftIcon={<Printer className="w-3.5 h-3.5" />}
        >
          Print Passes
        </Button>
      </Card>

      {/* Delegates Badges List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Delegate Badges & QR Tokens ({delegation.members.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {delegation.members.map((member, idx) => (
            <Card key={member.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-ink">{member.name}</div>
                  <div className="text-xs text-ink-muted truncate">{member.email}</div>
                </div>

                <Badge
                  variant={member.foodPreference === "VEG" ? "confirmed" : "pending"}
                  size="sm"
                >
                  {member.foodPreference === "VEG" ? "Pure Veg" : "Non-Veg"}
                </Badge>
              </div>

              <div className="p-2.5 rounded-[6px] bg-surface-raised border border-border space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-subtle">Badge:</span>
                  <span className="font-bold text-ink">{member.badgeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-subtle">Food Token:</span>
                  <span className="font-semibold text-accent">{member.foodTokenCode}</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <Link href={`/badge/${member.badgeCode}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<QrCode className="w-3.5 h-3.5" />}
                  >
                    Digital Pass
                  </Button>
                </Link>

                <span className="text-[11px] text-ink-subtle">Delegate #{idx + 1}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="pt-4 flex items-center justify-between">
        <Link href="/">
          <Button variant="secondary" size="md">
            Return to Homepage
          </Button>
        </Link>

        <Link href="/events">
          <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Explore Competitions
          </Button>
        </Link>
      </div>
    </div>
  );
}

