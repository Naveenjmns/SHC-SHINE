import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { extractZonesFromSvg, sanitizeSvg } from "@/lib/svgSanitizer";
import { getActiveEdition } from "@/lib/eventService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Allow ADMIN, COORDINATOR, and FOOD_COORDINATOR to query zones (or any authenticated user)
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let requestedUrl = searchParams.get("url");

    if (!requestedUrl) {
      const activeEdition = await getActiveEdition();
      requestedUrl = (activeEdition as any)?.floorPlanUrl || "/uploads/campus-floorplan.svg";
    }

    if (!requestedUrl) {
      return NextResponse.json({ success: true, floorPlanUrl: null, zones: [] });
    }

    let svgContent = "";

    // 1. Try reading from public/uploads on disk
    if (requestedUrl.startsWith("/uploads/")) {
      const localFilename = path.basename(requestedUrl);
      const localPath = path.join(process.cwd(), "public", "uploads", localFilename);
      if (fs.existsSync(localPath)) {
        try {
          svgContent = await fs.promises.readFile(localPath, "utf-8");
        } catch (e) {
          console.warn("Could not read local SVG file:", e);
        }
      }

      // 2. If not found on disk, try PostgreSQL ImageStore table
      if (!svgContent) {
        try {
          const imgRecord = await prisma.imageStore.findUnique({
            where: { filename: localFilename },
          });
          if (imgRecord?.data) {
            svgContent = Buffer.from(imgRecord.data).toString("utf-8");
          }
        } catch (dbErr) {
          console.warn("Could not fetch SVG from ImageStore DB:", dbErr);
        }
      }
    } else if (requestedUrl.startsWith("http://") || requestedUrl.startsWith("https://")) {
      // 3. Remote URL
      try {
        const res = await fetch(requestedUrl);
        if (res.ok) {
          svgContent = await res.text();
        }
      } catch (fetchErr) {
        console.warn("Could not fetch remote SVG:", fetchErr);
      }
    }

    if (!svgContent) {
      // Fallback: check if the default campus floorplan exists on disk
      const defaultFloorplanPath = path.join(process.cwd(), "public", "uploads", "campus-floorplan.svg");
      if (fs.existsSync(defaultFloorplanPath)) {
        svgContent = await fs.promises.readFile(defaultFloorplanPath, "utf-8");
        requestedUrl = "/uploads/campus-floorplan.svg";
      }
    }

    if (!svgContent) {
      return NextResponse.json({
        success: true,
        floorPlanUrl: requestedUrl,
        zones: [],
        message: "Floor plan asset not found or empty.",
      });
    }

    // Sanitize to be safe and extract zones
    const { sanitized } = sanitizeSvg(svgContent);
    const zones = extractZonesFromSvg(sanitized || svgContent);

    return NextResponse.json({
      success: true,
      floorPlanUrl: requestedUrl,
      zones,
      count: zones.length,
    });
  } catch (error: any) {
    console.error("GET /api/admin/floorplan/zones error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to parse zones" }, { status: 500 });
  }
}

