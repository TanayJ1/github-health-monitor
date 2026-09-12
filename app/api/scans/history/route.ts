import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const repositoryId = searchParams.get("repositoryId");

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

    if (!repositoryId) {
      return NextResponse.json(
        {
          success: false,
          error: "repositoryId is required",
        },
        { status: 400 }
      );
    }

    const repository = await db.repository.findFirst({
  where: {
    id: repositoryId,
    ownerId: user.id,
  },
});

if (!repository) {
  return NextResponse.json(
    {
      success: false,
      error: "Repository not found",
    },
    { status: 404 }
  );
}

    const scans = await db.scan.findMany({
      where: {
        repositoryId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        status: true,
        healthScore: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        _count: {
          select: {
            findings: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      scans,
    });
  } catch (error) {
    console.error("Scan history error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch scan history",
      },
      { status: 500 }
    );
  }
}