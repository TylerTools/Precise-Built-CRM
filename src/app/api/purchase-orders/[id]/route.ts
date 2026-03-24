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

  const purchaseOrder = await prisma.purchaseOrder.update({
    where: { id: params.id },
    data: {
      ...(body.vendor !== undefined && { vendor: body.vendor }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });

  return NextResponse.json(purchaseOrder);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.purchaseOrder.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
