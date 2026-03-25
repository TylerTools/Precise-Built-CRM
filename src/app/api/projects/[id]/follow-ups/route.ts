import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const followUps = await prisma.followUp.findMany({
    where: { projectId: params.id },
    orderBy: { attemptNumber: "asc" },
  });

  return NextResponse.json(followUps);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { attemptNumber, date, notes, responded } = body;

  if (!attemptNumber) {
    return NextResponse.json(
      { error: "attemptNumber is required" },
      { status: 400 }
    );
  }

  const followUp = await prisma.followUp.upsert({
    where: {
      id: body.id || "new",
    },
    update: {
      date: date ? new Date(date) : null,
      notes: notes || null,
      responded: responded || false,
    },
    create: {
      projectId: params.id,
      attemptNumber,
      date: date ? new Date(date) : null,
      notes: notes || null,
      responded: responded || false,
    },
  });

  return NextResponse.json(followUp, { status: 201 });
}
