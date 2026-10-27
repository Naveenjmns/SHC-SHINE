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
    <div className="bg-surface border border-border rounded-2xl shadow-card p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-xs font-semibold text-ink flex items-center gap-2">
            <Link2 className="w-4 h-4 text-accent" />
            <span>Navigation Menu Links</span>
          </h3>
          <p className="text-xs text-ink-muted">
            Manage links shown in the top navbar and footer.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {navItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2.5 bg-surface-raised border border-border rounded-[8px] text-xs"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleNavItem(item.id, !item.isEnabled)}
                className="text-ink-muted hover:text-ink"
                title={item.isEnabled ? "Hide link" : "Show link"}
              >
                {item.isEnabled ? (
                  <Eye className="w-3.5 h-3.5 text-success" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-ink-muted" />
                )}
              </button>
              <span className="font-semibold text-ink">{item.label}</span>
              <span className="font-mono text-[11px] text-ink-muted">({item.url})</span>
            </div>

            <button
              type="button"
              onClick={() => onDeleteNavItem(item.id)}
              className="text-ink-muted hover:text-danger p-1"
              title="Delete Link"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-border">
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

