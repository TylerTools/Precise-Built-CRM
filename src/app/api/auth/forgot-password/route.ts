import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { email } = await request.json();

  // Always return success for security
  if (!email) {
    return NextResponse.json({ success: true });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ success: true });
  }

  const resetToken = randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://precise-built-crm.vercel.app";
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Reset your Precise Built password",
        html: `
          <h2>Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you didn't request this, you can ignore this email.</p>
        `,
      });
    } catch (err) {
      console.error("[Forgot Password] Email send failed:", err);
    }
  } else {
    console.log("[Forgot Password] No RESEND_API_KEY — reset URL:", resetUrl);
  }

  // Return the reset URL so admin can copy it if needed
  return NextResponse.json({ success: true, resetUrl });
}
