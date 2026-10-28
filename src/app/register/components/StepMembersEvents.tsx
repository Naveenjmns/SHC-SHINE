import React from "react";
import {
  Input,
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
  Users,
  UserPlus,
  Trash2,
  Utensils,
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertCircle,
} from "lucide-react";

export interface EventOption {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  hasPrelims?: boolean;
}

/** Server rule (/api/register): each delegate may enter at most this many competitions */
export const MAX_EVENTS_PER_DELEGATE = 2;

export interface MemberState {
  name: string;
  email: string;
  phone: string;
  eventIds: string[];
  /** Events (with a prelims round) this delegate is nominated to attend the prelims for */
  prelimsEventIds: string[];
  foodPreference: "VEG" | "NON_VEG";
}

interface StepMembersEventsProps {
  members: MemberState[];
  events: EventOption[];
  onUpdateMember: (index: number, fields: Partial<MemberState>) => void;
  onAddMember: () => void;
  onRemoveMember: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  errors: Record<string, string>;
}

export default function StepMembersEvents({
  members,
  events,
  onUpdateMember,
  onAddMember,
  onRemoveMember,
  onPrev,
  onNext,
  errors,
}: StepMembersEventsProps) {
  const onStageEvents = events.filter((e) => e.category === "ON_STAGE");
  const offStageEvents = events.filter((e) => e.category === "OFF_STAGE");

  const toggleEvent = (memberIdx: number, eventId: string) => {
    const member = members[memberIdx];
    const isRemoving = member.eventIds.includes(eventId);
    if (!isRemoving && member.eventIds.length >= MAX_EVENTS_PER_DELEGATE) return;
    onUpdateMember(memberIdx, {
      eventIds: isRemoving ? member.eventIds.filter((id) => id !== eventId) : [...member.eventIds, eventId],
      // A delegate can only be nominated for the prelims of an event they are entered in
      prelimsEventIds: isRemoving ? member.prelimsEventIds.filter((id) => id !== eventId) : member.prelimsEventIds,
    });
  };

  // Only one delegate per college may be nominated for each event's prelims
  const nominateForPrelims = (memberIdx: number, eventId: string, nominate: boolean) => {
    members.forEach((m, i) => {
      const has = m.prelimsEventIds.includes(eventId);
      if (i === memberIdx && nominate !== has) {
        onUpdateMember(i, {
          prelimsEventIds: nominate ? [...m.prelimsEventIds, eventId] : m.prelimsEventIds.filter((id) => id !== eventId),
        });
      } else if (i !== memberIdx && nominate && has) {
        onUpdateMember(i, { prelimsEventIds: m.prelimsEventIds.filter((id) => id !== eventId) });
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="eyebrow flex items-center gap-2 text-accent">
              <Users className="w-4 h-4" /> Step 2 of 3
            </div>
            <Badge variant="accent">
              {members.length} {members.length === 1 ? "Delegate" : "Delegates"}
            </Badge>
          </div>
          <CardTitle>Delegation Roster & Competition Allocation</CardTitle>
          <CardDescription>
            Add your team participants and assign each student to specific on-stage or off-stage arenas.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Members Cards Stack */}
      <div className="space-y-4">
        {members.map((member, idx) => {
          const isLead = idx === 0;

          return (
            <Card key={idx} className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent-muted text-accent font-bold text-sm flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="text-[15px] font-bold text-ink">
                    {isLead ? "Team Lead (Delegate #1)" : `Delegate #${idx + 1}`}
                  </h3>
                  {isLead && <Badge variant="accent" size="sm">Primary</Badge>}
                </div>

                {!isLead && (
                  <button
                    type="button"
                    onClick={() => onRemoveMember(idx)}
                    className="p-1.5 rounded-[8px] hover:bg-danger-surface text-ink-subtle hover:text-danger transition-colors cursor-pointer text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Delegate Full Name *"
                  placeholder="Student name"
                  value={member.name}
                  onChange={(e) => onUpdateMember(idx, { name: e.target.value })}
                  error={errors[`member_${idx}_name`]}
                />

                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="student@college.edu"
                  value={member.email}
                  onChange={(e) => onUpdateMember(idx, { email: e.target.value })}
                  error={errors[`member_${idx}_email`]}
                />

                <Input
                  label="Mobile Number *"
                  type="tel"
                  placeholder="10 digits"
                  value={member.phone}
                  onChange={(e) => onUpdateMember(idx, { phone: e.target.value })}
                  error={errors[`member_${idx}_phone`]}
                />
              </div>

              {/* Food Preference */}
              <div className="pt-2 border-t border-border flex items-center justify-between gap-4">
                <div className="text-sm font-semibold text-ink flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-accent" /> Meal Token Preference:
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateMember(idx, { foodPreference: "VEG" })}
                    className={`px-3 py-1 rounded-[8px] text-sm font-semibold border transition-colors cursor-pointer ${
                      member.foodPreference === "VEG"
                        ? "bg-success-surface border-success-border text-success-ink"
                        : "bg-surface border-border text-ink-muted hover:bg-surface-raised"
                    }`}
                  >
                    Pure Vegetarian
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateMember(idx, { foodPreference: "NON_VEG" })}
                    className={`px-3 py-1 rounded-[8px] text-sm font-semibold border transition-colors cursor-pointer ${
                      member.foodPreference === "NON_VEG"
                        ? "bg-warning-surface border-warning-border text-warning-ink"
                        : "bg-surface border-border text-ink-muted hover:bg-surface-raised"
                    }`}
                  >
                    Non-Vegetarian
                  </button>
                </div>
              </div>

              {/* Competition Checkboxes */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-ink">
                    Assign Competitions for {member.name || `Delegate #${idx + 1}`} *
                  </div>
                  <span className="text-sm text-ink-subtle">
                    {member.eventIds.length} of {MAX_EVENTS_PER_DELEGATE} assigned
                  </span>
                </div>

                {errors[`member_${idx}_events`] && (
                  <p className="text-sm text-danger font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors[`member_${idx}_events`]}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {events.map((evt) => {
                    const isChecked = member.eventIds.includes(evt.id);
                    const isDisabled = !isChecked && member.eventIds.length >= MAX_EVENTS_PER_DELEGATE;
                    const isNominated = member.prelimsEventIds.includes(evt.id);

                    return (
                      <div
                        key={evt.id}
                        className={`p-2.5 rounded-[8px] border transition-colors space-y-2 ${
                          isChecked
                            ? "bg-accent-muted border-accent text-ink"
                            : isDisabled
                            ? "bg-surface border-border text-ink-subtle opacity-60"
                            : "bg-surface border-border hover:bg-surface-raised text-ink-muted"
                        }`}
                      >
                        <label className={`flex items-start gap-2.5 select-none ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => toggleEvent(idx, evt.id)}
                            className="mt-0.5 rounded-[4px] border-border text-accent focus:ring-accent"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{evt.name}</div>
                            <div className="text-xs text-ink-subtle">
                              {evt.category === "ON_STAGE" ? "On-Stage Arena" : "Off-Stage Challenge"}
                              {evt.hasPrelims ? " · Has prelims round" : ""}
                            </div>
                          </div>
                        </label>
                        {isChecked && evt.hasPrelims && (
                          <label className="flex items-center gap-2 pl-6 text-xs text-ink cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isNominated}
                              onChange={(e) => nominateForPrelims(idx, evt.id, e.target.checked)}
                              className="rounded-[4px] border-border text-accent focus:ring-accent"
                            />
                            Attends the prelims for our college
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Member Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="md"
          onClick={onAddMember}
          leftIcon={<UserPlus className="w-4 h-4 text-accent" />}
        >
          Add Another Delegation Member
        </Button>
      </div>

      {/* Bottom Nav */}
      <div className="pt-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="md"
          onClick={onPrev}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back: Institution
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={onNext}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Next: Review & Confirm
        </Button>
      </div>
    </div>
  );
}

