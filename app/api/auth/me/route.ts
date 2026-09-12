import { getCurrentUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        githubId: user.githubId,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get current user",
      },
      { status: 500 }
    );
  }
}