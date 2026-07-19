import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase auth callback (spec §5, §9). The password-recovery email link points
 * here with a PKCE `code`; we exchange it for a session (establishing the
 * short-lived recovery session) and forward to `next` (/auth/reset), where the
 * user sets a new password. On any failure we send them to /auth/reset without
 * a session, which renders the invalid/expired-link guard.
 *
 * This route-handler exchange is why /auth/reset needs no client "verifying"
 * spinner — verification is already resolved server-side before the page loads.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  // Only ever redirect to an internal path — never an attacker-supplied URL.
  const next = nextParam.startsWith("/") ? nextParam : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const url = request.nextUrl.clone();
      url.pathname = next;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const guard = request.nextUrl.clone();
  guard.pathname = "/auth/reset";
  guard.search = "?error=invalid";
  return NextResponse.redirect(guard);
}
