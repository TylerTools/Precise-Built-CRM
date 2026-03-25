import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; mediaId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const media = await prisma.projectMedia.findUnique({
    where: { id: params.mediaId },
  });

  if (!media || media.projectId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete local file
  if (media.blobUrl.startsWith("/uploads/")) {
    try {
      const filePath = path.join(process.cwd(), "public", media.blobUrl);
      await unlink(filePath);
    } catch {
      // File may already be deleted
    }
  }

  // Delete from Google Drive if synced
  if (media.driveFileId) {
    try {
      const settings = await prisma.settings.findUnique({
        where: { id: "singleton" },
      });
      if (settings?.driveConnected && settings?.driveRefreshToken) {
        // Google Drive delete would go here
        // await deleteFromDrive(settings.driveRefreshToken, media.driveFileId);
      }
    } catch {
      // Silently skip Drive delete on error
    }
  }

  await prisma.projectMedia.delete({ where: { id: params.mediaId } });

  return NextResponse.json({ success: true });
}
