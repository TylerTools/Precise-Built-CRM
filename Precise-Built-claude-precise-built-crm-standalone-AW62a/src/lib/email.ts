import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendLeadNotification(lead: {
  name: string;
  email: string;
  phone: string;
  service: string;
  description: string;
  source: string;
}) {
  if (!process.env.SMTP_HOST) {
    console.log("[Email] SMTP not configured — skipping notification");
    console.log("[Email] New lead:", lead.name, lead.email);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@precisebuilt.com",
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
