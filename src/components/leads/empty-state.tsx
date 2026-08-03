"use client";

// Two different empty screens, because they call for two different actions.
//
// "No leads at all" is a setup problem — the answer is an automation. "No
// leads *matching this*" is a filter problem — the answer is to relax the
// filter, and offering "Create Automation" there would be a non sequitur.

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, SearchX, Users } from "lucide-react";

export function LeadsEmpty({ filtered }: { filtered: boolean }) {
  return filtered ? <NoMatches /> : <NoLeads />;
}

function Shell({
  icon,
  title,
  detail,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span
        className="flex size-11 items-center justify-center rounded-xl bg-surface-muted text-ink-tertiary"
        aria-hidden
      >
        {icon}
      </span>
      <h2 className="text-[15px] font-semibold tracking-[-0.16px] text-ink">
        {title}
      </h2>
      <p className="max-w-[340px] text-[13px] leading-[20px] text-ink-tertiary">
        {detail}
      </p>
      <div className="mt-1">{action}</div>
    </div>
  );
}

function NoLeads() {
  return (
    <Shell
      icon={<Users className="size-5" />}
      title="No leads yet"
      detail="Leads appear here the moment an automation collects someone's email or replies to a comment. Set one up and this page fills itself."
      action={
        <Link
          href="/automations/new"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-action px-3 text-[12px] font-medium text-ink-inverse transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-action-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Create Automation
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    />
  );
}

function NoMatches() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const reset = () => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of ["accounts", "automations", "sources", "tags", "q", "page", "tab"]) {
      next.delete(key);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <Shell
      icon={<SearchX className="size-5" />}
      title="No leads match these filters"
      detail="Nothing in this period fits what you've narrowed to. Widen the date range or clear a filter to see more."
      action={
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-default px-3 text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          Clear filters and search
        </button>
      }
    />
  );
}
