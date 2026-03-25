import nodemailer from "nodemailer";
import { Resend } from "resend";

// ─── Providers ──────────────────────────────────────────────
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const smtpConfigured =
  !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const FROM_ADDRESS = process.env.SMTP_FROM || "noreply@precisebuilt.com";

// ─── Core send helper ───────────────────────────────────────
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // 1. Try Resend
  if (resend) {
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to,
        subject,
        html,
      });
      console.log(`[Email] Sent via Resend to ${to}`);
      return;
    } catch (err) {
      console.error("[Email] Resend failed, trying SMTP fallback:", err);
    }
  }

  // 2. Try SMTP
  if (transporter) {
    try {
      await transporter.sendMail({ from: FROM_ADDRESS, to, subject, html });
      console.log(`[Email] Sent via SMTP to ${to}`);
      return;
    } catch (err) {
      console.error("[Email] SMTP failed:", err);
    }
  }

  // 3. Console fallback (development)
  console.log("─────────────────────────────────────────────");
  console.log("[Email] NO EMAIL PROVIDER CONFIGURED");
  console.log(`  To:      ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body:    ${html}`);
  console.log("─────────────────────────────────────────────");
}

// ─── Lead notification ──────────────────────────────────────
export async function sendLeadNotification(lead: {
  name: string;
  email: string;
  phone: string;
  service: string;
  description: string;
  source: string;
}) {
  await sendEmail({
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
}

// ─── Invite / welcome email ─────────────────────────────────
export async function sendInviteEmail({
  to,
  name,
  email,
  password,
  loginUrl,
  subject,
  body,
}: {
  to: string;
  name: string;
  email: string;
  password: string;
  loginUrl: string;
  subject?: string;
  body?: string;
}) {
  const finalSubject = (subject || "You've been invited to Precise Built Field OS")
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{email\}\}/g, email);

  const finalBody = (
    body ||
    "Hi {{name}}, your account has been created.<br><br>Email: {{email}}<br>Password: {{password}}<br><br>Login at: <a href=\"{{loginUrl}}\">{{loginUrl}}</a>"
  )
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{email\}\}/g, email)
    .replace(/\{\{password\}\}/g, password)
    .replace(/\{\{loginUrl\}\}/g, loginUrl);

  await sendEmail({ to, subject: finalSubject, html: finalBody });
}
