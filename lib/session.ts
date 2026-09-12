import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const SESSION_COOKIE_NAME = "ghm_session";

const SESSION_DURATION_DAYS = 30;

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = hashToken(token);

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + SESSION_DURATION_DAYS
  );

  await db.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    }
  );

  return token;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    SESSION_COOKIE_NAME
  )?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const session = await db.session.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await db.session.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  return session.user;
}

export async function deleteSession() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    SESSION_COOKIE_NAME
  )?.value;

  if (token) {
    const tokenHash = hashToken(token);

    await db.session.deleteMany({
      where: {
        tokenHash,
      },
    });
  }

  cookieStore.delete(
    SESSION_COOKIE_NAME
  );
}