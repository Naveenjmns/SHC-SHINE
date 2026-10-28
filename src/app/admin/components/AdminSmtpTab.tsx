"use client";

import React, { useState } from "react";
import {
  Mail,
  Server,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Power,
  ShieldCheck,
  UserPlus,
  Users,
  Bell,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button, Input, Textarea, Badge } from "@/components/ui";

interface AdminSmtpTabProps {
  smtpForm: any;
  setSmtpForm: React.Dispatch<React.SetStateAction<any>>;
  savingSmtp: boolean;
  handleSaveSmtp: (e: React.FormEvent) => Promise<void>;
  testEmailAddress: string;
  setTestEmailAddress: (val: string) => void;
  testingSmtp: boolean;
  handleTestSmtp: () => Promise<void>;
  smtpTestResult: { success: boolean; message: string } | null;
  emailTriggers: any;
  savingTriggerKey: string | null;
  handleToggleTrigger: (key: string, val: boolean) => Promise<void>;
  broadcastForm: any;
  setBroadcastForm: React.Dispatch<React.SetStateAction<any>>;
  sendingBroadcast: boolean;
  handleSendBroadcast: (e: React.FormEvent) => Promise<void>;
  eventBreakdown: any[];
  broadcastHistory: any[];
}

export default function AdminSmtpTab({
  smtpForm,
  setSmtpForm,
  savingSmtp,
  handleSaveSmtp,
  testEmailAddress,
  setTestEmailAddress,
  testingSmtp,
  handleTestSmtp,
  smtpTestResult,
  emailTriggers,
  savingTriggerKey,
  handleToggleTrigger,
  broadcastForm,
  setBroadcastForm,
  sendingBroadcast,
  handleSendBroadcast,
  eventBreakdown,
  broadcastHistory,
}: AdminSmtpTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent" />
            <span>SMTP Mail Service &amp; Announcements</span>
          </h2>
          <p className="text-sm text-ink-muted">
            Configure SMTP credentials, manage quota triggers, and dispatch broadcast notifications.
          </p>
        </div>

        <Button
          variant={emailTriggers.emailServiceEnabled ? "outline" : "primary"}
          size="sm"
          onClick={() => handleToggleTrigger("emailServiceEnabled", !emailTriggers.emailServiceEnabled)}
          loading={savingTriggerKey === "emailServiceEnabled"}
          className="self-start sm:self-auto text-sm"
        >
          <Power className="w-3.5 h-3.5 mr-1.5" />
          {emailTriggers.emailServiceEnabled ? "Pause Outgoing Emails" : "Resume Outgoing Emails"}
        </Button>
      </div>

      {/* Action Triggers Grid */}
      <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-ink pb-2 border-b border-border flex items-center justify-between">
          <span>Automated Email Triggers</span>
          <span className="text-xs text-ink-muted font-normal">
            Status: {emailTriggers.emailServiceEnabled ? "Enabled" : "Paused"}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Desk Payment Approval */}
          <div className="p-3 bg-surface-raised border border-border rounded-2xl text-sm flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Desk Payment Approval</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    emailTriggers.sendOnApproval ? "bg-success-surface text-success-ink" : "bg-surface text-ink-muted"
                  }`}
                >
                  {emailTriggers.sendOnApproval ? "Active" : "Off"}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Delivers official QR badge &amp; food pass upon desk verification.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleTrigger("sendOnApproval", !emailTriggers.sendOnApproval)}
              disabled={savingTriggerKey === "sendOnApproval" || !emailTriggers.emailServiceEnabled}
              className="text-sm h-7 w-full"
            >
              Toggle Trigger
            </Button>
          </div>

          {/* Team Lead Consolidated Dossier */}
          <div className="p-3 bg-surface-raised border border-border rounded-2xl text-sm flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Team Lead Dossier</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    emailTriggers.sendOnTeamLeadApproval ? "bg-success-surface text-success-ink" : "bg-surface text-ink-muted"
                  }`}
                >
                  {emailTriggers.sendOnTeamLeadApproval ? "Active" : "Off"}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Consolidated pass links and token list to delegation in-charge.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleTrigger("sendOnTeamLeadApproval", !emailTriggers.sendOnTeamLeadApproval)}
              disabled={savingTriggerKey === "sendOnTeamLeadApproval" || !emailTriggers.emailServiceEnabled}
              className="text-sm h-7 w-full"
            >
              Toggle Trigger
            </Button>
          </div>

          {/* Registration Notice */}
          <div className="p-3 bg-surface-raised border border-border rounded-2xl text-sm flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Initial Registration</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    emailTriggers.sendOnRegistration ? "bg-success-surface text-success-ink" : "bg-surface text-ink-muted"
                  }`}
                >
                  {emailTriggers.sendOnRegistration ? "Active" : "Disabled (Saves Quota)"}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Notice immediately upon web submission before spot fee payment.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleTrigger("sendOnRegistration", !emailTriggers.sendOnRegistration)}
              disabled={savingTriggerKey === "sendOnRegistration" || !emailTriggers.emailServiceEnabled}
              className="text-sm h-7 w-full"
            >
              Toggle Trigger
            </Button>
          </div>
        </div>
      </div>

      {/* Grid: Server Config & Broadcast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMTP Server Configuration */}
        <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Server className="w-4 h-4 text-accent" />
              <span>SMTP Host Settings</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-raised text-ink-muted">
              {smtpForm.host ? "Configured" : "Unset"}
            </span>
          </div>

          <form onSubmit={handleSaveSmtp} className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-ink-muted mb-1">Host *</label>
                <Input
                  required
                  value={smtpForm.host}
                  onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="text-sm h-8 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Port</label>
                <Input
                  disabled
                  value="465 (SSL)"
                  className="text-sm h-8 font-mono bg-surface-raised cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Username / Email *</label>
                <Input
                  required
                  value={smtpForm.user}
                  onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                  placeholder="user@gmail.com"
                  className="text-sm h-8 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  App Password {smtpForm.hasPassword && <span className="text-success">(Saved)</span>}
                </label>
                <Input
                  type="password"
                  value={smtpForm.password}
                  onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                  placeholder={smtpForm.hasPassword ? "••••••••" : "Password"}
                  className="text-sm h-8 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">From Sender Name</label>
                <Input
                  value={smtpForm.fromName}
                  onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                  placeholder="SHINE Coordination"
                  className="text-sm h-8"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">From Sender Email</label>
                <Input
                  type="email"
                  value={smtpForm.fromEmail}
                  onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                  placeholder="noreply@shctpt.edu"
                  className="text-sm h-8 font-mono"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="sm" loading={savingSmtp} className="w-full text-sm">
              Save SMTP Configuration
            </Button>
          </form>

          {/* Test connection */}
          <div className="pt-3 border-t border-border space-y-2">
            <label className="block text-xs font-medium text-ink-muted">
              Send Test Email
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="test.recipient@example.com"
                className="text-sm h-8 flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestSmtp}
                loading={testingSmtp}
                disabled={!smtpForm.host}
                className="text-sm h-8 shrink-0"
              >
                Send Test
              </Button>
            </div>
            {smtpTestResult && (
              <p className={`text-sm ${smtpTestResult.success ? "text-success" : "text-danger"}`}>
                {smtpTestResult.message}
              </p>
            )}
          </div>
        </div>

        {/* Broadcast Announcement Form */}
        <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Send className="w-4 h-4 text-accent" />
              <span>Broadcast Announcement</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-raised text-ink-muted">
              Direct Mailer
            </span>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Audience *
              </label>
              <select
                value={broadcastForm.targetAudience}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                className="w-full px-2.5 py-1 text-sm border border-border rounded-[8px] bg-surface text-ink font-medium h-8 outline-none"
              >
                <option value="ALL">All Registered Delegates</option>
                <option value="EVENT">Specific Competition Delegates</option>
              </select>
            </div>

            {broadcastForm.targetAudience === "EVENT" && (
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">
                  Select Event *
                </label>
                <select
                  required
                  value={broadcastForm.targetEventId}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetEventId: e.target.value })}
                  className="w-full px-2.5 py-1 text-sm border border-border rounded-[8px] bg-surface text-ink h-8 outline-none"
                >
                  <option value="">-- Choose Competition --</option>
                  {eventBreakdown.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.registrationsCount} delegates)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Subject *
              </label>
              <Input
                required
                value={broadcastForm.subject}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                placeholder="Important: Schedule & Reporting Update"
                className="text-sm h-8"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Message Content *
              </label>
              <Textarea
                required
                rows={4}
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                placeholder="Write announcement text..."
                className="text-sm"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={sendingBroadcast}
              className="w-full text-sm"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Dispatch Announcement
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

