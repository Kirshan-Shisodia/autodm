import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

// Minimal post-activation landing page (spec §6.1 redirect target). The full
// Edit Automation screen is a later phase (spec §10).
export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: automation } = await supabase
    .from("automations")
    .select(
      "id, name, type, trigger_type, trigger_keywords, media_id, dm_message, dm_link, is_active",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!automation) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="size-7 text-green-600" />
        <div>
          <h1 className="text-xl font-medium">{automation.name}</h1>
          <p className="text-sm text-muted-foreground">
            {automation.is_active
              ? "Active — comment the keyword on your post to test it."
              : "Paused"}
          </p>
        </div>
      </div>

      <dl className="mt-8 space-y-4 rounded-xl border p-6 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="font-medium capitalize">{automation.type}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Trigger</dt>
          <dd className="font-medium">
            {automation.trigger_type === "all"
              ? "Any comment"
              : (automation.trigger_keywords as string[])
                  .map((k) => k.toUpperCase())
                  .join(", ")}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Applies to</dt>
          <dd className="font-medium">
            {automation.media_id ? "One post" : "All posts"}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground">Message</dt>
          <dd className="whitespace-pre-wrap font-medium">
            {automation.dm_message}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex gap-3">
        <Link
          href="/automations/new"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Create another
        </Link>
        <Link
          href="/accounts"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
        >
          Back to accounts
        </Link>
      </div>
    </div>
  );
}
