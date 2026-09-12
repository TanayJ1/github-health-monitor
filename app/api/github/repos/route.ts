import { db } from "@/lib/db";
import { githubFetch } from "@/lib/github";
import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  language: string | null;
  owner: {
    login: string;
  };
}

export async function GET() {
  try {
    // Get the currently authenticated user
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

    // Make sure the user has a GitHub access token
    if (!user.githubAccessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "GitHub access token not found",
        },
        { status: 401 }
      );
    }

    // Fetch repositories from GitHub
    const repositories = await githubFetch<GitHubRepository[]>(
      "/user/repos?per_page=100&sort=updated",
      user.githubAccessToken
    );

    // Save repositories to database
    for (const repo of repositories) {
      await db.repository.upsert({
        where: {
          githubId: String(repo.id),
        },

        update: {
          name: repo.name,
          fullName: repo.full_name,
          defaultBranch: repo.default_branch,
          language: repo.language,
          isPrivate: repo.private,
          ownerId: user.id,
        },

        create: {
          githubId: String(repo.id),
          name: repo.name,
          fullName: repo.full_name,
          defaultBranch: repo.default_branch,
          language: repo.language,
          isPrivate: repo.private,
          ownerId: user.id,
        },
      });
    }

   const savedRepositories = await db.repository.findMany({
  where: {
    ownerId: user.id,
  },
  orderBy: {
    updatedAt: "desc",
  },
});

return NextResponse.json({
  success: true,
  count: savedRepositories.length,
  repositories: savedRepositories.map((repo) => ({
    id: repo.id,
    githubId: repo.githubId,
    name: repo.name,
    fullName: repo.fullName,
    defaultBranch: repo.defaultBranch,
    language: repo.language,
    isPrivate: repo.isPrivate,
    healthScore: repo.healthScore,
    lastScannedAt: repo.lastScannedAt,
  })),
});
  } catch (error) {
    console.error("Repository fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch repositories",
      },
      { status: 500 }
    );
  }
}