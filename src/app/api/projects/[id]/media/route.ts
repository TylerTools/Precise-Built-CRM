import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { put } from "@vercel/blob";
import { uploadFileToDrive } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const media = await prisma.projectMedia.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(media);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  // Upload to Vercel Blob
  const blob = await put(file.name, file, { access: "public" });
  const blobUrl = blob.url;

  // Determine file type category
  const mimeType = file.type || "";
  let fileType = "other";
  if (mimeType.startsWith("image/")) fileType = "image";
  else if (mimeType.startsWith("video/")) fileType = "video";

  // Attempt Google Drive sync if connected
  let driveFileId: string | null = null;
  let driveUrl: string | null = null;

  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { driveFolderId: true },
    });
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });
    if (
      settings?.driveConnected &&
      settings?.driveRefreshToken &&
      project?.driveFolderId
    ) {
      const fileBytes = await file.arrayBuffer();
      const fileBuffer = Buffer.from(fileBytes);
      const result = await uploadFileToDrive(
        project.driveFolderId,
        "Media",
        file.name,
        fileBuffer,
        mimeType || "application/octet-stream"
      );
      driveFileId = result.fileId;
      driveUrl = result.fileUrl;
    }
  } catch (err) {
    console.error("Drive sync failed:", err);
  }

  const media = await prisma.projectMedia.create({
    data: {
      projectId: params.id,
      fileName: file.name,
      fileType,
      blobUrl,
      driveFileId,
      driveUrl,
      uploadedBy: session.userId,
    },
  });

  return NextResponse.json(media, { status: 201 });
}
