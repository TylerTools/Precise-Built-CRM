import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, label, assignedUserId, dueDate, priority } = await request.json();
  if (!projectId || !label) {
    return NextResponse.json(
      { error: "projectId and label are required" },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      label,
      ...(assignedUserId && { assignedUserId }),
      ...(dueDate && { dueDate: new Date(dueDate) }),
      ...(priority && { priority }),
    },
    include: { assignedUser: { select: { id: true, name: true } } },
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, completed, label, assignedUserId, dueDate, priority } = await request.json();
  if (!id) {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(completed !== undefined && { completed }),
      ...(label !== undefined && { label }),
      ...(assignedUserId !== undefined && { assignedUserId: assignedUserId || null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(priority !== undefined && { priority }),
    },
    include: { assignedUser: { select: { id: true, name: true } } },
  });

  return NextResponse.json(task);
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
