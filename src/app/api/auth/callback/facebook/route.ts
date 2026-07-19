import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken } from "@/lib/crypto";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getPages,
  getInstagramBusinessAccount,
  subscribePageToWebhooks,
} from "@/lib/meta";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export async function GET(req: NextRequest) {
  const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL");
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/accounts?error=${reason}`, appUrl));

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieState = req.cookies.get("fb_oauth_state")?.value;
  const uid = req.cookies.get("fb_oauth_uid")?.value;

  // 1. CSRF check
  if (!code || !state || state !== cookieState) {
    return fail("invalid_state");
  }
  // 2. Session check — the uid cookie tells us which ChatPilott user this is for
  if (!uid) {
    return fail("session_lost");
  }

  try {
    const redirectUri = new URL(
      "/api/auth/callback/facebook",
      appUrl,
    ).toString();

    // 3. Code → short-lived user token
    const shortToken = await exchangeCodeForToken(code, redirectUri);
    if (!shortToken) return fail("token_exchange_failed");

    // 4. Short → long-lived (≈60-day) user token
    const { token: longToken, expiresIn } =
      await exchangeForLongLivedToken(shortToken);
    if (!longToken) return fail("long_token_failed");

    // 5. Enumerate Pages (each carries its own Page token)
    const pages = await getPages(longToken);
    if (pages.length === 0) return fail("no_pages");

    const admin = createAdminClient();
    let connectedCount = 0;

    // 6. For each Page with a linked IG Business account, store the PAGE token
    for (const page of pages) {
      const ig = await getInstagramBusinessAccount(page.id, page.access_token);
      if (!ig) continue; // Page has no linked IG Business account — skip

      const { encrypted, iv } = encryptToken(page.access_token);
      const tokenExpiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : new Date(Date.now() + SIXTY_DAYS_MS).toISOString();

      const subscribed = await subscribePageToWebhooks(
        page.id,
        page.access_token,
      );

      const { error } = await admin.from("instagram_accounts").upsert(
        {
          user_id: uid,
          ig_user_id: ig.id,
          ig_username: ig.username,
          fb_page_id: page.id,
          fb_page_name: page.name,
          access_token_encrypted: encrypted,
          access_token_iv: iv,
          token_expires_at: tokenExpiresAt,
          scopes: [
            "instagram_basic",
            "instagram_manage_comments",
            "instagram_manage_messages",
          ],
          is_active: true,
          webhook_subscribed: subscribed,
          disconnected_at: null,
          disconnect_reason: null,
        },
        { onConflict: "user_id,ig_user_id" },
      );

      if (error) {
        console.error("[fb-callback] upsert failed", error.message);
        return fail("account_save_failed");
      }

      connectedCount += 1;
    }

    // 7. Clear oauth cookies and redirect
    const target =
      connectedCount > 0 ? "/accounts?connected=true" : "/accounts?connected=none";
    const response = NextResponse.redirect(new URL(target, appUrl));
    response.cookies.delete("fb_oauth_state");
    response.cookies.delete("fb_oauth_uid");
    return response;
  } catch (err) {
    console.error("[fb-callback]", err);
    return fail("unexpected");
  }
}
