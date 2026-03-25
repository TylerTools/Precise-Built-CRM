import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;
  const uploadType = formData.get("type") as string | null;

  if (!file) {
    return NextResponse.json(
      { error: "file is required" },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name);
  const filename = `${uuidv4()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(path.join(uploadDir, filename), buffer);

  // For dev: local path. In prod: swap to cloud storage URL
  const url = `/uploads/${filename}`;

  if (uploadType === "bg") {
    return NextResponse.json({ url }, { status: 201 });
  }

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const dbFile = await prisma.file.create({
    data: { projectId, filename: file.name, url },
  });

  return NextResponse.json(dbFile, { status: 201 });
}
