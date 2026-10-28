import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getActiveEdition } from "@/lib/eventService";
import {
  parseWaypointsFromSvg,
  buildWaypointGraph,
  WaypointGraph,
  WaypointNode,
} from "@/lib/wayfinding";
import fs from "fs";
import path from "path";

// Helper to load SVG content of the active floor plan
async function loadActiveFloorPlanSvg(): Promise<string> {
  const activeEdition = await getActiveEdition();
  const floorPlanUrl = activeEdition?.floorPlanUrl || "/uploads/campus-floorplan.svg";
  const filename = path.basename(floorPlanUrl);

  // Check filesystem first
  const localPath = path.join(process.cwd(), "public", floorPlanUrl.replace(/^\//, ""));
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, "utf-8");
  }

  // Fallback to ImageStore (Postgres)
  try {
    const stored = await prisma.imageStore.findUnique({
      where: { filename },
    });
    if (stored?.data) {
      return Buffer.from(stored.data).toString("utf-8");
    }
  } catch (err) {
    console.warn("Failed to read SVG from ImageStore:", err);
  }

  return "";
}

// GET /api/admin/floorplan/graph - Fetch waypoint graph (from DB or auto-parsed from SVG)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin role required." }, { status: 401 });
    }

    const activeEdition = await getActiveEdition();
    if (activeEdition?.waypointGraph && typeof activeEdition.waypointGraph === "object") {
      const graph = activeEdition.waypointGraph as unknown as WaypointGraph;
      if (Array.isArray(graph.nodes) && Array.isArray(graph.edges)) {
        return NextResponse.json({
          success: true,
          graph,
          source: "database",
        });
      }
    }

    // Parse fresh graph from SVG
    const svgContent = await loadActiveFloorPlanSvg();
    const nodes = parseWaypointsFromSvg(svgContent);
    const graph = buildWaypointGraph(nodes);

    return NextResponse.json({
      success: true,
      graph,
      source: "svg_derived",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load waypoint graph.";
    console.error("GET /api/admin/floorplan/graph error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

// POST /api/admin/floorplan/graph - Save custom waypoint graph (ADMIN only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin role required." }, { status: 401 });
    }

    const body = await req.json();
    const { nodes, edges } = body;

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload. 'nodes' and 'edges' arrays are required." },
        { status: 400 }
      );
    }

    // Validate nodes structure
    const validatedNodes: WaypointNode[] = nodes.map((n: Record<string, unknown>) => ({
      id: String(n.id || ""),
      x: Number(n.x) || 0,
      y: Number(n.y) || 0,
      floor: Number(n.floor) || 1,
      label: n.label ? String(n.label) : undefined,
      zoneId: n.zoneId ? String(n.zoneId) : undefined,
    }));

    // Normalize and compute edge weights
    const validatedGraph = buildWaypointGraph(validatedNodes, edges);

    // Save to active event edition
    const activeEdition = await getActiveEdition();
    const editionId = activeEdition?.id || "default-shine";

    // Clean JSON serialization to strip any undefined properties
    const cleanGraph = JSON.parse(JSON.stringify(validatedGraph));

    await prisma.eventEdition.update({
      where: { id: editionId },
      data: {
        waypointGraph: cleanGraph,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Waypoint navigation graph saved successfully.",
      graph: validatedGraph,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save waypoint graph.";
    console.error("POST /api/admin/floorplan/graph error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
