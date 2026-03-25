import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Owner access required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/settings?drive=error", url.origin)
    );
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "https://precise-built-crm.vercel.app/api/auth/google-drive/callback";

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(
      new URL("/settings?drive=error", url.origin)
    );
  }

  const tokens = await tokenRes.json();
  const expiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {
      driveConnected: true,
      driveRefreshToken: tokens.refresh_token || null,
      driveAccessToken: tokens.access_token || null,
      driveTokenExpiry: expiry,
    },
    create: {
      id: "singleton",
      driveConnected: true,
      driveRefreshToken: tokens.refresh_token || null,
      driveAccessToken: tokens.access_token || null,
      driveTokenExpiry: expiry,
    },
  });

  return NextResponse.redirect(
    new URL("/settings?drive=connected", url.origin)
  );
}
