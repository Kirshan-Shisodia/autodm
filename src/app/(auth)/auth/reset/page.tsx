import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

/**
 * /auth/reset (spec §9, §10). The recovery callback establishes a session
 * before this page renders, so verification is already resolved server-side —
 * no client "verifying" spinner needed. If there's no recovery session (link
 * invalid, expired, or opened directly), show the guard state instead of a bare
 * broken form.
 */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-5">
        <div className="flex size-12 items-center justify-center rounded-full bg-danger-bg text-danger">
          <AlertTriangle className="size-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-[24px] leading-[32px] font-bold tracking-[-0.4px] text-ink sm:text-[32px]">
            This link is invalid or expired
          </h1>
          <p className="text-[14px] leading-[24px] text-ink-secondary">
            Password reset links can only be used once and expire after an hour.
            Request a fresh one to continue.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex h-12 w-full items-center justify-center rounded-md bg-action px-4 text-[14px] font-semibold text-ink-inverse transition-colors hover:bg-action-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas focus-visible:outline-none"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
