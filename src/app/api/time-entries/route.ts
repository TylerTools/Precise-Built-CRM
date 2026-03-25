import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, userId, date, hours, note } = await request.json();
  if (!projectId || !date || hours === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const te = await prisma.timeEntry.create({
    data: {
      projectId,
      userId: userId || session.userId,
      date: new Date(date),
      hours: parseFloat(hours),
      note: note || "",
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(te, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, date, hours, note } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const te = await prisma.timeEntry.update({
    where: { id },
    data: {
      ...(date !== undefined && { date: new Date(date) }),
      ...(hours !== undefined && { hours: parseFloat(hours) }),
      ...(note !== undefined && { note }),
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(te);
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.timeEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
