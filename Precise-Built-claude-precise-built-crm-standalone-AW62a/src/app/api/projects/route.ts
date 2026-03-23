import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    include: {
      contact: { select: { name: true, phone: true, email: true } },
      assignedUser: { select: { name: true } },
      tasks: true,
      _count: { select: { files: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { contactId, jobType, address, scope, value, assignedUserId } = body;

  if (!contactId || !jobType) {
    return NextResponse.json(
      { error: "contactId and jobType are required" },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      contactId,
      jobType,
      address: address || "",
      scope: scope || "",
      value: value ? parseFloat(value) : null,
      assignedUserId: assignedUserId || null,
      stage: "S1",
    },
    include: {
      contact: { select: { name: true } },
    },
  });

  // Integration hook point: create calendar event for new project
  // await createGoogleCalendarEvent(project.id);

  return NextResponse.json(project, { status: 201 });
}
