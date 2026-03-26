import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "owner")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, role, password } = await request.json();
  if (!name || !email || !role || !password) {
    return NextResponse.json({ error: "name, email, role, and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, role, passwordHash },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // Send welcome email with temp password
  try {
    await sendInviteEmail({
      to: email,
      name,
      email,
      password,
      loginUrl: (process.env.NEXT_PUBLIC_APP_URL || "https://precise-built-crm.vercel.app") + "/login",
    });
  } catch (err) {
    console.error("Invite email failed:", err);
  }

  return NextResponse.json(user, { status: 201 });
}
