import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const scanId = searchParams.get("scanId");

    const user = await getCurrentUser();

if (!user) {
  return NextResponse.json(
    {
      success: false,
      error: "Unauthorized",
    },
    { status: 401 }
  );
}

    if (!scanId) {
      return NextResponse.json(
        {
          success: false,
          error: "scanId is required",
        },
        { status: 400 }
      );
    }

    const scan = await db.scan.findFirst({
  where: {
    id: scanId,
    repository: {
      ownerId: user.id,
    },
  },
});

if (!scan) {
  return NextResponse.json(
    {
      success: false,
      error: "Scan not found",
    },
    { status: 404 }
  );
}

    const metrics = await db.metric.findMany({
      where: {
        scanId,
      },
      orderBy: {
        category: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      scanId,
      metrics,
    });
  } catch (error) {
    console.error("Metrics error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch scan metrics",
      },
      { status: 500 }
    );
  }
}