"use client";

// Automation Wizard parent (spec §3–§6). Holds all state; steps are controlled
// children. Persists to Supabase only on Activate (Step 6). The shell — dark
// title plate, stepper rail, mobile progress strip, sticky footer — lives here.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import {
  STEPS,
  STEP_TITLES,
  TOTAL_STEPS,
  initialState,
  isStepValid,
  type Plan,
  type StepNum,
  type WizardState,
} from "@/lib/automations/wizard";
import { PhonePreview } from "@/components/automations/wizard/phone-preview";
import { StepType } from "@/components/automations/wizard/steps/step-type";
import { StepMedia } from "@/components/automations/wizard/steps/step-media";
import { StepTrigger } from "@/components/automations/wizard/steps/step-trigger";
import { StepMessage } from "@/components/automations/wizard/steps/step-message";
import { StepReply } from "@/components/automations/wizard/steps/step-reply";
import { StepReview } from "@/components/automations/wizard/steps/step-review";

function DarkPlate({ step }: { step: StepNum }) {
  return (
    <div className="wz-animate-plate w-full bg-[var(--wz-bg-dark)] px-4 py-10 text-center sm:py-14">
      <p className="wz-font-mono text-xs uppercase tracking-[0.2em] text-[var(--wz-accent-warm)]">
        Step {step} of {TOTAL_STEPS}
      </p>
      <h1 className="wz-font-display mx-auto mt-3 max-w-3xl text-[40px] leading-tight text-[var(--wz-text-dark)] sm:text-[48px] lg:text-[56px]">
        {STEP_TITLES[step]}
      </h1>
    </div>
  );
}

function StepperRail({
  step,
  maxReached,
  onJump,
}: {
  step: StepNum;
  maxReached: StepNum;
  onJump: (s: StepNum) => void;
}) {
  return (
    <nav aria-label="Wizard steps" className="hidden lg:block">
      <ol className="sticky top-6 space-y-1">
        {STEPS.map((s) => {
          const done = s.n < step;
          const current = s.n === step;
          const clickable = s.n <= maxReached;
          return (
            <li key={s.n}>
              <button
                type="button"
                disabled={!clickable}
                aria-current={current ? "step" : undefined}
                onClick={() => clickable && onJump(s.n)}
                className={[
                  "flex w-full items-center gap-3 rounded-[var(--wz-r-button)] px-3 py-2 text-left text-sm transition-colors",
                  clickable ? "cursor-pointer" : "cursor-default",
                  current
                    ? "bg-[var(--wz-accent)]/8 font-medium text-[var(--wz-accent)]"
                    : done
                      ? "text-[var(--wz-text)] hover:bg-[var(--wz-surface)]"
                      : "text-[var(--wz-text-muted)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "wz-font-mono flex size-6 shrink-0 items-center justify-center rounded-full text-[11px]",
                    current
                      ? "bg-[var(--wz-accent)] text-white"
                      : done
                        ? "bg-[var(--wz-text)] text-white"
                        : "bg-[var(--wz-surface)] text-[var(--wz-text-muted)]",
                  ].join(" ")}
                >
                  {done ? <Check className="size-3.5" /> : String(s.n).padStart(2, "0")}
                </span>
                <span className="flex-1">{s.label}</span>
                {s.pro && (
                  <span className="wz-font-mono rounded-[4px] border border-[var(--wz-accent-pop)] px-1 py-0.5 text-[9px] uppercase text-[var(--wz-accent-pop)]">
                    Pro
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function MobileProgress({ step }: { step: StepNum }) {
  return (
    <div className="sticky top-0 z-10 border-b border-[var(--wz-border)] bg-[var(--wz-bg)] px-4 py-3 lg:hidden">
      <p className="wz-font-mono mb-2 text-xs text-[var(--wz-text-muted)]">
        Step {step} of {TOTAL_STEPS}
      </p>
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < step ? "bg-[var(--wz-accent)]" : "bg-[var(--wz-surface)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function AutomationWizard({
  igAccountId,
  igUsername,
  plan,
}: {
  igAccountId: string;
  igUsername: string;
  plan: Plan;
}) {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(() =>
    initialState(igAccountId),
  );
  const [maxReached, setMaxReached] = useState<StepNum>(1);
  const [submitting, setSubmitting] = useState(false);

  const step = state.step;
  const valid = isStepValid(state, step);
  const showPreview = step >= 4;

  function set(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function goToStep(s: StepNum) {
    setState((prev) => ({ ...prev, step: s }));
  }

  function next() {
    if (!valid) return;
    if (step < TOTAL_STEPS) {
      const ns = (step + 1) as StepNum;
      setState((prev) => ({ ...prev, step: ns }));
      setMaxReached((m) => (ns > m ? ns : m));
    }
  }

  function back() {
    if (step > 1) goToStep((step - 1) as StepNum);
  }

  async function activate() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/automations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ig_account_id: state.ig_account_id,
          type: state.type,
          media_id: state.media_id,
          media_url: state.media_url,
          trigger_type: state.trigger_type,
          trigger_keywords: state.trigger_keywords,
          dm_message: state.dm_message,
          dm_link: state.dm_link || null,
          comment_reply_text: state.comment_reply_text || "",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error ?? "We couldn't activate this automation.");
        setSubmitting(false);
        return;
      }
      toast.success("Automation activated.");
      router.push(`/automations/${body.id}`);
    } catch {
      toast.error("Network error — please try again.");
      setSubmitting(false);
    }
  }

  const hasLink = state.dm_message.includes("{LINK}");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--wz-bg-alt)] wz-font-ui text-[var(--wz-text)]">
      <DarkPlate step={step} />
      <MobileProgress step={step} />

      <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-32 pt-6 sm:px-6 lg:pb-28">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)_360px]">
          {/* Stepper rail */}
          <StepperRail step={step} maxReached={maxReached} onJump={goToStep} />

          {/* Step content */}
          <main className="wz-animate-step mx-auto w-full max-w-[640px]" key={step}>
            <h2 className="mb-1 text-[22px] font-semibold text-[var(--wz-text)]">
              {STEP_TITLES[step]}
            </h2>
            <p className="mb-6 text-sm text-[var(--wz-text-muted)]">
              {STEP_SUBTITLES[step]}
            </p>

            {step === 1 && <StepType state={state} set={set} />}
            {step === 2 && <StepMedia state={state} set={set} />}
            {step === 3 && <StepTrigger state={state} set={set} />}
            {step === 4 && <StepMessage state={state} set={set} />}
            {step === 5 && <StepReply state={state} set={set} plan={plan} />}
            {step === 6 && <StepReview state={state} goToStep={goToStep} />}
          </main>

          {/* Live preview / contextual right column */}
          <aside className="hidden lg:block">
            {showPreview ? (
              <div className="sticky top-6">
                <PhonePreview
                  username={igUsername}
                  message={state.dm_message}
                  hasLink={hasLink}
                />
              </div>
            ) : (
              <div className="sticky top-6 rounded-[var(--wz-r-card)] border border-dashed border-[var(--wz-border)] bg-white p-5 text-sm text-[var(--wz-text-muted)]">
                {step === 2 && state.media_url ? (
                  <div className="space-y-2">
                    <p className="wz-font-mono text-[11px] uppercase tracking-wide">
                      Selected post
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={state.media_url}
                      alt="Selected post"
                      className="aspect-square w-full rounded-[var(--wz-r-input)] object-cover"
                    />
                  </div>
                ) : (
                  <p>
                    Your live DM preview appears here once you start writing the
                    message.
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Sticky footer */}
      <footer
        className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--wz-border)] bg-[var(--wz-bg)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[var(--wz-r-button)] border border-[var(--wz-border)] bg-white px-4 text-sm font-medium text-[var(--wz-text)] hover:bg-[var(--wz-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wz-accent)] max-sm:flex-1"
            >
              <ChevronLeft className="size-4" /> Back
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}

          <div className="flex-1" />

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={next}
              disabled={!valid}
              aria-disabled={!valid}
              title={!valid ? "Finish this step to continue" : undefined}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[var(--wz-r-button)] bg-[var(--wz-accent)] px-5 text-sm font-medium text-white hover:bg-[var(--wz-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wz-accent)] max-sm:flex-[2]"
            >
              Continue <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={activate}
              disabled={submitting}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--wz-r-button)] bg-[var(--wz-accent)] px-6 text-sm font-medium text-white hover:bg-[var(--wz-accent-hover)] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wz-accent)] max-sm:flex-[2]"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Activating…" : "Activate"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

const STEP_SUBTITLES: Record<StepNum, string> = {
  1: "What should this automation respond to?",
  2: "Pick the post this automation watches — or apply it to all of them.",
  3: "Decide which comments fire the DM.",
  4: "Write the DM your follower receives. The preview updates as you type.",
  5: "Optionally reply under the comment so it looks active to everyone.",
  6: "One last look. Activate when it's ready.",
};
