import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

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

  // Upload to local storage (swap to Vercel Blob in prod)
  const ext = path.extname(file.name);
  const filename = `${uuidv4()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "media");
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(path.join(uploadDir, filename), buffer);

  const blobUrl = `/uploads/media/${filename}`;

  // Determine file type category
  const mimeType = file.type || "";
  let fileType = "other";
  if (mimeType.startsWith("image/")) fileType = "image";
  else if (mimeType.startsWith("video/")) fileType = "video";

  // Attempt Google Drive sync if connected
  let driveFileId: string | null = null;
  let driveUrl: string | null = null;

  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "singleton" },
    });
    if (settings?.driveConnected && settings?.driveRefreshToken) {
      // Google Drive sync would go here using the refresh token
      // For now, this is a placeholder for the Drive API integration
      // driveFileId = await uploadToDrive(settings.driveRefreshToken, file, projectName);
      // driveUrl = `https://drive.google.com/file/d/${driveFileId}/view`;
    }
  } catch {
    // Silently skip Drive sync on error
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
