"use client";

// The five-card stats strip above the Automations list. Flat cards, hairline
// borders, mono numerals — HALO Rule 2: data surfaces don't float.

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FileText,
  PauseCircle,
  PlayCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatCount,
  type ListTab,
  type StatCounts,
} from "@/lib/automations/list";

type CardSpec = {
  key: ListTab;
  label: string;
  icon: LucideIcon;
  /** Icon tile styling, from the HALO status tokens. */
  tile: string;
};

const CARDS: CardSpec[] = [
  {
    key: "all",
    label: "Total Automations",
    icon: Zap,
    tile: "bg-surface-muted text-ink-secondary",
  },
  {
    key: "active",
    label: "Active",
    icon: PlayCircle,
    tile: "bg-success-bg text-success",
  },
  {
    key: "paused",
    label: "Paused",
    icon: PauseCircle,
    tile: "bg-warning-bg text-warning-text",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    tile: "bg-surface-muted text-ink-secondary",
  },
  {
    key: "draft",
    label: "Drafts",
    icon: FileText,
    tile: "bg-surface-muted text-ink-tertiary",
  },
];

export function StatCards({
  counts,
  deltas,
  activeTab,
  onSelect,
}: {
  counts: StatCounts;
  deltas: StatCounts;
  activeTab: ListTab;
  onSelect: (tab: ListTab) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {CARDS.map((card) => {
        const key = card.key;
        const Icon = card.icon;
        const delta = deltas[key];
        const selected = activeTab === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={selected}
            className={cn(
              "group rounded-xl border bg-surface-card px-4 py-3.5 text-left transition-colors duration-100 [transition-timing-function:var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              selected
                ? "border-brand/45 bg-hover-bg"
                : "border-border-default hover:border-border-strong",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[12px] font-medium text-ink-tertiary">
                {card.label}
              </span>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg",
                  card.tile,
                )}
                aria-hidden
              >
                <Icon className="size-3.5" />
              </span>
            </div>

            <div className="wz-font-mono mt-3 text-[30px] font-semibold leading-none tracking-[-0.4px] text-ink">
              {formatCount(counts[key])}
            </div>

            <Delta value={delta} />
          </button>
        );
      })}
    </div>
  );
}

/** "↑ 2 vs last 30 days" — the quiet second line. Zero reads as an em dash. */
function Delta({ value }: { value: number }) {
  const none = value === 0;
  const Icon = value > 0 ? ArrowUp : ArrowDown;

  return (
    <div className="mt-2.5 flex items-center gap-1 text-[11px]">
      {none ? (
        <span className="text-ink-muted" aria-hidden>
          —
        </span>
      ) : (
        <Icon
          className={cn("size-3", value > 0 ? "text-success" : "text-danger")}
          aria-hidden
        />
      )}
      <span
        className={cn(
          "wz-font-mono font-medium",
          none ? "text-ink-muted" : value > 0 ? "text-success" : "text-danger",
        )}
      >
        {none ? "0" : Math.abs(value)}
      </span>
      <span className="text-ink-muted">vs last 30 days</span>
    </div>
  );
}
