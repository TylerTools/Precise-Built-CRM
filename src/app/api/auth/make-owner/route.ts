import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const secret = searchParams.get("secret");

  if (secret !== "PB-OWNER-2024" || email !== "tyler@precisebuilt.net") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { email },
    data: { role: "owner" },
  });

  // Self-delete this route file after execution
  try {
    const routeFile = path.join(
      process.cwd(),
      "src",
      "app",
      "api",
      "auth",
      "make-owner",
      "route.ts"
    );
    await unlink(routeFile);
  } catch {
    // File deletion is best-effort
  }

  return NextResponse.json({
    success: true,
    message: `${email} is now owner`,
  });
}
