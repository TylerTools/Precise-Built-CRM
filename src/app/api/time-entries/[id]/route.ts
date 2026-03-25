import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const timeEntry = await prisma.timeEntry.update({
    where: { id: params.id },
    data: {
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.hours !== undefined && { hours: parseFloat(body.hours) }),
      ...(body.note !== undefined && { note: body.note }),
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(timeEntry);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.timeEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
