"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,
  StatCard,
  Breadcrumbs,
} from "@/components/ui";
import {
  Search,
  ArrowRight,
  Trash2,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react";
import DataDisplayPreviewMatrix from "./DataDisplayPreviewMatrix";

export default function ComponentPreviewMatrix() {
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [radioSelected, setRadioSelected] = useState("student");
  const [isBtnLoading, setIsBtnLoading] = useState(false);

  return (
    <section className="space-y-10">
      <div>
        <h2 className="text-xl font-bold text-ink">3. UI Component Library (src/components/ui/)</h2>
        <p className="text-sm text-ink-muted mt-1">
          Zero external UI framework dependencies. 100% token-based, 8px control / 12px panel radii,
          accessible ARIA roles, and mobile touch targets ≥ 44px.
        </p>
      </div>

      {/* Breadcrumbs Preview */}
      <div className="p-4 rounded-[12px] bg-surface border border-border">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Admin Console", href: "/admin" },
            { label: "Design System Matrix" },
          ]}
        />
      </div>

      {/* StatCards Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          StatCard Primitives (Zero Glow, Hairline Borders)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Registrations"
            value="1,248"
            delta={{ value: "+14.2%", isPositive: true, label: "vs last year" }}
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard
            label="Active Competitions"
            value="14"
            delta={{ value: "4 On-Stage", isNeutral: true }}
            icon={<Calendar className="w-4 h-4" />}
          />
          <StatCard
            label="Pending Reviews"
            value="38"
            delta={{ value: "-6.5%", isPositive: false, label: "unverified badges" }}
            icon={<Sparkles className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Buttons & Loading States */}
      <div className="p-5 border border-border rounded-[12px] bg-surface space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Button Primitives (Sizes sm/md/lg, Variants & Loading State)
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            isLoading={isBtnLoading}
            onClick={() => {
              setIsBtnLoading(true);
              setTimeout(() => setIsBtnLoading(false), 1500);
            }}
          >
            {isBtnLoading ? "Saving..." : "Primary (Click to Load)"}
          </Button>
          <Button variant="secondary" size="md">
            Secondary
          </Button>
          <Button variant="outline" size="md">
            Outline
          </Button>
          <Button variant="danger" size="md" leftIcon={<Trash2 className="w-4 h-4" />}>
            Danger
          </Button>
          <Button variant="ghost" size="md">
            Ghost
          </Button>
          <Button variant="link" size="md">
            Link Button
          </Button>
          <Button variant="primary" size="sm">
            Small (sm)
          </Button>
          <Button variant="primary" size="lg">
            Large (lg)
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </div>

      {/* Form Controls */}
      <div className="p-5 border border-border rounded-[12px] bg-surface space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Form Controls (Inputs, Select, Checkbox, Radio, Switch)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Search Filter"
            placeholder="Search students..."
            startIcon={<Search className="w-4 h-4" />}
            helperText="Type any name, college, or badge ID"
          />
          <Input
            label="Validated Field"
            defaultValue="invalid-email"
            error="Please enter a valid academic email address"
          />
          <Select
            label="Competition Filter"
            options={[
              { value: "ALL", label: "All Competitions (14)" },
              { value: "CODE", label: "Prompt Engineering & Web" },
              { value: "QUIZ", label: "Tech Quiz Arena" },
              { value: "DEBUG", label: "Code Debugging Marathon" },
            ]}
          />
        </div>

        <Textarea
          label="Event Announcement Description"
          placeholder="Enter instructions for student participants..."
          rows={3}
          helperText="Markdown syntax is supported for announcements"
        />

        <div className="pt-2 flex flex-wrap items-center gap-8">
          <Checkbox
            label="SMS Notification"
            description="Send live alerts to student phones"
            checked={checkboxChecked}
            onChange={(e) => setCheckboxChecked(e.target.checked)}
          />

          <div className="flex items-center gap-4">
            <Radio
              name="role-test"
              label="Student"
              checked={radioSelected === "student"}
              onChange={() => setRadioSelected("student")}
            />
            <Radio
              name="role-test"
              label="Coordinator"
              checked={radioSelected === "coordinator"}
              onChange={() => setRadioSelected("coordinator")}
            />
          </div>

          <Switch
            label="Stage Mode Display"
            description="High-contrast 16:9 mode"
            checked={switchChecked}
            onCheckedChange={setSwitchChecked}
          />
        </div>
      </div>

      {/* Data Display Primitives (Badges, Tabs, Table, Cards, Modal, Sheet) */}
      <DataDisplayPreviewMatrix />
    </section>
  );
}
