import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

  const blob = await put(file.name, file, {
    access: "public",
  });

  const dbFile = await prisma.file.create({
    data: { projectId, filename: file.name, url: blob.url },
  });

  return NextResponse.json(dbFile, { status: 201 });
}
