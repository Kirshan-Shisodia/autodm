// Account Health — four operational tiles, each a coloured dot and two words.
//
// This card's job is to be ignorable. Everything green means "stop reading and
// go look at your numbers", so the design gives status no visual weight until
// something is actually wrong. Status is never colour-only: every dot sits
// beside a word, so the card survives a greyscale screenshot.

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { AnalyticsCard } from "@/components/analytics/card";
import type { HealthTile, HealthTone } from "@/lib/dashboard/query";

// HALO status.*.indicator, now exposed as utilities in globals.css rather than
// inlined as raw hexes here.
const DOT: Record<HealthTone, string> = {
  ok: "bg-success-indicator",
  warn: "bg-warning-indicator",
  bad: "bg-danger-indicator",
  idle: "bg-border-strong",
};

const TEXT: Record<HealthTone, string> = {
  ok: "text-success",
  warn: "text-warning-text",
  bad: "text-danger",
  idle: "text-ink-muted",
};

export function AccountHealth({
  tiles,
  className,
}: {
  tiles: HealthTile[];
  className?: string;
}) {
  return (
    <AnalyticsCard
      title="Account Health"
      className={className}
      action={
        <Link
          href="/accounts"
          className="inline-flex items-center gap-1 rounded-sm text-[12px] font-medium text-brand transition-colors duration-100 hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          View all
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      }
    >
      {/* This card has the least to say in its row — four short tiles against a
          funnel and a table — so the shared row height leaves it with surplus.
          `auto-rows-fr` hands that surplus to the tiles evenly, and each tile
          centres its own content: a tall tile with three lines pinned to the
          top reads as a rendering bug, the same three lines centred reads as a
          tile that was meant to be that size. */}
      <ul className="grid h-full auto-rows-fr grid-cols-1 gap-2.5 sm:grid-cols-2">
        {tiles.map((tile) => (
          <li
            key={tile.key}
            className="flex flex-col justify-center rounded-lg border border-border-subtle bg-surface-app px-3 py-2.5"
          >
            <p className="truncate text-[11px] font-medium text-ink-tertiary">
              {tile.label}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5">
              <span
                className={cn("size-1.5 shrink-0 rounded-full", DOT[tile.tone])}
                aria-hidden
              />
              <span
                className={cn(
                  "truncate text-[12px] font-medium",
                  TEXT[tile.tone],
                )}
              >
                {tile.status}
              </span>
            </p>
            {tile.detail && (
              <p className="mt-0.5 truncate text-[11px] text-ink-muted">
                {tile.detail}
              </p>
            )}
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}
