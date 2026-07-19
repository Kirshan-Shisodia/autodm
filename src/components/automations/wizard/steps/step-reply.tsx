"use client";

// Step 5 — Comment reply (Pro, spec §5). Optional. Free plan sees a single
// upgrade nudge (not a hard block); Pro gets a 280-char textarea + preview.

import { Sparkles } from "lucide-react";

import { REPLY_MAX, type WizardState } from "@/lib/automations/wizard";
import type { Plan } from "@/lib/automations/wizard";

export function StepReply({
  state,
  set,
  plan,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
  plan: Plan;
}) {
  const isPro = plan === "pro" || plan === "platinum";
  const count = state.comment_reply_text.length;
  const over = count > REPLY_MAX;

  if (!isPro) {
    return (
      <div className="rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-[var(--wz-bg-alt)] p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--wz-accent)]/10 text-[var(--wz-accent)]">
            <Sparkles className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--wz-text)]">
              Auto-reply to the comment, too
            </p>
            <p className="text-sm text-[var(--wz-text-muted)]">
              On Pro, ChatPilott also posts a public reply under the comment (&ldquo;Just
              sent it your way! 📩&rdquo;) so others see it working. You can skip this
              and activate now.
            </p>
            <a
              href="/billing"
              className="mt-1 inline-block text-sm font-medium text-[var(--wz-accent)] hover:underline"
            >
              Upgrade to Pro →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--wz-text-muted)]">
        Optional. Posts a public reply under the comment when the DM is sent.
      </p>
      <div className="rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-white">
        <textarea
          value={state.comment_reply_text}
          onChange={(e) => set({ comment_reply_text: e.target.value })}
          rows={3}
          maxLength={REPLY_MAX + 40}
          placeholder="Just sent it your way! 📩 Check your DMs."
          aria-label="Comment reply"
          aria-invalid={over}
          className="w-full resize-none rounded-t-[var(--wz-r-card)] bg-transparent p-3 text-sm text-[var(--wz-text)] placeholder:text-[var(--wz-text-muted)] focus:outline-none"
        />
        <div className="flex justify-end border-t border-[var(--wz-border)] px-3 py-1.5">
          <span
            className={`wz-font-mono text-xs ${over ? "text-[var(--wz-accent-pop)]" : "text-[var(--wz-text-muted)]"}`}
          >
            {count} / {REPLY_MAX}
          </span>
        </div>
      </div>
    </div>
  );
}
