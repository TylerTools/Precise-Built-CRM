import { NextResponse } from "next/server";
import { seedAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Block in production unless a valid secret header is provided
  if (process.env.NODE_ENV === "production") {
    const secret = request.headers.get("x-seed-secret");
    if (!secret || secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Only allow seeding if zero users exist
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return NextResponse.json(
      { error: "Users already exist, seed is disabled" },
      { status: 409 }
    );
  }

  await seedAdmin();
  return NextResponse.json({ success: true, message: "Admin user seeded" });
}
