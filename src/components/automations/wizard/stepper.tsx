"use client";

// Wizard stepper (spec §4.4 + motion §7.2). Six nodes with connectors; the
// segment behind completed steps fills left→right and the newly active node
// pops. Nodes for reached steps are clickable to jump back/forward.

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

import { STEPS, type StepNum } from "@/lib/automations/wizard";
import { DUR, EASE, nodePop } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Stepper({
  step,
  maxReached,
  onJump,
}: {
  step: StepNum;
  maxReached: StepNum;
  onJump: (s: StepNum) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-start">
        {STEPS.map((s, i) => {
          const done = s.n < step;
          const current = s.n === step;
          const clickable = s.n <= maxReached && s.n !== step;
          const connectorFilled = s.n < step; // segment before this node

          return (
            <li
              key={s.n}
              className={cn(
                "flex items-start",
                i === 0 ? "flex-none" : "flex-1",
              )}
            >
              {/* Connector to the previous node */}
              {i > 0 && (
                <div className="relative mt-[13px] h-[1.5px] flex-1 bg-border-default">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-action"
                    initial={false}
                    animate={{ width: connectorFilled ? "100%" : "0%" }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { duration: DUR.slow, ease: EASE.standard }
                    }
                  />
                </div>
              )}

              <div className="flex flex-col items-center gap-2 px-1">
                <motion.button
                  type="button"
                  disabled={!clickable}
                  aria-current={current ? "step" : undefined}
                  aria-label={`Step ${s.n}: ${s.label}${
                    done ? " (completed)" : current ? " (current)" : ""
                  }`}
                  onClick={() => clickable && onJump(s.n)}
                  animate={
                    current && !reduce ? { scale: [1, 1.08, 1] } : { scale: 1 }
                  }
                  transition={nodePop}
                  className={cn(
                    "flex size-[26px] items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app",
                    clickable ? "cursor-pointer" : "cursor-default",
                    done
                      ? "bg-[#3eaa83] text-white" // --action-success
                      : current
                        ? "bg-action text-white"
                        : "bg-surface-muted text-ink-muted",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : s.n}
                </motion.button>
                <span
                  className={cn(
                    "hidden text-center text-xs sm:block",
                    current
                      ? "font-semibold text-ink"
                      : done
                        ? "font-medium text-ink-secondary"
                        : "text-ink-muted",
                  )}
                >
                  {s.label}
                  {s.pro && (
                    <span className="ml-1 align-middle text-[9px] font-bold uppercase tracking-wide text-[#6647c9]">
                      Pro
                    </span>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
