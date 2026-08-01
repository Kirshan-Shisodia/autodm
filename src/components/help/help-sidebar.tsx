// The right rail on Help & Support: is the product up, how do I reach a human,
// where do other users hang out. All three are server-rendered — nothing here
// has state, and the status list is a constant until a health endpoint exists.

import Link from "next/link";
import { ArrowRight, ChevronRight, CircleCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  COMMUNITY_LINKS,
  COMMUNITY_URL,
  OVERALL_STATUS_COPY,
  overallStatus,
  STATUS_LABEL,
  STATUS_PAGE_URL,
  SUPPORT_CHANNELS,
  SYSTEM_SERVICES,
  type ServiceStatus,
} from "@/lib/help";

/** Text colour per status. Green when healthy; HALO danger/warning otherwise. */
const STATUS_TEXT: Record<ServiceStatus, string> = {
  operational: "text-success",
  degraded: "text-warning-text",
  down: "text-danger",
};

const STATUS_DOT: Record<ServiceStatus, string> = {
  operational: "bg-success",
  degraded: "bg-brand",
  down: "bg-danger",
};

function SystemStatusCard() {
  const overall = overallStatus(SYSTEM_SERVICES);
  const copy = OVERALL_STATUS_COPY[overall];

  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <h2 className="text-[15px] font-semibold text-ink">System Status</h2>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[overall])}
          aria-hidden
        />
        <span className={cn("text-[13px] font-medium", STATUS_TEXT[overall])}>
          {copy.title}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-ink-tertiary">{copy.blurb}</p>

      <ul className="mt-4 space-y-2.5">
        {SYSTEM_SERVICES.map((service) => (
          <li
            key={service.name}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex min-w-0 items-center gap-2">
              <CircleCheck
                className={cn("size-3.5 shrink-0", STATUS_TEXT[service.status])}
                aria-hidden
              />
              <span className="truncate text-[12px] text-ink-secondary">
                {service.name}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 text-[12px] font-medium",
                STATUS_TEXT[service.status],
              )}
            >
              {STATUS_LABEL[service.status]}
            </span>
          </li>
        ))}
      </ul>

      <a
        href={STATUS_PAGE_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex items-center justify-center gap-1.5 text-[12px] font-medium text-brand transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        View Status Page
        <ArrowRight className="size-3.5" aria-hidden />
      </a>
    </section>
  );
}

function ContactSupportCard() {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <h2 className="text-[15px] font-semibold text-ink">Contact Support</h2>
      <p className="mt-1 text-[11px] text-ink-tertiary">
        Choose the best way to reach us.
      </p>

      <div className="mt-4 space-y-2">
        {SUPPORT_CHANNELS.map((channel) => {
          const Icon = channel.icon;
          const inner = (
            <>
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning-bg text-brand"
                aria-hidden
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">
                  {channel.title}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-ink-tertiary">
                  {channel.detail}
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-ink-muted"
                aria-hidden
              />
            </>
          );

          const className =
            "flex items-center gap-3 rounded-xl border border-border-default bg-surface-card px-3 py-2.5 transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none";

          return channel.external ? (
            <a key={channel.id} href={channel.href} className={className}>
              {inner}
            </a>
          ) : (
            <Link key={channel.id} href={channel.href} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CommunityCard() {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <h2 className="text-[15px] font-semibold text-ink">Join Our Community</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-tertiary">
        Connect with other users and get help from the community.
      </p>

      <div className="mt-4 flex items-center justify-center gap-3">
        {COMMUNITY_LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={link.label}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg text-[12px] font-semibold text-ink-inverse transition-opacity duration-100 [transition-timing-function:var(--ease-standard)] hover:opacity-85 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none",
              link.chip,
            )}
          >
            {link.label.charAt(0)}
          </a>
        ))}
      </div>

      <a
        href={COMMUNITY_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex items-center justify-center gap-1.5 text-[12px] font-medium text-brand transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        Join Community
        <ArrowRight className="size-3.5" aria-hidden />
      </a>
    </section>
  );
}

export function HelpSidebar() {
  return (
    <div className="space-y-4">
      <SystemStatusCard />
      <ContactSupportCard />
      <CommunityCard />
    </div>
  );
}
