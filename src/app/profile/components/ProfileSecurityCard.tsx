"use client";

import React, { useState } from "react";
import { KeyRound, ShieldCheck, AlertCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface ProfileSecurityCardProps {
  onUpdatePassword: (currentPass: string, newPass: string) => Promise<boolean>;
  changing: boolean;
}

export default function ProfileSecurityCard({
  onUpdatePassword,
  changing,
}: ProfileSecurityCardProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation password do not match.");
      return;
    }

    const success = await onUpdatePassword(currentPassword, newPassword);
    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[var(--accent)]" />
            <span>Account Security</span>
          </h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Change your account password for secure festival portal access.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
            Current Password *
          </label>
          <Input
            required
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              New Password *
            </label>
            <Input
              required
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Confirm New Password *
            </label>
            <Input
              required
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--border)]">
          <Button variant="secondary" size="sm" type="submit" loading={changing}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}

