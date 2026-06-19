"use client";

// Step 6 — Review & Activate (spec §5). Summary card; each row has an Edit
// link that jumps back to the relevant step.

import { Pencil } from "lucide-react";

import {
  LINK_PLACEHOLDER,
  type StepNum,
  type WizardState,
} from "@/lib/automations/wizard";

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
    <div className="flex items-start justify-between gap-4 border-b border-[var(--wz-border)] py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="wz-font-mono text-[11px] uppercase tracking-wide text-[var(--wz-text-muted)]">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-[var(--wz-text)] break-words">
          {children}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onEdit(step)}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--wz-accent)] hover:underline"
      >
        <Pencil className="size-3.5" /> Edit
      </button>
    </div>
  );
}

export function StepReview({
  state,
  goToStep,
}: {
  state: WizardState;
  goToStep: (s: StepNum) => void;
}) {
  const typeLabel = state.type === "reel" ? "Reel" : "Post";
  const triggerSummary =
    state.trigger_type === "all"
      ? "Any comment"
      : state.trigger_keywords.map((k) => k.toUpperCase()).join(", ");

  return (
    <div className="rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-white px-4">
      <Row label="Automation type" step={1} onEdit={goToStep}>
        {typeLabel}
      </Row>
      <Row label="Applies to" step={2} onEdit={goToStep}>
        {state.media_id ? "One selected post" : "All posts"}
      </Row>
      <Row label="Trigger" step={3} onEdit={goToStep}>
        {triggerSummary || (
          <span className="text-[var(--wz-accent-pop)]">No keywords yet</span>
        )}
      </Row>
      <Row label="Message" step={4} onEdit={goToStep}>
        <span className="whitespace-pre-wrap">
          {state.dm_message.replace(LINK_PLACEHOLDER, "[link]") || "—"}
        </span>
      </Row>
      {state.dm_link && (
        <Row label="Link" step={4} onEdit={goToStep}>
          {state.dm_link}
        </Row>
      )}
      {state.comment_reply_text && (
        <Row label="Comment reply" step={5} onEdit={goToStep}>
          {state.comment_reply_text}
        </Row>
      )}
    </div>
  );
}
