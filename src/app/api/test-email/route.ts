import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.JWT_SECRET && secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Test Email] Provider check:", {
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_HOST_VALUE: process.env.SMTP_HOST || "(not set)",
    SMTP_PORT: process.env.SMTP_PORT || "(not set)",
    SMTP_USER: process.env.SMTP_USER ? "(set)" : "(not set)",
    SMTP_FROM: process.env.SMTP_FROM || "(not set)",
    provider: process.env.RESEND_API_KEY ? "Resend" : process.env.SMTP_HOST ? "SMTP" : "None",
  });

  if (!process.env.SMTP_HOST) {
    console.log("[Test Email] No email provider configured — SMTP_HOST missing and no RESEND_API_KEY");
    return NextResponse.json({ error: "No email provider configured" }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@precisebuilt.com",
      to: "tyler@precisebuilt.net",
      subject: "Test Email from Precise Built CRM",
      text: "If you're reading this, email is working.",
    });
    console.log("[Test Email] Success:", result.messageId);
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err) {
    console.error("[Test Email] Failed:", err);
    return NextResponse.json(
      { error: "Send failed", details: String(err) },
      { status: 500 }
    );
  }
}
