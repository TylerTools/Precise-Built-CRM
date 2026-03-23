import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url)
    );
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_not_configured", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("[Auth] NEXT_PUBLIC_APP_URL is not set");
      return NextResponse.redirect(
        new URL("/login?error=oauth_not_configured", request.url)
      );
    }
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    console.log("[Auth] Google OAuth redirect_uri:", redirectUri);

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
      console.error("[Auth] Google token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(
        new URL("/login?error=token_exchange_failed", request.url)
      );
    }

    const tokens = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(
        new URL("/login?error=user_info_failed", request.url)
      );
    }

    const googleUser = await userInfoRes.json();

    // Find existing user by email — only allow pre-registered users
    const user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=not_authorized", request.url)
      );
    }

    // Issue JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.redirect(new URL(state, request.url));

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Auth] Google OAuth error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_error", request.url)
    );
  }
}
