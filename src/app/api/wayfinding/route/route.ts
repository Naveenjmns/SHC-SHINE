import { NextResponse } from "next/server";
import { getActiveEdition } from "@/lib/eventService";
import {
  parseWaypointsFromSvg,
  buildWaypointGraph,
  shortestPath,
  WaypointGraph,
} from "@/lib/wayfinding";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

async function loadGraph(): Promise<WaypointGraph> {
  const activeEdition = await getActiveEdition();
  if (activeEdition?.waypointGraph && typeof activeEdition.waypointGraph === "object") {
    const graph = activeEdition.waypointGraph as unknown as WaypointGraph;
    if (Array.isArray(graph.nodes) && Array.isArray(graph.edges)) {
      return graph;
    }
  }

  // Fallback: derive from SVG
  const floorPlanUrl = activeEdition?.floorPlanUrl || "/uploads/campus-floorplan.svg";
  const filename = path.basename(floorPlanUrl);
  let svgContent = "";

  const localPath = path.join(process.cwd(), "public", floorPlanUrl.replace(/^\//, ""));
  if (fs.existsSync(localPath)) {
    svgContent = fs.readFileSync(localPath, "utf-8");
  } else {
    try {
      const stored = await prisma.imageStore.findUnique({
        where: { filename },
      });
      if (stored?.data) {
        svgContent = Buffer.from(stored.data).toString("utf-8");
      }
    } catch (err) {
      console.warn("Failed to read SVG from ImageStore:", err);
    }
  }

  const nodes = parseWaypointsFromSvg(svgContent);
  return buildWaypointGraph(nodes);
}

// GET /api/wayfinding/route?from=wp-entrance&to=hall-1
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "wp-entrance";
    const to = searchParams.get("to");

    if (!to) {
      return NextResponse.json(
        { success: false, message: "Query parameter 'to' (target zone ID or waypoint ID) is required." },
        { status: 400 }
      );
    }

    const graph = await loadGraph();
    const result = shortestPath(graph, from, to);

    return NextResponse.json({
      success: true,
      route: result,
      from,
      to,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to compute navigation route.";
    console.error("GET /api/wayfinding/route error:", error);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
