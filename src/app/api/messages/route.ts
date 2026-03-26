import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { fromUserId: session.userId },
        { toUserId: session.userId },
      ],
    },
    include: {
      fromUser: { select: { id: true, name: true, profileImage: true } },
      toUser: { select: { id: true, name: true, profileImage: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by conversation partner
  const conversations: Record<string, {
    user: { id: string; name: string; profileImage: string | null };
    messages: typeof messages;
    unreadCount: number;
  }> = {};

  for (const msg of messages) {
    const partnerId = msg.fromUserId === session.userId ? msg.toUserId : msg.fromUserId;
    const partner = msg.fromUserId === session.userId ? msg.toUser : msg.fromUser;
    if (!conversations[partnerId]) {
      conversations[partnerId] = { user: partner, messages: [], unreadCount: 0 };
    }
    conversations[partnerId].messages.push(msg);
    if (!msg.read && msg.toUserId === session.userId) {
      conversations[partnerId].unreadCount++;
    }
  }

  return NextResponse.json(conversations);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { toUserId, body, projectId } = await request.json();
  if (!toUserId || !body) {
    return NextResponse.json({ error: "toUserId and body are required" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      fromUserId: session.userId,
      toUserId,
      body,
      projectId: projectId || null,
    },
    include: {
      fromUser: { select: { id: true, name: true, profileImage: true } },
      toUser: { select: { id: true, name: true, profileImage: true } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
