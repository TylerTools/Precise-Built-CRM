import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings) {
    settings = await prisma.settings.create({ data: { id: "singleton" } });
  }

  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "owner")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();

  const allowedFields = [
    "companyName",
    "companyPhone",
    "companyEmail",
    "companyAddress",
    "logoUrl",
    "accentColor",
    "mainBgColor",
    "cardColor",
    "sidebarColor",
    "darkMode",
    "inviteEmailSubject",
    "inviteEmailBody",
    "stageEmailSubject",
    "stageEmailBody",
    "driveConnected",
    "driveRefreshToken",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      data[key] = body[key];
    }
  }

  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  // Auto-backup: create a SettingsBackup if last backup is older than 30 days
  try {
    const lastBackup = await prisma.settingsBackup.findFirst({
      orderBy: { backedUpAt: "desc" },
    });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (!lastBackup || lastBackup.backedUpAt < thirtyDaysAgo) {
      await prisma.settingsBackup.create({
        data: {
          snapshot: JSON.parse(JSON.stringify(settings)),
          triggeredBy: "auto",
        },
      });
      // Attempt Google Drive backup if connected
      if (settings.driveConnected && settings.driveRefreshToken) {
        try {
          const { backupSettingsToDrive } = await import("@/lib/drive-backup");
          await backupSettingsToDrive(settings);
        } catch (driveErr) {
          console.error("[Settings] Drive backup failed:", driveErr);
        }
      }
    }
  } catch (backupErr) {
    console.error("[Settings] Auto-backup failed:", backupErr);
  }

  return NextResponse.json(settings);
}
