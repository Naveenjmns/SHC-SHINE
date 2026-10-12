"use client";

import React, { useState } from "react";
import { Link2, Plus, X, Eye, EyeOff } from "lucide-react";
import { Button, Input } from "@/components/ui";

export interface NavItemData {
  id: string;
  label: string;
  url: string;
  order: number;
  isEnabled: boolean;
}

interface AdminNavItemsEditorProps {
  navItems: NavItemData[];
  onAddNavItem: (label: string, url: string) => Promise<void>;
  onDeleteNavItem: (id: string) => Promise<void>;
  onToggleNavItem: (id: string, isEnabled: boolean) => Promise<void>;
}

export default function AdminNavItemsEditor({
  navItems,
  onAddNavItem,
  onDeleteNavItem,
  onToggleNavItem,
}: AdminNavItemsEditorProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newUrl.trim()) return;

    setIsAdding(true);
    try {
      await onAddNavItem(newLabel.trim(), newUrl.trim());
      setNewLabel("");
      setNewUrl("");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[var(--accent)]" />
            <span>Navigation Menu Links</span>
          </h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Manage links shown in the top navbar and footer.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {navItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg text-xs"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleNavItem(item.id, !item.isEnabled)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink)]"
                title={item.isEnabled ? "Hide link" : "Show link"}
              >
                {item.isEnabled ? (
                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                )}
              </button>
              <span className="font-semibold text-[var(--ink)]">{item.label}</span>
              <span className="font-mono text-[11px] text-[var(--ink-muted)]">({item.url})</span>
            </div>

            <button
              type="button"
              onClick={() => onDeleteNavItem(item.id)}
              className="text-[var(--ink-muted)] hover:text-rose-600 p-1"
              title="Delete Link"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-[var(--border)]">
        <Input
          placeholder="Label (e.g. Schedule)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="text-xs h-8"
          required
        />
        <Input
          placeholder="URL (e.g. #schedule)"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="text-xs h-8"
          required
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          loading={isAdding}
          className="h-8 text-xs shrink-0"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </form>
    </div>
  );
}

