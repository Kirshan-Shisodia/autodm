import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/crypto";
import { getInstagramMedia } from "@/lib/meta";

// crypto needs Node APIs, not the Edge runtime.
export const runtime = "nodejs";

// Step 2 of the wizard (spec §5): fetch the creator's recent media. The token
// is decrypted server-side and never exposed to the client. Cached 5 minutes.
export async function GET(req: NextRequest) {
  const igAccountId = req.nextUrl.searchParams.get("ig_account_id");
  if (!igAccountId) {
    return NextResponse.json(
      { error: "missing_ig_account_id" },
      { status: 400 },
    );
  }

  // Ownership is enforced by RLS: this session client only sees the user's own
  // accounts (spec §6.1 IDOR defense).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: account, error } = await supabase
    .from("instagram_accounts")
    .select(
      "id, ig_user_id, is_active, access_token_encrypted, access_token_iv",
    )
    .eq("id", igAccountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !account) {
    return NextResponse.json({ error: "account_not_found" }, { status: 404 });
  }
  if (!account.is_active) {
    return NextResponse.json({ error: "account_inactive" }, { status: 409 });
  }

  let token: string;
  try {
    token = decryptToken(
      account.access_token_encrypted,
      account.access_token_iv,
    );
  } catch {
    return NextResponse.json({ error: "decrypt_failed" }, { status: 500 });
  }

  try {
    const media = await getInstagramMedia(account.ig_user_id, token, 25);
    return NextResponse.json(
      { media },
      {
        headers: {
          // Cache per-user response for 5 minutes (spec §5 Step 2).
          "Cache-Control": "private, max-age=300",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "media_fetch_failed" }, { status: 502 });
  }
}
