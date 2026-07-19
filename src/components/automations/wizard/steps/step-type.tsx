"use client";

// Step 1 — Type (spec §6). A 2×3 card grid acting as a radiogroup. Free plans
// can select the two enabled types; PRO cards show a badge and open an upgrade
// nudge instead of selecting (spec §6 branch — plan gate).

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Check, Lock, Sparkles } from "lucide-react";

import {
  TYPE_CARDS,
  type AutomationType,
  type Plan,
  type WizardState,
} from "@/lib/automations/wizard";
import { cardContainer, cardItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function StepType({
  state,
  set,
  plan,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
  plan: Plan;
}) {
  const reduce = useReducedMotion();
  const [nudge, setNudge] = useState<string | null>(null);
  const isFree = plan === "free";

  function choose(card: (typeof TYPE_CARDS)[number]) {
    if (card.enabled) {
      setNudge(null);
      set({ type: card.type as AutomationType });
      return;
    }
    // Locked / coming-soon type — surface the upgrade nudge, don't select.
    setNudge((n) => (n === card.type ? null : card.type));
  }

  return (
    <motion.div
      role="radiogroup"
      aria-label="Automation type"
      variants={reduce ? undefined : cardContainer}
      initial={reduce ? undefined : "hidden"}
      animate={reduce ? undefined : "show"}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {TYPE_CARDS.map((card) => {
        const selected = card.enabled && state.type === card.type;
        const locked = !card.enabled;
        return (
          <motion.div
            key={card.type}
            variants={reduce ? undefined : cardItem}
            className="relative"
          >
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(card)}
              className={cn(
                "group relative flex w-full flex-col items-start gap-1 rounded-2xl border p-5 text-left transition-all duration-100 [transition-timing-function:var(--ease-standard)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app",
                "hover:-translate-y-0.5",
                selected
                  ? "border-[1.5px] border-border-focus bg-selected-bg"
                  : "border-border-default bg-surface-card hover:border-border-strong",
                locked && "opacity-95",
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-base font-bold text-ink">
                  {card.title}
                </span>
                {card.pro ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f4fc] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#6647c9]">
                    Pro
                  </span>
                ) : selected ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-action text-white">
                    <Check className="size-3.5" />
                  </span>
                ) : null}
              </div>
              <span className="text-sm text-ink-secondary">
                {card.description}
              </span>
              {locked && (
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted">
                  <Lock className="size-3" /> Coming soon
                </span>
              )}
            </button>

            {/* Upgrade nudge popover (spec §6) */}
            {nudge === card.type && (
              <div
                role="dialog"
                className="absolute left-4 right-4 top-full z-20 mt-2 rounded-xl border border-border-default bg-surface-canvas p-4 shadow-[var(--shadow-floating)]"
              >
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Sparkles className="size-4 text-[#6647c9]" />
                  {isFree ? "Upgrade to unlock" : "Coming soon"}
                </p>
                <p className="mt-1 text-xs text-ink-secondary">
                  {isFree
                    ? "This trigger is part of Pro. Upgrade to turn it on."
                    : "We're finishing this trigger — it'll light up here soon."}
                </p>
                {isFree && (
                  <Link
                    href="/billing?upgrade=pro"
                    className="mt-3 inline-flex items-center rounded-lg bg-action px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-action-hover"
                  >
                    See Pro plans
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
