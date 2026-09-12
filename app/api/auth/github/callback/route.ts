import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing OAuth code",
        },
        { status: 400 }
      );
    }

    // 1. Exchange OAuth code for GitHub access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GITHUB_REDIRECT_URI,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("GitHub token error:", tokenData);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to obtain GitHub access token",
        },
        { status: 400 }
      );
    }

    const accessToken = tokenData.access_token;

    // 2. Verify the access token by fetching GitHub user
    const githubResponse = await fetch(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();

      console.error(
        "GitHub user request failed:",
        githubResponse.status,
        errorText
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to authenticate with GitHub",
        },
        { status: 400 }
      );
    }

    const githubUser = await githubResponse.json();

    // 3. Save/update user and the NEW GitHub access token
    const user = await db.user.upsert({
      where: {
        githubId: String(githubUser.id),
      },

      update: {
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        githubAccessToken: accessToken,
      },

      create: {
        githubId: String(githubUser.id),
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        githubAccessToken: accessToken,
      },
    });

    // 4. Create application session
    await createSession(user.id);

    // IMPORTANT:
    // Never send the GitHub access token to the browser.

    return NextResponse.json({
      success: true,
      message: "GitHub authentication successful",

      user: {
        id: user.id,
        githubId: user.githubId,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Authentication failed",
      },
      { status: 500 }
    );
  }
}