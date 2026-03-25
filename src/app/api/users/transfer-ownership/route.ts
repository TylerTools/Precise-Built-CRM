import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can transfer ownership" },
      { status: 403 }
    );
  }

  const { targetUserId } = await request.json();
  if (!targetUserId) {
    return NextResponse.json(
      { error: "targetUserId is required" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Transfer: demote current owner to admin, promote target to owner
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: { role: "admin" },
    }),
    prisma.user.update({
      where: { id: targetUserId },
      data: { role: "owner" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
