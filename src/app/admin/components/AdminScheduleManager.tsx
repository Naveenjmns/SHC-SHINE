"use client";

import React, { useState } from "react";
import { Clock, MapPin, X, Plus } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";

export interface ScheduleItemData {
  id: string;
  time: string;
  title: string;
  venue?: string | null;
  description?: string | null;
  tag?: string | null;
  order: number;
}

interface AdminScheduleManagerProps {
  scheduleItems: ScheduleItemData[];
  onAddScheduleItem: (item: {
    time: string;
    title: string;
    venue?: string;
    tag?: string;
    description?: string;
  }) => Promise<void>;
  onDeleteScheduleItem: (id: string) => Promise<void>;
}

export default function AdminScheduleManager({
  scheduleItems,
  onAddScheduleItem,
  onDeleteScheduleItem,
}: AdminScheduleManagerProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime) return;

    setIsSubmitting(true);
    try {
      const timeStr = endTime ? `${startTime} - ${endTime}` : startTime;
      await onAddScheduleItem({
        time: timeStr,
        title: title.trim(),
        venue: venue.trim() || undefined,
        tag: tag.trim() || undefined,
        description: description.trim() || undefined,
      });

      setTitle("");
      setVenue("");
      setTag("");
      setDescription("");
      setStartTime("");
      setEndTime("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--accent)]" />
            <span>Dynamic Fest Timeline Schedule</span>
          </h3>
          <p className="text-xs text-[var(--ink-muted)]">
            Manage the schedule timeline shown on the public landing page.
          </p>
        </div>
        <span className="text-xs text-[var(--ink-muted)] font-mono">
          {scheduleItems.length} events scheduled
        </span>
      </div>

      {/* Schedule Items List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {scheduleItems.length === 0 ? (
          <p className="text-xs text-[var(--ink-muted)] py-4 text-center">
            No schedule entries added yet.
          </p>
        ) : (
          scheduleItems.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg text-xs space-y-1 flex items-start justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded border border-[var(--accent)]/20">
                    {item.time}
                  </span>
                  <span className="font-semibold text-[var(--ink)] truncate">
                    {item.title}
                  </span>
                  {item.tag && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-muted)]">
                      {item.tag}
                    </span>
                  )}
                </div>

                {item.venue && (
                  <p className="text-[11px] text-[var(--ink-muted)] flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{item.venue}</span>
                  </p>
                )}

                {item.description && (
                  <p className="text-[11px] text-[var(--ink-muted)] leading-tight">
                    {item.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDeleteScheduleItem(item.id)}
                className="text-[var(--ink-muted)] hover:text-rose-600 p-1 rounded"
                title="Delete Entry"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add New Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-[var(--border)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-[var(--ink-muted)] mb-1">
              Start Time *
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="text-xs h-8 font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--ink-muted)] mb-1">
              End Time (Optional)
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="text-xs h-8 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            placeholder="Title (e.g. Keynote Address)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xs h-8"
            required
          />
          <Input
            placeholder="Tag (e.g. Inauguration, Hackathon)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="text-xs h-8"
          />
        </div>

        <Input
          placeholder="Venue (e.g. SGB Main Hall)"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="text-xs h-8"
        />

        <Textarea
          placeholder="Short description of this session..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="text-xs"
        />

        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={isSubmitting}
          className="w-full text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Schedule Entry
        </Button>
      </form>
    </div>
  );
}

