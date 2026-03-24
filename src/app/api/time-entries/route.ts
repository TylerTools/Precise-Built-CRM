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
  const projectId = searchParams.get("projectId");

  const timeEntries = await prisma.timeEntry.findMany({
    where: projectId ? { projectId } : undefined,
    include: { user: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(timeEntries);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, userId, date, hours, note } = body;

  if (!projectId || !date || hours === undefined) {
    return NextResponse.json(
      { error: "projectId, date, and hours are required" },
      { status: 400 }
    );
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      projectId,
      userId: userId || session.userId,
      date: new Date(date),
      hours: parseFloat(hours),
      note: note || "",
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(timeEntry, { status: 201 });
}
