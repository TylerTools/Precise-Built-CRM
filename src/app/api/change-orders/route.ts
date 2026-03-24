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

  const changeOrders = await prisma.changeOrder.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(changeOrders);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, description, amount, status } = body;

  if (!projectId || !description || amount === undefined) {
    return NextResponse.json(
      { error: "projectId, description, and amount are required" },
      { status: 400 }
    );
  }

  const changeOrder = await prisma.changeOrder.create({
    data: {
      projectId,
      description,
      amount: parseFloat(amount),
      status: status || "pending",
    },
  });

  return NextResponse.json(changeOrder, { status: 201 });
}
