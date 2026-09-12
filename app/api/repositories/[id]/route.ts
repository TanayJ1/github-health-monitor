import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const repository = await db.repository.findFirst({
  where: {
    id,
    ownerId: user.id,
  },
  include: {
    owner: true,
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

    const latestScan = await db.scan.findFirst({
      where: {
        repositoryId: id,
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const findings = latestScan
      ? await db.finding.findMany({
          where: {
            scanId: latestScan.id,
          },
          orderBy: [
            {
              severity: "asc",
            },
            {
              createdAt: "desc",
            },
          ],
        })
      : [];

    const metrics = latestScan
      ? await db.metric.findMany({
          where: {
            scanId: latestScan.id,
          },
          orderBy: {
            category: "asc",
          },
        })
      : [];

    const scanHistory = await db.scan.findMany({
      where: {
        repositoryId: id,
        status: "COMPLETED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        healthScore: true,
        createdAt: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      success: true,

      repository: {
        id: repository.id,
        githubId: repository.githubId,
        name: repository.name,
        fullName: repository.fullName,
        defaultBranch: repository.defaultBranch,
        language: repository.language,
        isPrivate: repository.isPrivate,
        healthScore: repository.healthScore,
        lastScannedAt: repository.lastScannedAt,
      },

      latestScan: latestScan
        ? {
            id: latestScan.id,
            status: latestScan.status,
            healthScore: latestScan.healthScore,
            startedAt: latestScan.startedAt,
            completedAt: latestScan.completedAt,
          }
        : null,

      findings,

      metrics,

      scanHistory,
    });
  } catch (error) {
    console.error("Repository dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch repository dashboard",
      },
      { status: 500 }
    );
  }
}