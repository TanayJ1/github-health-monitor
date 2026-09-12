import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      {
        error: "GITHUB_CLIENT_ID is not configured",
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri:
      process.env.GITHUB_REDIRECT_URI ??
      "http://localhost:3000/api/auth/github/callback",
    scope: "read:user user:email repo",
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}