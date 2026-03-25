import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getOrCreateClientFolder } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    include: {
      contact: { select: { name: true, phone: true, email: true } },
      assignedUser: { select: { name: true } },
      tasks: true,
      _count: { select: { files: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { contactId, jobType, address, scope, value, assignedUserId } = body;

  if (!contactId || !jobType) {
    return NextResponse.json(
      { error: "contactId and jobType are required" },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      contactId,
      jobType,
      address: address || "",
      scope: scope || "",
      value: value ? parseFloat(value) : null,
      assignedUserId: assignedUserId || null,
      stage: "S1",
    },
    include: {
      contact: { select: { name: true } },
    },
  });

  // Auto-create Google Drive folder if connected
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });
    if (settings?.driveConnected && settings?.driveRefreshToken) {
      const clientName = project.contact.name;
      const projectName = `${jobType} - ${address || project.id.slice(0, 8)}`;
      const { folderId, folderUrl } = await getOrCreateClientFolder(
        clientName,
        projectName
      );
      await prisma.project.update({
        where: { id: project.id },
        data: { driveFolderId: folderId, driveFolderUrl: folderUrl },
      });
    }
  } catch (err) {
    console.error("Drive folder creation failed:", err);
  }

  return NextResponse.json(project, { status: 201 });
}
