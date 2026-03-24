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

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(purchaseOrders);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, vendor, description, amount, status } = body;

  if (!projectId || !vendor || !description || amount === undefined) {
    return NextResponse.json(
      { error: "projectId, vendor, description, and amount are required" },
      { status: 400 }
    );
  }

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      projectId,
      vendor,
      description,
      amount: parseFloat(amount),
      status: status || "pending",
    },
  });

  return NextResponse.json(purchaseOrder, { status: 201 });
}
