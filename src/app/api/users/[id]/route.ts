import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  tech: 2,
  client: 1,
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, role, phone, profileImage, displayName } = body;

  // Users can edit their own profile (name, email, phone, profileImage, displayName)
  const isSelf = session.userId === params.id;
  const sessionRank = ROLE_HIERARCHY[session.role] || 0;

  // Only owner/admin can change roles or edit other users
  if (!isSelf && sessionRank < ROLE_HIERARCHY.admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Cannot set role to owner via this endpoint
  if (role === "owner") {
    return NextResponse.json(
      { error: "Use transfer-ownership to assign owner role" },
      { status: 400 }
    );
  }

  // Non-self edits: only allow if editor outranks target
  if (!isSelf && role) {
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const targetRank = ROLE_HIERARCHY[target.role] || 0;
    if (targetRank >= sessionRank) {
      return NextResponse.json(
        { error: "Cannot edit a user with equal or higher role" },
        { status: 403 }
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (profileImage !== undefined) data.profileImage = profileImage;
  if (displayName !== undefined) data.displayName = displayName;
  if (role !== undefined && !isSelf) data.role = role;

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      profileImage: true,
      displayName: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionRank = ROLE_HIERARCHY[session.role] || 0;
  if (sessionRank < ROLE_HIERARCHY.admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot delete the owner" }, { status: 403 });
  }

  try {
    // Clear foreign key references before deleting user
    await prisma.task.updateMany({
      where: { assignedUserId: params.id },
      data: { assignedUserId: null },
    });
    await prisma.project.updateMany({
      where: { assignedUserId: params.id },
      data: { assignedUserId: null },
    });
    await prisma.message.deleteMany({
      where: { OR: [{ fromUserId: params.id }, { toUserId: params.id }] },
    });
    await prisma.timeEntry.deleteMany({
      where: { userId: params.id },
    });
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("User delete failed:", err);
    return NextResponse.json(
      { error: "Delete failed", details: String(err) },
      { status: 500 }
    );
  }
}
