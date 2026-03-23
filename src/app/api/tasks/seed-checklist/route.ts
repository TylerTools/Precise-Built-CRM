import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { STAGE_MAP } from "@/lib/stages";
import type { StageKey } from "@/lib/stages";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, stage } = await request.json();
  if (!projectId || !stage) {
    return NextResponse.json(
      { error: "projectId and stage are required" },
      { status: 400 }
    );
  }

  const stageDef = STAGE_MAP[stage as StageKey];
  if (!stageDef) {
    return NextResponse.json(
      { error: "Invalid stage" },
      { status: 400 }
    );
  }

  // Check if checklist already exists for this stage
  const existing = await prisma.task.count({
    where: { projectId, isChecklist: true, stage },
  });

  if (existing > 0) {
    return NextResponse.json(
      { error: "Checklist already exists for this stage" },
      { status: 409 }
    );
  }

  // Create checklist items from stage definition
  const tasks = await prisma.task.createMany({
    data: stageDef.exitChecklist.map((label, i) => ({
      projectId,
      label,
      isChecklist: true,
      stage,
      sortOrder: i,
      completed: false,
    })),
  });

  return NextResponse.json({ created: tasks.count }, { status: 201 });
}
