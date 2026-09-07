import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.toUpperCase() || "ALL";

    const where: any = {};

    // Filter by category
    if (category === "AUTH") {
      where.action = { in: ["USER_LOGIN", "USER_LOGOUT"] };
    } else if (category === "REGISTRATION") {
      where.action = {
        in: [
          "REGISTRATION_CREATED",
          "REGISTRATION_APPROVED",
          "REGISTRATION_REJECTED",
          "REGISTRATION_STATUS_UPDATE",
        ],
      };
    } else if (category === "EVENT") {
      where.action = {
        in: ["EVENT_CREATED", "EVENT_UPDATED", "EVENT_DELETED", "RESULT_UPDATED"],
      };
    } else if (category === "EMAIL") {
      where.action = {
        in: ["EMAIL_BROADCAST", "SMTP_SETTINGS_UPDATED"],
      };
    } else if (category === "USER") {
      where.action = {
        in: ["USER_CREATED", "USER_UPDATED", "USER_DELETED"],
      };
    } else if (category === "SYSTEM") {
      where.action = {
        in: ["EDITION_UPDATED", "SCHEDULE_UPDATED", "NAV_UPDATED"],
      };
    }

    // Search query
    if (search) {
      where.OR = [
        { actorName: { contains: search, mode: "insensitive" } },
        { actorEmail: { contains: search, mode: "insensitive" } },
        { targetTitle: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ];
    }

    const [totalCount, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Quick counts for category chips
    const [authCount, regCount, eventCount, emailCount, userCount] = await Promise.all([
      prisma.activityLog.count({ where: { action: { in: ["USER_LOGIN", "USER_LOGOUT"] } } }),
      prisma.activityLog.count({
        where: {
          action: {
            in: [
              "REGISTRATION_CREATED",
              "REGISTRATION_APPROVED",
              "REGISTRATION_REJECTED",
              "REGISTRATION_STATUS_UPDATE",
            ],
          },
        },
      }),
      prisma.activityLog.count({
        where: {
          action: { in: ["EVENT_CREATED", "EVENT_UPDATED", "EVENT_DELETED", "RESULT_UPDATED"] },
        },
      }),
      prisma.activityLog.count({
        where: { action: { in: ["EMAIL_BROADCAST", "SMTP_SETTINGS_UPDATED"] } },
      }),
      prisma.activityLog.count({
        where: { action: { in: ["USER_CREATED", "USER_UPDATED", "USER_DELETED"] } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      counts: {
        all: await prisma.activityLog.count(),
        auth: authCount,
        registration: regCount,
        event: eventCount,
        email: emailCount,
        user: userCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/logs error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
