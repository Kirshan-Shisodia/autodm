"use client";

// The right-hand rail every section shares: a read-only recap of what the
// panel is currently set to, an optional reset, and one or two low-stakes
// prompts (learn more, talk to support).
//
// The recap exists so the state of a section is legible without scrolling the
// form — on Notifications that means "7 / 8 email topics on", not eight
// individual switches restated.

import Link from "next/link";
import { ArrowRight, Headset, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { GhostButton } from "./primitives";
import { useAction } from "./use-section-form";
import { resetSection } from "@/app/(app)/settings/actions";

export type SummaryItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Small status word rendered top-right of the tile, e.g. "Active". */
  status?: string;
  tone?: "neutral" | "success" | "brand" | "danger";
};

const TONES = {
  neutral: "bg-surface-muted text-ink-secondary",
  success: "bg-success-bg text-success",
  brand: "bg-selected-bg text-brand",
  danger: "bg-danger-bg text-danger",
} as const;

export function SummaryRail({
  title,
  blurb,
  items,
  resetKey,
  footerStrip,
  children,
}: {
  title: string;
  blurb: string;
  items: SummaryItem[];
  /** Section id understood by `resetSection`; omit to hide the reset button. */
  resetKey?: string;
  /**
   * On sections whose content is naturally shorter than this rail, render the
   * prompt cards as a full-width strip *below* the content instead of stacked
   * here. Same components and copy — position only.
   *
   * That is the single biggest whitespace fix in the module: it takes ~300px
   * of height out of the rail and turns it into ~150px of full-width content,
   * which closes the L-shaped void beside the rail's lower half.
   */
  footerStrip?: boolean;
  children?: React.ReactNode;
}) {
  const { pending, run } = useAction();

  const summary = (
    <div className="space-y-4 xl:sticky xl:top-6">
      <section className="rounded-xl border border-border-default bg-surface-card p-5">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-[12px] text-ink-tertiary">{blurb}</p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border-default bg-surface-card p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg",
                    TONES[item.tone ?? "neutral"],
                  )}
                  aria-hidden
                >
                  <item.icon className="size-3.5" />
                </span>
                {item.status && (
                  <span className="text-[10px] font-medium text-success">
                    {item.status}
                  </span>
                )}
              </div>
              <p className="mt-2.5 text-[11px] text-ink-tertiary">
                {item.label}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug font-semibold text-ink">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {resetKey && (
          <GhostButton
            className="mt-4 w-full border-transparent bg-warning-bg text-warning-text hover:bg-selected-bg"
            disabled={pending}
            onClick={() =>
              run(() => resetSection(resetKey), {
                success: "Reset to the recommended defaults.",
              })
            }
          >
            {pending ? "Resetting…" : "Reset to Recommended"}
          </GhostButton>
        )}
      </section>

      {!footerStrip && children}
    </div>
  );

  if (!footerStrip) return summary;

  // Two grid children: the rail cell, then a strip spanning content + rail.
  // The section renders this inside the shell's body grid, so the fragment
  // flattens into siblings and the strip lands on its own full-width row.
  return (
    <>
      {summary}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:col-span-2">
        {children}
      </div>
    </>
  );
}

/** "Learn more" / "Contact support" cards under the recap. */
export function PromptCard({
  icon: Icon,
  title,
  body,
  cta,
  href,
  tone = "brand",
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
  cta: string;
  href: string;
  tone?: "brand" | "plain";
}) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-tertiary">
            {body}
          </p>
        </div>
        {Icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              tone === "brand"
                ? "bg-warning-bg text-brand"
                : "bg-surface-muted text-ink-secondary",
            )}
            aria-hidden
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <Link
        href={href}
        className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded-lg bg-warning-bg text-[12px] font-medium text-warning-text transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-selected-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        {cta}
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}

/** The "Need Help?" card that closes every rail in the reference design. */
export function NeedHelpCard({ topic }: { topic: string }) {
  return (
    <PromptCard
      icon={Headset}
      title="Need Help?"
      body={`Learn more about ${topic}.`}
      cta="Visit Help Center"
      href="/help"
    />
  );
}
