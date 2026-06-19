// Past-due banner (spec §6) — the single red element this screen is allowed.
// Renders only when subscription_status === 'past_due'.

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function PastDueBanner() {
  return (
    <div
      role="alert"
      className="mb-6 flex flex-col gap-3 rounded-[var(--wz-r-card)] border border-[var(--wz-accent-pop)]/30 bg-[var(--wz-accent-pop)]/8 px-4 py-3 text-sm sm:flex-row sm:items-center"
    >
      <AlertTriangle className="size-4 shrink-0 text-[var(--wz-accent-pop)]" />
      <p className="flex-1 text-[var(--wz-text)]">
        Your last payment failed. Update billing to keep automations running.
      </p>
      <Link
        href="/billing"
        className="shrink-0 rounded-md bg-[var(--wz-accent-pop)] px-3 py-1.5 text-center text-xs font-medium text-white hover:opacity-90"
      >
        Update billing
      </Link>
    </div>
  );
}
