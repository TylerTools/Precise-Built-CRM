import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  console.log("test-email route hit");
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    if (secret !== process.env.JWT_SECRET && secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Test Email] RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "No email provider configured" }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "tyler@eminence.business",
      subject: "Test Email from Precise Built CRM",
      text: "If you are reading this, email is working.",
    });

    if (error) {
      console.error("[Test Email] Resend error:", error);
      return NextResponse.json({ error: "Send failed", details: error }, { status: 500 });
    }

    console.log("[Test Email] Success:", data);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[Test Email] Full error:", err);
    return NextResponse.json({ error: "Route failed", details: String(err) }, { status: 500 });
  }
}
