import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from "@/components/ui";
import { User, Building2, CheckCircle2, XCircle, Utensils, Award, Clock } from "lucide-react";

export interface LookupRegistration {
  registrationId: string;
  eventId: string;
  eventName: string;
  category: string;
  venue?: string | null;
  attended: boolean;
  checkedInAt?: string | null;
}

export interface LookupMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  badgeCode: string;
  foodTokenCode: string;
  foodPreference: string;
  collegeName: string;
  eventCheckedIn: boolean;
  foodTokenClaimed: boolean;
  registrations: LookupRegistration[];
}

interface CheckInSearchResultCardProps {
  member: LookupMember;
  onToggleEventCheckIn: (registrationId: string, currentAttended: boolean) => void;
  onClaimFood: (memberId: string) => void;
  isProcessing: boolean;
}

export default function CheckInSearchResultCard({
  member,
  onToggleEventCheckIn,
  onClaimFood,
  isProcessing,
}: CheckInSearchResultCardProps) {
  return (
    <Card className="p-6 space-y-4 border-accent/40">
      {/* Delegate Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-ink">{member.name}</h3>
            <Badge
              variant={member.foodPreference === "VEG" ? "confirmed" : "pending"}
              size="sm"
            >
              {member.foodPreference === "VEG" ? "Pure Veg" : "Non-Veg"}
            </Badge>
          </div>
          <div className="text-xs text-ink-muted flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-ink-subtle" />
            <span>{member.collegeName}</span>
          </div>
        </div>

        <div className="px-3 py-2 rounded-[8px] bg-surface-raised text-right text-xs">
          <div className="eyebrow text-[10px]">Badge code</div>
          <div className="font-mono font-bold text-accent-strong">{member.badgeCode}</div>
        </div>
      </div>

      {/* Events Check-In Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-ink">
          Arena Competitions ({member.registrations.length})
        </h4>

        <div className="space-y-2">
          {member.registrations.map((reg) => (
            <div
              key={reg.registrationId}
              className="p-3 rounded-[8px] border border-border bg-surface flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Badge variant="neutral" size="sm">
                    {reg.category}
                  </Badge>
                  <span className="font-semibold text-xs text-ink truncate">
                    {reg.eventName}
                  </span>
                </div>
                {reg.venue && (
                  <div className="text-[11px] text-ink-muted truncate">
                    Venue: {reg.venue}
                  </div>
                )}
              </div>

              <Button
                variant={reg.attended ? "secondary" : "primary"}
                size="sm"
                disabled={isProcessing}
                onClick={() => onToggleEventCheckIn(reg.registrationId, reg.attended)}
                leftIcon={
                  reg.attended ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  ) : undefined
                }
              >
                {reg.attended ? "Checked In" : "Check In"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Meal Token Section */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-accent" /> Lunch Meal Token
          </div>
          <div className="text-[11px] font-mono text-ink-muted">
            Token: {member.foodTokenCode}
          </div>
        </div>

        <Button
          variant={member.foodTokenClaimed ? "secondary" : "primary"}
          size="sm"
          disabled={member.foodTokenClaimed || isProcessing}
          onClick={() => onClaimFood(member.id)}
        >
          {member.foodTokenClaimed ? "Meal Claimed" : "Distribute Meal"}
        </Button>
      </div>
    </Card>
  );
}

