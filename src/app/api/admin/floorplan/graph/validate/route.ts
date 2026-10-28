import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateGraph, WaypointGraph } from "@/lib/wayfinding";
import { getActiveFloorPlanZones } from "@/lib/svgSanitizer";

// POST /api/admin/floorplan/graph/validate - Validates reachability of rooms in graph
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin role required." }, { status: 401 });
    }

    const body = await req.json();
    const { graph } = body;

    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      return NextResponse.json(
        { success: false, message: "Invalid graph payload. 'graph.nodes' and 'graph.edges' are required." },
        { status: 400 }
      );
    }

    // Fetch active floor plan rooms/zones
    const zones = await getActiveFloorPlanZones();

    // Run reachability analysis
    const validation = validateGraph(graph as WaypointGraph, zones);

    return NextResponse.json({
      success: true,
      validation,
    });
  } catch (error: any) {
    console.error("POST /api/admin/floorplan/graph/validate error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to validate waypoint graph." },
      { status: 500 }
    );
  }
}

