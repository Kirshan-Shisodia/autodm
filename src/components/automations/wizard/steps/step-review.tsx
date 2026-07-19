"use client";

// Step 6 — Review & activate (spec §6). Target + Message are shown expanded
// (highest-stakes info); trigger, link and public reply collapse behind "Show
// details". Every row has an Edit link that jumps back to its step.

import { useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";

import {
  LINK_PLACEHOLDER,
  type StepNum,
  type WizardState,
} from "@/lib/automations/wizard";
import { cn } from "@/lib/utils";

function Row({
  label,
  step,
  onEdit,
  children,
}: {
  label: string;
  step: StepNum;
  onEdit: (s: StepNum) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.055em] text-ink-muted">
          {label}
        </p>
        <div className="mt-1 wrap-break-word text-sm text-ink">{children}</div>
      </div>
      <button
        type="button"
        onClick={() => onEdit(step)}
        aria-label={`Edit ${label}`}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline"
      >
        <Pencil className="size-3.5" /> Edit
      </button>
    </div>
  );
}

function NotSet() {
  return <span className="text-ink-muted">Not set</span>;
}

export function StepReview({
  state,
  goToStep,
}: {
  state: WizardState;
  goToStep: (s: StepNum) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const typeLabel = state.type === "reel" ? "Reel comments" : "Post comments";
  const target = state.media_id ? "One selected post" : "All posts";
  const triggerSummary =
    state.trigger_type === "all"
      ? "Any comment"
      : state.trigger_keywords.map((k) => k.toUpperCase()).join(", ");

  return (
    <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card">
      {/* Expanded, highest-stakes rows */}
      <div className="divide-y divide-border-subtle px-5">
        <Row label="Target" step={1} onEdit={goToStep}>
          <span className="font-medium">{typeLabel}</span>
          <span className="text-ink-secondary"> · {target}</span>
        </Row>
        <Row label="Message" step={4} onEdit={goToStep}>
          <span className="whitespace-pre-wrap">
            {state.dm_message.replace(LINK_PLACEHOLDER, "[link]") || <NotSet />}
          </span>
        </Row>
      </div>

      {/* Collapsed details */}
      <button
        type="button"
        onClick={() => setShowDetails((v) => !v)}
        aria-expanded={showDetails}
        className="flex w-full items-center justify-between border-t border-border-default px-5 py-3 text-sm font-medium text-ink-secondary transition-colors hover:bg-hover-bg"
      >
        Show details
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            showDetails && "rotate-180",
          )}
        />
      </button>

      {showDetails && (
        <div className="divide-y divide-border-subtle border-t border-border-subtle px-5">
          <Row label="Trigger" step={3} onEdit={goToStep}>
            {triggerSummary || <NotSet />}
          </Row>
          <Row label="Link" step={4} onEdit={goToStep}>
            {state.dm_link || <NotSet />}
          </Row>
          <Row label="Public reply" step={5} onEdit={goToStep}>
            {state.comment_reply_text || <NotSet />}
          </Row>
        </div>
      )}
    </div>
  );
}
