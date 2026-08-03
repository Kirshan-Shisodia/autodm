"use server";

// Server Actions for the Leads screen. Every write this screen makes goes
// through here: the status change from the row menu, tag add/remove, and the
// bulk equivalents from the selection toolbar.
//
// Ownership is enforced by RLS (`user_id = auth.uid()`); we also scope every
// query by the session user as defence in depth and never trust a client id.
//
// There is no delete. A lead is the record of a conversation that actually
// happened — the row menu archives instead, and the migration deliberately
// ships no delete policy to back that up.

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { isLeadStatus, normaliseTag } from "@/lib/leads/model";

type ActionResult = { ok: true } | { ok: false; error: string };
type BulkResult = { ok: true; count: number } | { ok: false; error: string };

/** Guards the bulk paths — a runaway `ids` array shouldn't become one query. */
const MAX_BULK = 500;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Move one lead to a funnel bucket. Touching the status counts as activity —
 * the row would otherwise keep claiming it was last seen a month ago while
 * sitting at the top of a bucket you just moved it into.
 */
export async function setLeadStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  if (!isLeadStatus(status)) return { ok: false, error: "invalid_status" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("leads")
    .update({ status, last_activity_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "update_failed" };

  revalidatePath("/leads");
  return { ok: true };
}

export async function archiveLead(id: string): Promise<ActionResult> {
  return setLeadStatus(id, "archived");
}

/**
 * Add a tag. Read-modify-write rather than an `array_append` RPC: the set is a
 * handful of short strings, and doing it here keeps the de-duplication in one
 * place instead of splitting it between SQL and TypeScript.
 */
export async function addLeadTag(
  id: string,
  rawTag: string,
): Promise<ActionResult> {
  const tag = normaliseTag(rawTag);
  if (!tag) return { ok: false, error: "empty_tag" };
  if (tag.length > 32) return { ok: false, error: "tag_too_long" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: row, error: readError } = await supabase
    .from("leads")
    .select("tags")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (readError || !row) return { ok: false, error: "not_found" };

  const current: string[] = row.tags ?? [];
  if (current.includes(tag)) return { ok: true };

  const { error } = await supabase
    .from("leads")
    .update({ tags: [...current, tag] })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "update_failed" };

  revalidatePath("/leads");
  return { ok: true };
}

export async function removeLeadTag(
  id: string,
  rawTag: string,
): Promise<ActionResult> {
  const tag = normaliseTag(rawTag);
  if (!tag) return { ok: false, error: "empty_tag" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: row, error: readError } = await supabase
    .from("leads")
    .select("tags")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (readError || !row) return { ok: false, error: "not_found" };

  const next = (row.tags ?? []).filter((t: string) => t !== tag);

  const { error } = await supabase
    .from("leads")
    .update({ tags: next })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "update_failed" };

  revalidatePath("/leads");
  return { ok: true };
}

/**
 * Bulk status change from the selection toolbar. Ids the user doesn't own
 * simply miss — RLS filters them out rather than failing the whole batch, so
 * one stale id in the selection can't block the other forty-nine.
 */
export async function bulkSetLeadStatus(
  ids: string[],
  status: string,
): Promise<BulkResult> {
  if (!isLeadStatus(status)) return { ok: false, error: "invalid_status" };
  if (ids.length === 0) return { ok: true, count: 0 };
  if (ids.length > MAX_BULK) return { ok: false, error: "too_many" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data, error } = await supabase
    .from("leads")
    .update({ status, last_activity_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", user.id)
    .select("id");

  if (error) return { ok: false, error: "update_failed" };

  revalidatePath("/leads");
  return { ok: true, count: data?.length ?? 0 };
}
