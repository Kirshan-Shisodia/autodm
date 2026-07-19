import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL");

  if (!user) {
    return NextResponse.redirect(new URL("/login", appUrl));
  }

  // CSRF protection
  const state = crypto.randomBytes(32).toString("hex");
  const graphVersion = process.env.FB_GRAPH_API_VERSION ?? "v18.0";
  const redirectUri = new URL("/api/auth/callback/facebook", appUrl);
  const oauthUrl = new URL(
    `https://www.facebook.com/${graphVersion}/dialog/oauth`,
  );

  oauthUrl.search = new URLSearchParams({
    client_id: requiredEnv("NEXT_PUBLIC_FB_APP_ID"),
    config_id: requiredEnv("FB_LOGIN_CONFIG_ID"),
    redirect_uri: redirectUri.toString(),
    state,
    response_type: "code",
  }).toString();

  const response = NextResponse.redirect(oauthUrl);
  const cookieOpts = {
    httpOnly: true,
    secure: redirectUri.protocol === "https:",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  response.cookies.set("fb_oauth_state", state, cookieOpts);
  // The callback runs with the service-role client (no session), so persist the
  // ChatPilott user id here to know which user this connection belongs to.
  response.cookies.set("fb_oauth_uid", user.id, cookieOpts);

  return response;
}
