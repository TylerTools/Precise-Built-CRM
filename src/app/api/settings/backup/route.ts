import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET — return the last backup date
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lastBackup = await prisma.settingsBackup.findFirst({
    orderBy: { backedUpAt: "desc" },
    select: { backedUpAt: true, triggeredBy: true },
  });

  return NextResponse.json({ lastBackup });
}

// POST — manual backup now
export async function POST() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "owner")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    return NextResponse.json({ error: "No settings found" }, { status: 404 });
  }

  const backup = await prisma.settingsBackup.create({
    data: {
      snapshot: JSON.parse(JSON.stringify(settings)),
      triggeredBy: "manual",
    },
  });

  // Attempt Google Drive backup
  if (settings.driveConnected && settings.driveRefreshToken) {
    try {
      const { backupSettingsToDrive } = await import("@/lib/drive-backup");
      await backupSettingsToDrive(settings);
    } catch (err) {
      console.error("[Backup] Drive backup failed:", err);
    }
  }

  return NextResponse.json({ success: true, backedUpAt: backup.backedUpAt });
}
