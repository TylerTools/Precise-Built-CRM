import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createCalendarEvent } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meetings = await prisma.meeting.findMany({
    where: { projectId: params.id },
    orderBy: { scheduledAt: "desc" },
  });

  return NextResponse.json(meetings);
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
  const { stage, title, scheduledAt, duration, notes, attendees } = body;

  if (!title || !scheduledAt) {
    return NextResponse.json(
      { error: "title and scheduledAt are required" },
      { status: 400 }
    );
  }

  const startTime = new Date(scheduledAt);
  const durationMs = (duration || 60) * 60 * 1000;
  const endTime = new Date(startTime.getTime() + durationMs);

  let googleEventId: string | null = null;
  let googleEventUrl: string | null = null;

  // Try Google Calendar sync
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });
    if (settings?.driveConnected && settings?.driveRefreshToken) {
      const event = await createCalendarEvent(
        title,
        startTime.toISOString(),
        endTime.toISOString(),
        attendees || [],
        notes || ""
      );
      googleEventId = event.eventId;
      googleEventUrl = event.eventUrl;
    }
  } catch (err) {
    console.error("Google Calendar sync failed:", err);
  }

  const meeting = await prisma.meeting.create({
    data: {
      projectId: params.id,
      stage: stage || "",
      title,
      scheduledAt: startTime,
      notes: notes || null,
      googleEventId,
      googleEventUrl,
    },
  });

  return NextResponse.json(meeting, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get("meetingId");

  if (!meetingId) {
    return NextResponse.json({ error: "meetingId required" }, { status: 400 });
  }

  await prisma.meeting.delete({
    where: { id: meetingId, projectId: params.id },
  });

  return NextResponse.json({ success: true });
}
