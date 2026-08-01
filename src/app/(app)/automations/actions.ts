"use server";

// Server Actions for the Automations list. Every write this screen makes goes
// through here: the status change, duplicate, delete, and the bulk equivalents.
// Ownership is enforced by RLS (`user_id = auth.uid()`); we also scope every
// query by the session user as defence in depth and never trust a client id.

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { FREE_AUTOMATION_LIMIT, type Plan } from "@/lib/dashboard";
import {
  AUTOMATION_STATUSES,
  type AutomationStatus,
} from "@/lib/automations/list";

type ActionResult = { ok: true } | { ok: false; error: string };
type BulkResult = { ok: true; count: number } | { ok: false; error: string };

function isStatus(value: string): value is AutomationStatus {
  return (AUTOMATION_STATUSES as readonly string[]).includes(value);
}

/**
 * Move one automation to a lifecycle status. `is_active` is kept in lockstep by
 * a DB trigger, so the webhook path keeps working untouched.
 */
export async function setAutomationStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  if (!isStatus(status)) return { ok: false, error: "invalid_status" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("automations")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "update_failed" };

  revalidatePath("/automations");
  return { ok: true };
}

/** The row toggle: active <-> paused, nothing else. */
export async function toggleAutomation(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  return setAutomationStatus(id, active ? "active" : "paused");
}

/** Bulk status change from the toolbar. Ids the user doesn't own simply miss. */
export async function bulkSetStatus(
  ids: string[],
  status: string,
): Promise<BulkResult> {
  if (ids.length === 0) return { ok: false, error: "empty_selection" };
  if (!isStatus(status)) return { ok: false, error: "invalid_status" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase
    .from("automations")
    .update({ status })
    .in("id", ids)
    .eq("user_id", user.id)
    .select("id");

  if (error) return { ok: false, error: "update_failed" };

  revalidatePath("/automations");
  return { ok: true, count: data?.length ?? 0 };
}

/** Bulk delete; `ON DELETE CASCADE` cleans up short_links and dm_logs. */
export async function bulkDeleteAutomations(
  ids: string[],
): Promise<BulkResult> {
  if (ids.length === 0) return { ok: false, error: "empty_selection" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase
    .from("automations")
    .delete()
    .in("id", ids)
    .eq("user_id", user.id)
    .select("id");

  if (error) return { ok: false, error: "delete_failed" };

  revalidatePath("/automations");
  return { ok: true, count: data?.length ?? 0 };
}

/**
 * Duplicate a row as a draft named "Copy of <name>". Draft rather than paused
 * so an accidental second automation can never fire on the same post. The copy
 * drops `short_link_id` (it gets its own on save); the raw `dm_link` survives
 * so Edit can re-create a short link.
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
      "name, description, ig_account_id, type, trigger_type, trigger_keywords, media_id, media_url, dm_message, dm_link, comment_reply_text, ask_for_email, email_followup_message, follow_required",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!src) return { ok: false, error: "not_found" };

  // Free plan allows a single automation — duplicating would exceed it.
  const limited = await isFreeUserAtLimit(supabase, user.id);
  if (limited) return { ok: false, error: "free_limit" };

  const { data: copy, error } = await supabase
    .from("automations")
    .insert({
      ...src,
      user_id: user.id,
      name: `Copy of ${src.name}`,
      status: "draft",
      is_active: false,
      short_link_id: null,
    })
    .select("id")
    .single();

  if (error || !copy) return { ok: false, error: "duplicate_failed" };

  revalidatePath("/automations");
  return { ok: true, id: copy.id };
}

/** Delete a row; `ON DELETE CASCADE` cleans up dependent short_links. */
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

// Server-side enforcement of the free-plan cap — the UI gate is convenience.
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
