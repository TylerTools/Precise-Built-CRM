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

  const stageData = await prisma.stageData.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(stageData);
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
  const { stage, data, completedAt } = body;

  if (!stage) {
    return NextResponse.json({ error: "stage is required" }, { status: 400 });
  }

  const stageData = await prisma.stageData.upsert({
    where: {
      projectId_stage: { projectId: params.id, stage },
    },
    update: {
      data: data || {},
      ...(completedAt !== undefined && {
        completedAt: completedAt ? new Date(completedAt) : null,
      }),
    },
    create: {
      projectId: params.id,
      stage,
      data: data || {},
      ...(completedAt && { completedAt: new Date(completedAt) }),
    },
  });

  return NextResponse.json(stageData);
}
