"use client";

import { useToast } from "@/components/ToastProvider";
import { safeJson } from "@/lib/safeFetch";
import React, { useState } from "react";
import { Modal, Input, Button } from "@/components/ui";

interface AdminNewEditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditionCreated: () => void;
}

export default function AdminNewEditionModal({
  isOpen,
  onClose,
  onEditionCreated,
}: AdminNewEditionModalProps) {
  const [name, setName] = useState("");
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [tagline, setTagline] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/edition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          edition: year.trim(),
          tagline: tagline.trim() || undefined,
        }),
      });
      const data = await safeJson(res, { success: false });
      if (res.ok && data.success) {
        toast.success(`${name.trim()} ${year.trim()} created.`);
        onClose();
        onEditionCreated();
      } else {
        toast.error(data.error || data.message || "Failed to create edition.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create edition.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Event Edition">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-1">
            Fest Title *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. TechFest"
            className="text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-1">
            Edition Tag / Year *
          </label>
          <Input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-ink-muted mb-1">
            Tagline
          </label>
          <Input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. Ignite The Future"
            className="text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={creating}>
            Create Edition
          </Button>
        </div>
      </form>
    </Modal>
  );
}

