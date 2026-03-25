import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function uploadToBlob(file: File): Promise<string> {
  const { put } = await import("@vercel/blob");
  const blob = await put(file.name, file, { access: "public" });
  return blob.url;
}

async function uploadToLocal(file: File): Promise<string> {
  const ext = path.extname(file.name);
  const filename = `${uuidv4()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;

  if (!file || !projectId) {
    return NextResponse.json(
      { error: "file and projectId are required" },
      { status: 400 }
    );
  }

  // Use Vercel Blob if configured, otherwise fall back to local filesystem
  let url: string;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    url = await uploadToBlob(file);
  } else {
    url = await uploadToLocal(file);
  }

  // Profile uploads don't belong to a project — skip File record
  if (projectId === "profile") {
    return NextResponse.json({ url }, { status: 201 });
  }

  const dbFile = await prisma.file.create({
    data: { projectId, filename: file.name, url },
  });

  return NextResponse.json(dbFile, { status: 201 });
}
