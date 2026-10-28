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
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-[15px] font-bold text-ink flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-accent" />
            <span>Account Security</span>
          </h3>
          <p className="text-sm text-ink-muted">
            Change your account password for secure festival portal access.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-danger-surface border border-danger-border text-danger-ink rounded-[8px] text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-sm font-semibold text-ink mb-1">
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
            <label className="block text-sm font-semibold text-ink mb-1">
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
            <label className="block text-sm font-semibold text-ink mb-1">
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

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="outline" size="sm" type="submit" loading={changing}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}

