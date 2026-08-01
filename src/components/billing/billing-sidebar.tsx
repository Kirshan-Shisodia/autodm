// The right rail: what the next charge adds up to, then two low-stakes exits
// (buy DMs, talk to a human). The total is the one dark-ink CTA on the screen —
// HALO Rule 4: one primary action per surface.

import Link from "next/link";
import { ArrowRight, Headset, Lock, Send } from "lucide-react";

import { formatINR, GST_RATE, type BillingSummary } from "@/lib/billing";

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={
          strong
            ? "text-[13px] font-semibold text-ink"
            : "text-[13px] text-ink-secondary"
        }
      >
        {label}
      </span>
      <span
        className={
          strong
            ? "wz-font-mono text-[17px] font-semibold tracking-[-0.4px] text-ink"
            : "wz-font-mono text-[13px] text-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}

function ChargesCard({ summary }: { summary: BillingSummary }) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <h2 className="text-[15px] font-semibold text-ink">
        Current Billing Summary
      </h2>

      <div className="mt-4 space-y-2.5">
        {summary.charges.map((charge) => (
          <Row
            key={charge.label}
            label={charge.label}
            value={formatINR(charge.amountPaise)}
          />
        ))}
      </div>

      <hr className="my-4 border-border-default" />

      <div className="space-y-2.5">
        <Row
          label="Total (before tax)"
          value={formatINR(summary.subtotalPaise)}
        />
        <Row
          label={`GST (${Math.round(GST_RATE * 100)}%)`}
          value={formatINR(summary.gstPaise)}
        />
      </div>

      <hr className="my-4 border-border-default" />

      <Row label="Total Amount" value={formatINR(summary.totalPaise)} strong />

      <Link
        href="/billing/manage"
        className="mt-5 flex h-11 items-center justify-center rounded-lg bg-action text-[13px] font-medium text-ink-inverse transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-action-hover active:bg-action-pressed focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Manage Subscription
      </Link>

      <Link
        href="/billing/invoices/current"
        className="mt-2 flex h-11 items-center justify-center rounded-lg bg-warning-bg text-[13px] font-medium text-warning-text transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-selected-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        Download Invoice
      </Link>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
        <Lock className="size-3" aria-hidden />
        Secure billing powered by Razorpay
      </p>
    </section>
  );
}

function PromptCard({
  icon: Icon,
  title,
  body,
  cta,
  href,
}: {
  icon: typeof Send;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <div className="flex items-start gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning-bg text-brand"
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-tertiary">
            {body}
          </p>
          <Link
            href={href}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-default bg-surface-card px-3 text-[12px] font-medium text-brand transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            {cta}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function BillingSidebar({ summary }: { summary: BillingSummary }) {
  return (
    <div className="space-y-4">
      <ChargesCard summary={summary} />

      <PromptCard
        icon={Send}
        title="Need More DMs?"
        body="Purchase additional DMs to keep your automations running without interruption."
        cta="Buy Extra DMs"
        href="/billing/extra-dms"
      />

      <PromptCard
        icon={Headset}
        title="Have Questions?"
        body="Our support team is here to help you with any billing related queries."
        cta="Contact Support"
        href="/help"
      />
    </div>
  );
}
