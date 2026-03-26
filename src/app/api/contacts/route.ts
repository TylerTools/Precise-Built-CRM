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
  const search = searchParams.get("search");

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }
    : {};

  const contacts = await prisma.contact.findMany({
    where,
    include: {
      projects: {
        select: {
          id: true,
          jobType: true,
          stage: true,
          value: true,
          address: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    ...(search ? { take: 10 } : {}),
  });

  return NextResponse.json(contacts);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, phone, email, source, notes } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      name,
      phone: phone || "",
      email: email || "",
      source: source || "other",
      notes: notes || "",
    },
  });

  return NextResponse.json(contact, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, phone, email, notes } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      projects: {
        select: {
          id: true,
          jobType: true,
          stage: true,
          value: true,
          address: true,
        },
      },
    },
  });

  return NextResponse.json(contact);
}
