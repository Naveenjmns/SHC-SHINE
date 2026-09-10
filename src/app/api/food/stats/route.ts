import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "FOOD_COORDINATOR")
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Food Committee or Admin login required." },
        { status: 401 }
      );
    }

    // Only count members whose delegation is PAID (eligible for meals)
    const paidDelegates = await prisma.delegationMember.findMany({
      where: {
        delegation: {
          paymentStatus: "PAID",
        },
      },
      select: {
        id: true,
        name: true,
        foodPreference: true,
        foodTokenClaimed: true,
        foodClaimedAt: true,
        foodClaimedBy: true,
        badgeCode: true,
        foodTokenCode: true,
        delegation: {
          select: {
            collegeName: true,
          },
        },
      },
      orderBy: {
        foodClaimedAt: "desc",
      },
    });

    const totalEligible = paidDelegates.length;
    let totalClaimed = 0;
    let totalVegRequested = 0;
    let totalVegClaimed = 0;
    let totalNonVegRequested = 0;
    let totalNonVegClaimed = 0;

    const recentClaims: any[] = [];

    for (const d of paidDelegates) {
      const isVeg = (d.foodPreference || "VEG").toUpperCase() === "VEG";
      if (isVeg) {
        totalVegRequested++;
        if (d.foodTokenClaimed) {
          totalVegClaimed++;
        }
      } else {
        totalNonVegRequested++;
        if (d.foodTokenClaimed) {
          totalNonVegClaimed++;
        }
      }

      if (d.foodTokenClaimed) {
        totalClaimed++;
        if (recentClaims.length < 25) {
          recentClaims.push({
            id: d.id,
            name: d.name,
            collegeName: d.delegation.collegeName,
            foodPreference: isVeg ? "VEG" : "NON_VEG",
            foodClaimedAt: d.foodClaimedAt,
            foodClaimedBy: d.foodClaimedBy,
            foodTokenCode: d.foodTokenCode,
            badgeCode: d.badgeCode,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalEligible,
        totalClaimed,
        totalRemaining: Math.max(0, totalEligible - totalClaimed),
        claimPercentage: totalEligible > 0 ? Math.round((totalClaimed / totalEligible) * 100) : 0,
        veg: {
          requested: totalVegRequested,
          claimed: totalVegClaimed,
          remaining: Math.max(0, totalVegRequested - totalVegClaimed),
        },
        nonVeg: {
          requested: totalNonVegRequested,
          claimed: totalNonVegClaimed,
          remaining: Math.max(0, totalNonVegRequested - totalNonVegClaimed),
        },
      },
      recentClaims,
    });
  } catch (error: any) {
    console.error("Error fetching food stats:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch food stats." },
      { status: 500 }
    );
  }
}
