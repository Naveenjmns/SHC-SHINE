import React from "react";
import { Check } from "lucide-react";

interface RegisterStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const STEPS = [
  { step: 1, title: "Institution", subtitle: "College & Team Lead" },
  { step: 2, title: "Members", subtitle: "Events & Food Preference" },
  { step: 3, title: "Review", subtitle: "Fee Summary & Confirm" },
];

export default function RegisterStepper({ currentStep, onStepClick }: RegisterStepperProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 select-none">
        {STEPS.map((s) => {
          const isCompleted = s.step < currentStep;
          const isCurrent = s.step === currentStep;

          return (
            <div
              key={s.step}
              onClick={() => isCompleted && onStepClick?.(s.step)}
              className={`p-3 sm:p-4 rounded-2xl border transition-colors flex items-center gap-3 ${
                isCurrent
                  ? "bg-surface border-accent text-ink shadow-card"
                  : isCompleted
                  ? "bg-surface border-border text-ink hover:border-accent cursor-pointer"
                  : "bg-surface border-border text-ink-subtle"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
                  isCurrent
                    ? "bg-accent text-accent-ink"
                    : isCompleted
                    ? "bg-accent-muted text-accent-strong"
                    : "bg-surface-raised text-ink-subtle"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : s.step}
              </div>

              <div className="min-w-0">
                <div
                  className={`text-[15px] font-semibold truncate ${
                    isCurrent ? "text-accent font-bold" : isCompleted ? "text-ink" : "text-ink-subtle"
                  }`}
                >
                  {s.title}
                </div>
                <div className="text-sm text-ink-muted truncate hidden sm:block">
                  {s.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

