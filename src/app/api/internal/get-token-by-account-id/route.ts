import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/crypto";

// The crypto module needs Node APIs, not the Edge runtime.
export const runtime = "nodejs";

// Timing-safe compare that won't throw on length mismatch.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Still do a comparison to keep timing roughly constant.
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  // 1. Auth — shared secret, timing-safe, fail closed if env missing.
  const provided = req.headers.get("x-internal-api-key") ?? "";
  const expected = process.env.INTERNAL_API_KEY ?? "";
  if (!expected || !safeEqual(provided, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Body — id travels in the JSON body, never the query string.
  let body: { ig_account_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const igAccountId = body.ig_account_id;
  if (typeof igAccountId !== "string" || igAccountId.length === 0) {
    return NextResponse.json(
      { error: "missing_ig_account_id" },
      { status: 400 },
    );
  }

  // 3. Look up account via the service-role client (machine-to-machine, no session).
  const admin = createAdminClient();
  const { data: account, error } = await admin
    .from("instagram_accounts")
    .select(
      "id, fb_page_id, ig_user_id, is_active, access_token_encrypted, access_token_iv",
    )
    .eq("id", igAccountId)
    .single();

  if (error || !account) {
    return NextResponse.json({ error: "account_not_found" }, { status: 404 });
  }
  if (!account.is_active) {
    return NextResponse.json({ error: "account_inactive" }, { status: 409 });
  }

  // 4. Decrypt — never log the blob, IV, key, or plaintext token.
  let token: string;
  try {
    token = decryptToken(
      account.access_token_encrypted,
      account.access_token_iv,
    );
  } catch {
    console.error(`[internal-token] decrypt_failed for account ${account.id}`);
    return NextResponse.json({ error: "decrypt_failed" }, { status: 500 });
  }

  // 5. Minimal payload — only what the DM call needs.
  return NextResponse.json({
    page_access_token: token,
    fb_page_id: account.fb_page_id,
    ig_user_id: account.ig_user_id,
  });
}

// Reject any non-POST method explicitly.
export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
