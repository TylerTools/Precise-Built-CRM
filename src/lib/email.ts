import { Resend } from "resend";

console.log("[Email] Provider check:", {
  RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  provider: process.env.RESEND_API_KEY ? "Resend" : "None",
});

export async function sendLeadNotification(lead: {
  name: string;
  email: string;
  phone: string;
  service: string;
  description: string;
  source: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] Resend not configured — skipping notification");
    console.log("[Email] New lead:", lead.name, lead.email);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: process.env.NOTIFICATION_EMAIL || "tyler@precisebuilt.net",
    subject: `New Lead: ${lead.name} — ${lead.service}`,
    html: `
      <h2>New Lead from Precise Built Website</h2>
      <p><strong>Name:</strong> ${lead.name}</p>
      <p><strong>Phone:</strong> ${lead.phone}</p>
      <p><strong>Email:</strong> ${lead.email}</p>
      <p><strong>Service:</strong> ${lead.service}</p>
      <p><strong>Description:</strong> ${lead.description}</p>
      <p><strong>Source:</strong> ${lead.source}</p>
    `,
  });

  if (error) {
    console.error("[Email] Resend send error:", error);
    throw error;
  }
}
