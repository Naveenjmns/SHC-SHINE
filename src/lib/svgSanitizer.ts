/**
 * SVG Sanitization and Zone Extraction Utility
 *
 * Enforces strict security validation on uploaded SVG floor plans:
 * - Strips any <script> tags and embedded executable scripts
 * - Strips on* event handlers (onload, onclick, onerror, etc.)
 * - Strips <foreignObject> elements
 * - Strips external href/xlink:href URIs while allowing safe internal fragment references (#id)
 * - Strips external entity injections, stylesheets, iframes, and malicious CSS expressions
 */

import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";

export interface SanitizedSvgResult {
  sanitized: string;
  isValid: boolean;
  error?: string;
  zoneCount?: number;
}

export interface SvgZoneInfo {
  id: string;
  label: string;
  type: "hall" | "amenity" | "room" | "zone";
}

/**
 * Converts a machine zone ID into a clean human-readable label.
 * e.g. "hall-1" -> "Hall 1", "amenity-restroom-1" -> "Restroom 1", "food-area" -> "Food Area"
 */
export function formatZoneLabel(id: string): string {
  if (!id) return "";

  // Strip common prefixes for labels
  let clean = id;
  if (clean.startsWith("amenity-")) {
    clean = clean.replace(/^amenity-/, "");
  }

  // Split by hyphens or underscores
  const words = clean
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => {
      // Keep numbers as is, capitalize words
      if (/^\d+$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });

  return words.join(" ");
}

/**
 * Categorize zone based on its ID naming pattern
 */
export function categorizeZone(id: string): "hall" | "amenity" | "room" | "zone" {
  const lower = id.toLowerCase();
  if (lower.startsWith("amenity-") || lower.includes("restroom") || lower.includes("water") || lower.includes("washroom") || lower.includes("helpdesk")) {
    return "amenity";
  }
  if (lower.startsWith("hall") || lower.includes("auditorium") || lower.includes("audi") || lower.includes("lab") || lower.includes("room")) {
    return "hall";
  }
  if (lower.includes("food") || lower.includes("sponsor") || lower.includes("booth") || lower.includes("showcase") || lower.includes("entrance")) {
    return "room";
  }
  return "zone";
}

/**
 * Sanitizes an SVG string removing any XSS or external resource vectors.
 */
export function sanitizeSvg(svgRaw: string): SanitizedSvgResult {
  if (!svgRaw || typeof svgRaw !== "string") {
    return { sanitized: "", isValid: false, error: "Empty or invalid SVG content." };
  }

  const trimmed = svgRaw.trim();

  // Basic check for SVG tags
  if (!/<svg[\s>]/i.test(trimmed) || !/<\/svg>/i.test(trimmed)) {
    return { sanitized: "", isValid: false, error: "File does not contain valid <svg> root elements." };
  }

  let sanitized = trimmed;

  // 1. Remove XML processing instructions, doctype, and stylesheets
  sanitized = sanitized.replace(/<\?xml-stylesheet[^>]*\?>/gi, "");
  sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, "");
  sanitized = sanitized.replace(/<!ENTITY[^>]*>/gi, "");

  // 2. Remove <script> tags completely (including all contents)
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  sanitized = sanitized.replace(/<script\b[^>]*\/>/gi, "");

  // 3. Remove <foreignObject> tags completely
  sanitized = sanitized.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, "");
  sanitized = sanitized.replace(/<foreignObject\b[^>]*\/>/gi, "");

  // 4. Remove potentially dangerous embedded elements: iframe, object, embed, applet, meta, link
  sanitized = sanitized.replace(/<(?:iframe|object|embed|applet|meta|link)\b[^>]*>(?:.*?<\/(?:iframe|object|embed|applet|meta|link)>)?/gi, "");
  sanitized = sanitized.replace(/<(?:iframe|object|embed|applet|meta|link)\b[^>]*\/>/gi, "");

  // 5. Remove on* event handler attributes (onload, onclick, onerror, onmouseover, etc.)
  sanitized = sanitized.replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 6. Sanitize href and xlink:href: allow only fragment links (#id) or local relative URLs; block javascript:, data:, http:, https:, //
  sanitized = sanitized.replace(/\s+(?:xlink:)?href\s*=\s*["']([^"']*)["']/gi, (match, url) => {
    const cleanUrl = url.trim();
    // Allow internal references like href="#hall-1" or href="#linear-gradient-1"
    if (cleanUrl.startsWith("#")) {
      return match;
    }
    // Block javascript:, data:, external http, https, protocol-relative //
    if (/^(?:javascript|data|vbscript|file|about|blob):/i.test(cleanUrl) || /^https?:\/\//i.test(cleanUrl) || /^\/\//.test(cleanUrl)) {
      return "";
    }
    return match;
  });

  // 7. Sanitize <style> tags to remove expression(...) and external url(...)
  sanitized = sanitized.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_match, cssContent) => {
    let safeCss = cssContent;
    // Remove expression(...)
    safeCss = safeCss.replace(/expression\s*\([^)]*\)/gi, "");
    // Remove -moz-binding, @import
    safeCss = safeCss.replace(/@import\b[^;]*;/gi, "");
    safeCss = safeCss.replace(/-moz-binding\s*:[^;]*;/gi, "");
    // Remove external url(...)
    safeCss = safeCss.replace(/url\s*\(\s*["']?(?:https?:|\/\/|data:|javascript:)[^)"']*["']?\s*\)/gi, "none");
    return `<style>${safeCss}</style>`;
  });

  // Final validation check to guarantee no remaining <script or on* handlers survived
  if (/<script/i.test(sanitized) || /\son[a-z]+\s*=/i.test(sanitized) || /<foreignObject/i.test(sanitized)) {
    return { sanitized: "", isValid: false, error: "SVG contains unremovable executable scripts or handlers." };
  }

  return {
    sanitized,
    isValid: true,
  };
}

/**
 * Parses zone elements from an SVG string.
 *
 * SVG Convention:
 * - Every room is a closed shape (path, rect, polygon, circle, ellipse, g) with an `id`.
 * - Excludes waypoints (ids starting with `wp-` or children of `<g id="waypoints">`).
 * - Excludes structural groups like `walls`, `corridors`, `grid`, `background`, `canvas`.
 */
export function extractZonesFromSvg(svgContent: string): SvgZoneInfo[] {
  if (!svgContent || typeof svgContent !== "string") return [];

  const zonesMap = new Map<string, SvgZoneInfo>();

  // Regex to extract elements with an id attribute
  // Matches tags like <path id="hall-1" ...>, <rect id="hall-2" ...>, <g id="sponsor-booths" ...>
  const tagWithIdRegex = /<(path|rect|polygon|polyline|circle|ellipse|g)\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi;

  const ignoredIds = new Set([
    "root",
    "svg",
    "layer",
    "background",
    "bg",
    "walls",
    "corridors",
    "waypoints",
    "amenities",
    "labels",
    "grid",
    "defs",
    "clipPath",
    "mask",
  ]);

  let match: RegExpExecArray | null;
  while ((match = tagWithIdRegex.exec(svgContent)) !== null) {
    const rawId = match[2]?.trim();
    if (!rawId) continue;

    // Skip waypoints (start with wp-)
    if (rawId.startsWith("wp-") || rawId === "waypoints") {
      continue;
    }

    // Skip ignored structural IDs
    if (ignoredIds.has(rawId.toLowerCase())) {
      continue;
    }

    // Skip generated IDs from vector design tools like "path1234", "rect5678", "SVGID_1_" unless explicit
    if (/^(?:path|rect|polygon|circle|g)\d+$/i.test(rawId) || /^SVGID_/i.test(rawId)) {
      continue;
    }

    if (!zonesMap.has(rawId)) {
      zonesMap.set(rawId, {
        id: rawId,
        label: formatZoneLabel(rawId),
        type: categorizeZone(rawId),
      });
    }
  }

  // Sort by category (halls first, then rooms, then amenities, then general zones), then by name
  const priority = { hall: 1, room: 2, zone: 3, amenity: 4 };
  return Array.from(zonesMap.values()).sort((a, b) => {
    if (priority[a.type] !== priority[b.type]) {
      return priority[a.type] - priority[b.type];
    }
    return a.label.localeCompare(b.label, undefined, { numeric: true });
  });
}

/**
 * Retrieves the available zones from the active edition's floor plan SVG.
 */
export async function getActiveFloorPlanZones(floorPlanUrl?: string | null): Promise<SvgZoneInfo[]> {
  try {
    let url = floorPlanUrl;
    if (!url) {
      try {
        const active = await prisma.eventEdition.findFirst({
          where: { isActive: true },
          select: { floorPlanUrl: true },
        });
        url = active?.floorPlanUrl || "/uploads/campus-floorplan.svg";
      } catch {
        // Graceful fallback to default floor plan if database is offline (unit tests / CI / build)
        url = "/uploads/campus-floorplan.svg";
      }
    }

    if (!url) return [];

    let svgContent = "";
    if (url.startsWith("/uploads/")) {
      const localFilename = path.basename(url);
      const localPath = path.join(process.cwd(), "public", "uploads", localFilename);
      if (fs.existsSync(localPath)) {
        svgContent = await fs.promises.readFile(localPath, "utf-8");
      } else {
        try {
          const imgRecord = await prisma.imageStore.findUnique({
            where: { filename: localFilename },
          });
          if (imgRecord?.data) {
            svgContent = Buffer.from(imgRecord.data).toString("utf-8");
          }
        } catch {
          // DB offline fallback
        }
      }
    }

    if (!svgContent) {
      const defaultFloorplanPath = path.join(process.cwd(), "public", "uploads", "campus-floorplan.svg");
      if (fs.existsSync(defaultFloorplanPath)) {
        svgContent = await fs.promises.readFile(defaultFloorplanPath, "utf-8");
      }
    }

    if (!svgContent) return [];

    const { sanitized } = sanitizeSvg(svgContent);
    return extractZonesFromSvg(sanitized || svgContent);
  } catch (err) {
    console.error("Error fetching active floor plan zones:", err);
    return [];
  }
}

/**
 * Validates whether a submitted zone ID exists in the active floor plan.
 * Returns true if valid or if no floor plan zones are defined (graceful fallback).
 */
export async function validateZoneExists(zoneId?: string | null, floorPlanUrl?: string | null): Promise<boolean> {
  if (!zoneId || !zoneId.trim()) return true;
  const zones = await getActiveFloorPlanZones(floorPlanUrl);
  if (zones.length === 0) return true;
  return zones.some((z) => z.id.toLowerCase() === zoneId.trim().toLowerCase());
}


