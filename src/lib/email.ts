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

export async function sendInviteEmail(invite: {
  to: string;
  name: string;
  email: string;
  password: string;
  loginUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] Resend not configured — skipping invite email");
    console.log("[Email] Invite:", invite.name, invite.email);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: invite.to,
    subject: "You've been invited to Precise Built Field OS",
    html: `
      <h2>Welcome to Precise Built Field OS</h2>
      <p>Hi ${invite.name},</p>
      <p>Your account has been created. Here are your login details:</p>
      <p><strong>Email:</strong> ${invite.email}</p>
      <p><strong>Temporary Password:</strong> ${invite.password}</p>
      <p><a href="${invite.loginUrl}">Login here</a></p>
      <p>Please change your password after your first login.</p>
    `,
  });

  if (error) {
    console.error("[Email] Invite email error:", error);
    throw error;
  }
}
