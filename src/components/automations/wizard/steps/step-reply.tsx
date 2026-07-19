"use client";

// Step 5 — Public comment reply (Pro, spec §6). Optional. Free plan sees a
// value-prop block with Upgrade to Pro (the step stays skippable via Continue);
// Pro gets a 280-char textarea + counter. Halo v4 tokens; violet PRO accent.

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { REPLY_MAX, type Plan, type WizardState } from "@/lib/automations/wizard";
import { cn } from "@/lib/utils";

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
  const nearLimit = count > REPLY_MAX * 0.9;

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-[#e7defb] bg-[#f7f4fc] p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#6647c9]">
            <Sparkles className="size-5" />
          </span>
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-base font-bold text-ink">
              Reply publicly, too
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#6647c9]">
                Pro
              </span>
            </p>
            <p className="text-sm text-ink-secondary">
              On Pro, ChatPilott also posts a public reply under the comment
              (&ldquo;Just sent it your way! 📩&rdquo;) so everyone sees it
              working. You can skip this and activate now.
            </p>
            <Link
              href="/billing?upgrade=pro"
              className="mt-2 inline-flex items-center rounded-lg bg-[#6647c9] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5638b0]"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-secondary">
        Optional — posts a public reply under the comment when the DM is sent.
      </p>
      <div className="overflow-hidden rounded-xl border border-border-default bg-surface-canvas focus-within:border-border-focus focus-within:ring-2 focus-within:ring-brand/30">
        <textarea
          value={state.comment_reply_text}
          onChange={(e) =>
            set({ comment_reply_text: e.target.value.slice(0, REPLY_MAX) })
          }
          rows={3}
          maxLength={REPLY_MAX}
          placeholder="Just sent it your way! 📩 Check your DMs."
          aria-label="Comment reply"
          className="w-full resize-none bg-transparent p-3.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <div className="flex justify-end border-t border-border-default px-3 py-1.5">
          <span
            className={cn(
              "font-mono text-xs tabular-nums",
              count >= REPLY_MAX
                ? "text-danger"
                : nearLimit
                  ? "text-warning-text"
                  : "text-ink-muted",
            )}
          >
            {count} / {REPLY_MAX}
          </span>
        </div>
      </div>
    </div>
  );
}
