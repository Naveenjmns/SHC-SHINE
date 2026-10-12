"use client";

import React, { useState, useEffect } from "react";
import { X, Shield, Utensils, GraduationCap, User, KeyRound } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { UserItem } from "./AdminUsersTable";
import { isValidEmail, isValidPhone } from "@/lib/validators";

export interface FestEventOption {
  id: string;
  name: string;
  category: "ON_STAGE" | "OFF_STAGE";
}

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null; // null = create mode
  availableEvents: FestEventOption[];
  onSave: (payload: any) => Promise<void>;
  saving: boolean;
}

export default function AdminUserModal({
  isOpen,
  onClose,
  user,
  availableEvents,
  onSave,
  saving,
}: AdminUserModalProps) {
  const isEdit = Boolean(user);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("Sacred Heart College (Autonomous)");
  const [role, setRole] = useState<"STUDENT" | "COORDINATOR" | "FOOD_COORDINATOR" | "ADMIN">("COORDINATOR");
  const [password, setPassword] = useState("");
  const [assignedEventIds, setAssignedEventIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || "");
      setCollege(user.college || "");
      setRole(user.role);
      setPassword("");
      setAssignedEventIds(user.assignedEvents?.map((e) => e.id) || []);
      setErrorMsg("");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCollege("Sacred Heart College (Autonomous)");
      setRole("COORDINATOR");
      setPassword("");
      setAssignedEventIds([]);
      setErrorMsg("");
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (phone.trim() && !isValidPhone(phone)) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!isEdit && !password.trim()) {
      setErrorMsg("Password is required for new accounts.");
      return;
    }

    await onSave({
      id: user?.id,
      name,
      email,
      phone: phone.trim() || null,
      college: college.trim() || null,
      role,
      password: password.trim() ? password : undefined,
      assignedEventIds: role === "COORDINATOR" ? assignedEventIds : [],
    });
  };

  const toggleEventAssignment = (eventId: string) => {
    setAssignedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
          <div>
            <h3 className="text-base font-bold text-[var(--ink)]">
              {isEdit ? `Edit User: ${user?.name}` : "Create New User Account"}
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              {isEdit ? "Update user role, college affiliation, or password." : "Add a coordinator, admin, or staff user."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-raised)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {/* Role Picker */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              Account Role *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { r: "COORDINATOR", label: "Coordinator", icon: GraduationCap },
                { r: "FOOD_COORDINATOR", label: "Food Desk", icon: Utensils },
                { r: "ADMIN", label: "Admin", icon: Shield },
                { r: "STUDENT", label: "Student", icon: User },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = role === item.r;
                return (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => setRole(item.r as any)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[var(--surface-raised)] border-[var(--accent)] text-[var(--accent)] shadow-xs"
                        : "bg-[var(--surface)] border-[var(--border)] text-[var(--ink-muted)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Full Name *
              </label>
              <Input
                required
                placeholder="e.g. Dr. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Email Address *
              </label>
              <Input
                required
                type="email"
                placeholder="user@shctpt.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Phone & College */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Mobile Number
              </label>
              <Input
                type="tel"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                College Affiliation
              </label>
              <Input
                placeholder="Sacred Heart College (Autonomous)"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{isEdit ? "Change Password (Leave blank to keep current)" : "Password *"}</span>
            </label>
            <Input
              type="password"
              placeholder={isEdit ? "••••••••" : "Minimum 6 characters"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Coordinator Event Assignment */}
          {role === "COORDINATOR" && availableEvents.length > 0 && (
            <div className="p-3.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl space-y-2">
              <div className="text-xs font-bold text-[var(--ink)] flex items-center justify-between">
                <span>Assign Competition Arenas</span>
                <span className="text-[10px] text-[var(--ink-muted)]">
                  {assignedEventIds.length} selected
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {availableEvents.map((ev) => {
                  const isChecked = assignedEventIds.includes(ev.id);
                  return (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] cursor-pointer hover:border-[var(--accent)] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEventAssignment(ev.id)}
                        className="rounded accent-[var(--accent)]"
                      />
                      <span className="truncate">{ev.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)] shrink-0">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              {isEdit ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

