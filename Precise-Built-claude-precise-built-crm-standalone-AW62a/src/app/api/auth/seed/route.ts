import { NextResponse } from "next/server";
import { seedAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await seedAdmin();
  return NextResponse.json({ success: true, message: "Admin user seeded" });
}
