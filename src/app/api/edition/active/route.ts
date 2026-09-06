import { NextResponse } from "next/server";
import { getActiveEdition } from "@/lib/eventService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getActiveEdition();
    return NextResponse.json({ success: true, edition: config });
  } catch (error: any) {
    console.error("GET /api/edition/active error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load active event edition config" },
      { status: 500 }
    );
  }
}
