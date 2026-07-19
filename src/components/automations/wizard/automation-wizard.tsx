"use client";

// Automation Wizard parent (spec §4–§6, rebuilt on Halo v4 tokens). Holds all
// state; steps are controlled children. Renders inside the real AppShell, so it
// owns only the content region: heading, stepper, form + live-preview grid, and
// a per-step footer. State persists to Supabase only on Activate (spec §5/§10).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import {
  STEP_SUBTITLES,
  STEP_TITLES,
  TOTAL_STEPS,
  initialState,
  isStepValid,
  type Plan,
  type StepNum,
  type WizardState,
} from "@/lib/automations/wizard";
import { stepVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/automations/wizard/stepper";
import { PhonePreview } from "@/components/automations/wizard/phone-preview";
import { StepType } from "@/components/automations/wizard/steps/step-type";
import { StepMedia } from "@/components/automations/wizard/steps/step-media";
import { StepTrigger } from "@/components/automations/wizard/steps/step-trigger";
import { StepMessage } from "@/components/automations/wizard/steps/step-message";
import { StepReply } from "@/components/automations/wizard/steps/step-reply";
import { StepReview } from "@/components/automations/wizard/steps/step-review";

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
  const reduce = useReducedMotion();
  const [state, setState] = useState<WizardState>(() =>
    initialState(igAccountId),
  );
  const [maxReached, setMaxReached] = useState<StepNum>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [dir, setDir] = useState(1); // slide direction: +1 forward, -1 back

  const step = state.step;
  const valid = isStepValid(state, step);

  function set(patch: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function goToStep(s: StepNum) {
    setDir(s >= step ? 1 : -1);
    setState((prev) => ({ ...prev, step: s }));
    setMaxReached((m) => (s > m ? s : m));
  }

  function next() {
    if (!valid || step >= TOTAL_STEPS) return;
    goToStep((step + 1) as StepNum);
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
        toast.error(errorMessage(body?.error));
        setSubmitting(false);
        return;
      }
      // Brief success morph before the redirect (spec §7.12).
      setDone(true);
      toast.success("Automation activated.");
      setTimeout(() => router.push(`/automations/${body.id}`), 650);
    } catch {
      toast.error("Something went wrong — try again.");
      setSubmitting(false);
    }
  }

  const isLast = step === TOTAL_STEPS;

  return (
    <div className="mx-auto w-full max-w-[var(--content-max,1440px)]">
      {/* aria-live step announcement (spec §11) */}
      <p className="sr-only" role="status" aria-live="polite">
        Step {step} of {TOTAL_STEPS}, {STEP_TITLES[step]}
      </p>

      {/* Stepper */}
      <div className="mx-auto max-w-3xl pb-8">
        <Stepper step={step} maxReached={maxReached} onJump={goToStep} />
      </div>

      <motion.div
        animate={{ opacity: done ? 0 : 1 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 1, 1] }}
        className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch"
      >
        {/* Form column */}
        <div className="min-w-0">
          <header className="mb-6">
            <h2 className="text-[28px] font-bold leading-tight tracking-[-0.4px] text-ink sm:text-[32px]">
              {STEP_TITLES[step]}
            </h2>
            <p className="mt-2 text-base text-ink-secondary">
              {STEP_SUBTITLES[step]}
            </p>
          </header>

          <div className="relative">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                custom={dir}
                variants={reduce ? undefined : stepVariants}
                initial={reduce ? { opacity: 0 } : "enter"}
                animate={reduce ? { opacity: 1 } : "center"}
                exit={reduce ? { opacity: 0 } : "exit"}
                transition={reduce ? { duration: 0.12 } : undefined}
              >
                {step === 1 && <StepType state={state} set={set} plan={plan} />}
                {step === 2 && <StepMedia state={state} set={set} />}
                {step === 3 && <StepTrigger state={state} set={set} />}
                {step === 4 && <StepMessage state={state} set={set} />}
                {step === 5 && (
                  <StepReply state={state} set={set} plan={plan} />
                )}
                {step === 6 && (
                  <StepReview state={state} goToStep={goToStep} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Per-step footer (spec §4.5) */}
          <div className="mt-10">
            <div className="h-px w-full bg-[linear-gradient(90deg,transparent_0%,#e7e2da_50%,transparent_100%)]" />
            <div className="flex items-center gap-3 pt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={back}
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border-default bg-surface-canvas px-4 text-sm font-medium text-ink transition-colors hover:bg-hover-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app disabled:opacity-50"
                >
                  <ArrowLeft className="size-4" /> Back
                </button>
              )}
              <div className="flex-1" />
              {!isLast ? (
                <motion.button
                  type="button"
                  onClick={next}
                  disabled={!valid}
                  aria-disabled={!valid}
                  whileTap={valid && !reduce ? { scale: 0.98 } : undefined}
                  animate={{ opacity: valid ? 1 : 0.5 }}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-action px-5 text-sm font-semibold text-white transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app disabled:cursor-not-allowed"
                >
                  Continue <ArrowRight className="size-4" />
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={activate}
                  disabled={submitting || done}
                  whileTap={!reduce ? { scale: 0.98 } : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-lg px-6 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app",
                    done ? "bg-[#3eaa83]" : "bg-action hover:bg-action-hover",
                    "disabled:opacity-90",
                  )}
                >
                  {done ? (
                    <>
                      <Check className="size-4" /> Activated
                    </>
                  ) : submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Activating…
                    </>
                  ) : (
                    "Activate"
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Live preview (spec §4). On desktop the aside stretches to the form
            column's height (grid stretch) and the phone fills it absolutely, so
            its bottom lands at the Continue button. On mobile it's a compact
            block stacked on top. */}
        <aside className="order-first lg:relative lg:order-none">
          <div className="lg:absolute lg:inset-0">
            <PhonePreview
              username={igUsername}
              message={state.dm_message}
              hasLink={state.dm_message.includes("{LINK}")}
            />
          </div>
        </aside>
      </motion.div>
    </div>
  );
}

function errorMessage(code: unknown): string {
  switch (code) {
    case "validation_failed":
      return "Some details need fixing — check the highlighted fields.";
    case "account_not_found":
      return "That Instagram account is no longer available.";
    case "account_inactive":
      return "Reconnect your Instagram account to activate.";
    default:
      return "Something went wrong — try again.";
  }
}
