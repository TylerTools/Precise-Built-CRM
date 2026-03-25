import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      contact: true,
      assignedUser: { select: { id: true, name: true, email: true } },
      tasks: {
        include: { assignedUser: { select: { id: true, name: true } } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      files: { orderBy: { uploadedAt: "desc" } },
      changeOrders: { orderBy: { createdAt: "desc" } },
      purchaseOrders: { orderBy: { createdAt: "desc" } },
      timeEntries: {
        include: { user: { select: { name: true } } },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Track stage changes
  if (body.stage !== undefined) {
    const current = await prisma.project.findUnique({
      where: { id: params.id },
      select: { stage: true },
    });
    if (current && current.stage !== body.stage) {
      await prisma.stageHistory.create({
        data: {
          projectId: params.id,
          fromStage: current.stage,
          toStage: body.stage,
          movedBy: session.userId,
        },
      });
    }
  }

  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(body.stage !== undefined && { stage: body.stage }),
      ...(body.jobType !== undefined && { jobType: body.jobType }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.scope !== undefined && { scope: body.scope }),
      ...(body.value !== undefined && { value: body.value ? parseFloat(body.value) : null }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.assignedUserId !== undefined && { assignedUserId: body.assignedUserId || null }),
      ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
      ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
    },
  });

  // Integration hook point: update calendar, notify via Telegram, etc.
  // await createGoogleCalendarEvent(project.id);
  // await sendTelegramAlert(`Project ${project.id} updated to stage: ${project.stage}`);

  return NextResponse.json(project);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.task.deleteMany({ where: { projectId: params.id } });
  await prisma.file.deleteMany({ where: { projectId: params.id } });
  await prisma.project.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
