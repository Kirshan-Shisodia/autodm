import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  autoDescription,
  autoName,
  createAutomationSchema,
  generateShortCode,
} from "@/lib/automations/wizard";

export const runtime = "nodejs";

// Activate flow (spec §6). Writes the one automations row the n8n engine reads.
// All validation is server-side — the client is never trusted (spec §6.1).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createAutomationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const input = parsed.data;

  // IDOR defense (spec §6.1, PRD §14): the ig_account must belong to this user.
  // RLS already scopes the select, but we assert ownership explicitly.
  const { data: account } = await supabase
    .from("instagram_accounts")
    .select("id, is_active")
    .eq("id", input.ig_account_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!account) {
    return NextResponse.json({ error: "account_not_found" }, { status: 404 });
  }
  if (!account.is_active) {
    return NextResponse.json({ error: "account_inactive" }, { status: 409 });
  }

  // 1. Insert the automation (active = true).
  const { data: automation, error: insertErr } = await supabase
    .from("automations")
    .insert({
      user_id: user.id,
      ig_account_id: input.ig_account_id,
      type: input.type,
      media_id: input.media_id,
      media_url: input.media_url ?? null,
      trigger_type: input.trigger_type,
      trigger_keywords: input.trigger_keywords,
      dm_message: input.dm_message,
      dm_link: input.dm_link ?? null,
      comment_reply_text: input.comment_reply_text || null,
      is_active: true,
      status: "active",
      name: autoName(input),
      description: autoDescription(input),
    })
    .select("id")
    .single();

  if (insertErr || !automation) {
    return NextResponse.json(
      { error: "automation_insert_failed" },
      { status: 500 },
    );
  }

  // 2. If a link was set, create a short_link and back-reference it.
  if (input.dm_link) {
    const shortCode = generateShortCode();
    const { data: shortLink } = await supabase
      .from("short_links")
      .insert({
        user_id: user.id,
        automation_id: automation.id,
        original_url: input.dm_link,
        short_code: shortCode,
      })
      .select("id")
      .single();

    if (shortLink) {
      await supabase
        .from("automations")
        .update({ short_link_id: shortLink.id })
        .eq("id", automation.id);
    }
  }

  // 3. Fire-and-forget: register the media with Meta via n8n so live comments
  //    start flowing into Workflow 1 (spec §6.2). Never block activation on it.
  void subscribeMedia({
    automationId: automation.id,
    igAccountId: input.ig_account_id,
    mediaId: input.media_id,
  });

  return NextResponse.json({ id: automation.id }, { status: 201 });
}

// One of only two direct Next.js → n8n calls (spec §6.3). Best-effort.
async function subscribeMedia(payload: {
  automationId: string;
  igAccountId: string;
  mediaId: string | null;
}) {
  const url = process.env.N8N_SUBSCRIBE_WEBHOOK_URL;
  if (!url) return; // dependency not wired yet — safe to skip in dev.
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking; the automation row already exists.
  }
}
