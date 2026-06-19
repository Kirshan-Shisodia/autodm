"use server";

// Server Actions for the Automations List (list spec §5, §6). The only writes
// this screen makes: the on/off toggle, duplicate, and delete. Ownership is
// enforced by RLS (`user_id = auth.uid()`); we also scope every query by the
// session user as defence in depth and never trust a client-passed user_id.

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { FREE_AUTOMATION_LIMIT, type Plan } from "@/lib/dashboard";

type ActionResult = { ok: true } | { ok: false; error: string };

/** Flip `automations.is_active` (the signature toggle, §5). */
export async function toggleAutomation(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("automations")
    .update({ is_active: active })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "update_failed" };

  revalidatePath("/automations");
  return { ok: true };
}

/**
 * Duplicate a row as an inactive copy named "Copy of <name>" (§6). Defaults to
 * off so an accidental second automation can't fire on the same post. The new
 * row drops `short_link_id` (the copy gets its own on save); the raw `dm_link`
 * is preserved so Edit can re-create a short link.
 */
export async function duplicateAutomation(
  id: string,
): Promise<ActionResult & { id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: src } = await supabase
    .from("automations")
    .select(
      "name, ig_account_id, type, trigger_type, trigger_keywords, media_id, media_url, dm_message, dm_link, comment_reply_text, ask_for_email, email_followup_message, follow_required",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!src) return { ok: false, error: "not_found" };

  // Free plan allows a single automation — duplicating would exceed it (§7).
  const limited = await isFreeUserAtLimit(supabase, user.id);
  if (limited) return { ok: false, error: "free_limit" };

  const { data: copy, error } = await supabase
    .from("automations")
    .insert({
      ...src,
      user_id: user.id,
      name: `Copy of ${src.name}`,
      is_active: false,
      short_link_id: null,
    })
    .select("id")
    .single();

  if (error || !copy) return { ok: false, error: "duplicate_failed" };

  revalidatePath("/automations");
  return { ok: true, id: copy.id };
}

/** Delete a row; `ON DELETE CASCADE` cleans up dependent short_links (§6). */
export async function deleteAutomation(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("automations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "delete_failed" };

  revalidatePath("/automations");
  return { ok: true };
}

// Server-side enforcement of the free-plan cap (§7) — the UI gate is convenience.
async function isFreeUserAtLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", userId)
    .single();

  const plan = (profile?.plan ?? "free") as Plan;
  if (plan !== "free") return false;

  const { count } = await supabase
    .from("automations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return (count ?? 0) >= FREE_AUTOMATION_LIMIT;
}
