import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      message: "Database connected successfully",
    });
  } catch (error) {
    console.error("Database error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}