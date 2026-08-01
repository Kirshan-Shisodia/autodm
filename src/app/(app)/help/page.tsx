// Help & Support. Lives inside the (app) shell so it gets the sidebar; auth is
// already enforced by that layout. The catalog is static (see lib/help.ts), so
// this page fetches nothing — it only arranges.
//
// Layout mirrors Billing: a main column that narrows as you filter, and a
// persistent right rail for status, contact routes and community.

import Link from "next/link";
import { CircleHelp } from "lucide-react";

import { HelpSearch } from "@/components/help/help-search";
import { HelpSidebar } from "@/components/help/help-sidebar";
import { StillNeedHelp } from "@/components/help/still-need-help";

export const metadata = {
  title: "Help & Support · ChatPilott",
  description: "Find answers, get help, and connect with our support team.",
};

export default function HelpPage() {
  return (
    <div className="space-y-5">
      {/* ---------------- Page header ---------------- */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.4px] text-ink max-sm:text-[22px]">
            Help &amp; Support
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">
            Find answers, get help, and connect with our support team.
          </p>
        </div>

        <Link
          href="/help/articles"
          className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-lg border border-border-default bg-surface-card px-3 text-[13px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <CircleHelp className="size-4 text-ink-muted" aria-hidden />
          Help Center
        </Link>
      </div>

      {/* ---------------- Search + content, with the support rail ---------------- */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <HelpSearch />
          <StillNeedHelp />
        </div>

        <HelpSidebar />
      </div>
    </div>
  );
}
