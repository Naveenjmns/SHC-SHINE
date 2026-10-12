"use client";

import React, { useState } from "react";
import { Modal, Input, Button, Select, DialogFooter } from "@/components/ui";
import { Trophy, Award, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";

export interface ScoreRegistration {
  id: string;
  name: string;
  college: string;
  score: number | null;
  result: string | null;
}

interface CoordinatorScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: ScoreRegistration | null;
  onSaved: () => void;
}

export default function CoordinatorScoreModal({
  isOpen,
  onClose,
  registration,
  onSaved,
}: CoordinatorScoreModalProps) {
  const { toast } = useToast();

  const [score, setScore] = useState<string>(
    registration?.score !== null && registration?.score !== undefined
      ? String(registration.score)
      : ""
  );
  const [result, setResult] = useState<string>(registration?.result || "NONE");
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (registration) {
      setScore(registration.score !== null ? String(registration.score) : "");
      setResult(registration.result || "NONE");
    }
  }, [registration]);

  if (!registration) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const parsedScore = score.trim() !== "" ? parseFloat(score) : null;
      const parsedResult = result !== "NONE" ? result : null;

      const res = await fetch(`/api/events/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.id,
          score: parsedScore,
          result: parsedResult,
        }),
      });

      const data = await safeJson(res, { success: false });
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save score");
      }

      toast.success("Score and result updated successfully", "Score Saved");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Could not save score", "Error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Award Result & Score Entry"
      description={`${registration.name} • ${registration.college}`}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <Input
          label="Numerical Score (Points / 100)"
          type="number"
          placeholder="e.g. 95"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />

        <Select
          label="Award / Finalist Standing"
          value={result}
          onChange={(e) => setResult(e.target.value)}
          options={[
            { value: "NONE", label: "No Award (Participation)" },
            { value: "FIRST", label: "1st Place Winner (Gold)" },
            { value: "SECOND", label: "2nd Place Runner-Up" },
            { value: "THIRD", label: "3rd Place Second Runner-Up" },
            { value: "FINALIST", label: "Stage Finalist" },
            { value: "SPECIAL", label: "Special Mention" },
          ]}
        />

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Save Result
          </Button>
        </DialogFooter>
      </div>
    </Modal>
  );
}

