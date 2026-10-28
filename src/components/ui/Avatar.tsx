"use client";

import React, { useState } from "react";
import Image from "next/image";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { dimension: number; classes: string; textClass: string }> = {
  xs: { dimension: 24, classes: "w-6 h-6", textClass: "text-[10px]" },
  sm: { dimension: 32, classes: "w-8 h-8", textClass: "text-xs" },
  md: { dimension: 40, classes: "w-10 h-10", textClass: "text-sm" },
  lg: { dimension: 48, classes: "w-12 h-12", textClass: "text-base" },
  xl: { dimension: 64, classes: "w-16 h-16", textClass: "text-xl" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = "md",
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const { dimension, classes, textClass } = sizeMap[size];
  const initials = getInitials(name);

  return (
    <div
      className={`relative rounded-full border border-border bg-surface-raised flex items-center justify-center shrink-0 overflow-hidden select-none ${classes} ${className}`}
    >
      {src && !imageError ? (
        <Image
          src={src}
          alt={name}
          width={dimension}
          height={dimension}
          className="object-cover w-full h-full"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={`font-semibold text-ink-muted uppercase ${textClass}`}>
          {initials}
        </span>
      )}
    </div>
  );
}
