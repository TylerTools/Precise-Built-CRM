import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Fields that must never be returned in GET responses
const sensitiveFields = [
  "driveRefreshToken",
  "driveAccessToken",
  "driveTokenExpiry",
];

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

  // Strip sensitive fields
  const safe: Record<string, unknown> = { ...settings };
  for (const key of sensitiveFields) {
    delete safe[key];
  }

  return NextResponse.json(safe);
}

const appearanceFields = [
  "bgImageUrl",
  "bgImageOpacity",
  "bgStyle",
  "bgOverlayOpacity",
  "bgBlurAmount",
  "glassOpacity",
  "glassBlur",
  "glassBorderOpacity",
  "hoverAccentGlow",
  "mainBgColor",
  "cardColor",
  "sidebarColor",
];

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
    "darkMode",
    "inviteEmailSubject",
    "inviteEmailBody",
    "stageEmailSubject",
    "stageEmailBody",
    "driveConnected",
    "driveRefreshToken",
    "driveAccessToken",
    "driveTokenExpiry",
    "sharedDriveId",
    ...appearanceFields,
  ];

  const hasAppearanceField = appearanceFields.some(
    (f) => body[f] !== undefined
  );
  if (hasAppearanceField && session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can modify appearance settings" },
      { status: 403 }
    );
  }

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

  // Strip sensitive fields from response
  const safe: Record<string, unknown> = { ...settings };
  for (const key of sensitiveFields) {
    delete safe[key];
  }

  return NextResponse.json(safe);
}
