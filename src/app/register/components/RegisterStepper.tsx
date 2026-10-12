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
              className={`p-3 rounded-[8px] border transition-all flex items-center gap-3 ${
                isCurrent
                  ? "bg-accent-muted border-accent text-ink"
                  : isCompleted
                  ? "bg-surface-raised border-border text-ink hover:border-border-strong cursor-pointer"
                  : "bg-surface border-border text-ink-subtle opacity-70"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                  isCurrent
                    ? "bg-accent text-accent-ink"
                    : isCompleted
                    ? "bg-success text-white"
                    : "bg-surface-sunken text-ink-subtle"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : s.step}
              </div>

              <div className="min-w-0">
                <div
                  className={`text-xs font-semibold truncate ${
                    isCurrent ? "text-accent font-bold" : "text-ink"
                  }`}
                >
                  {s.title}
                </div>
                <div className="text-[11px] text-ink-muted truncate hidden sm:block">
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

