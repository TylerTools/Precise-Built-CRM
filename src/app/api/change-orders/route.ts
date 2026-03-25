import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, description, amount, status } = await request.json();
  if (!projectId || !description || amount === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const co = await prisma.changeOrder.create({
    data: { projectId, description, amount: parseFloat(amount), status: status || "pending" },
  });

  return NextResponse.json(co, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, description, amount, status } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const co = await prisma.changeOrder.update({
    where: { id },
    data: {
      ...(description !== undefined && { description }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json(co);
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

  await prisma.changeOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
