import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const completedParam = searchParams.get("completed");

  const where: Record<string, unknown> = {};
  if (completedParam !== null) {
    where.completed = completedParam === "true";
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          jobType: true,
          contact: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, label } = await request.json();
  if (!projectId || !label) {
    return NextResponse.json(
      { error: "projectId and label are required" },
      { status: 400 }
    );
  }

  const task = await prisma.task.create({
    data: { projectId, label },
  });

  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, completed } = await request.json();
  if (!id || completed === undefined) {
    return NextResponse.json(
      { error: "id and completed are required" },
      { status: 400 }
    );
  }

  const task = await prisma.task.update({
    where: { id },
    data: { completed },
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
