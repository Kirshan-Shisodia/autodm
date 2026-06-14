import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await req.json().catch(() => ({ id: undefined }));
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  // Soft-disable the account. RLS + the explicit user_id filter ensure the
  // user can only disconnect their own account (defense in depth).
  const { error } = await supabase
    .from("instagram_accounts")
    .update({
      is_active: false,
      disconnected_at: new Date().toISOString(),
      disconnect_reason: "user_requested",
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deactivate this account's automations so nothing keeps firing.
  await supabase
    .from("automations")
    .update({ is_active: false })
    .eq("ig_account_id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
