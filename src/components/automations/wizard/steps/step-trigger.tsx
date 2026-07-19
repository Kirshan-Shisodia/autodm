"use client";

// Step 3 — Trigger (spec §6). Tab switcher between specific keywords and all
// comments; the active underline is a shared element that slides between tabs
// (§7.5). Keyword chips add on Enter and animate in/out (§7.6).

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import type { TriggerType, WizardState } from "@/lib/automations/wizard";
import { chipVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

const TABS: { id: TriggerType; label: string }[] = [
  { id: "keyword", label: "Specific keywords" },
  { id: "all", label: "All comments" },
];

export function StepTrigger({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addKeyword(raw: string) {
    const kw = raw.trim();
    if (!kw) return;
    const exists = state.trigger_keywords.some(
      (k) => k.toLowerCase() === kw.toLowerCase(),
    );
    if (!exists) {
      set({ trigger_keywords: [...state.trigger_keywords, kw] });
    }
    setDraft("");
  }

  function removeKeyword(kw: string) {
    set({ trigger_keywords: state.trigger_keywords.filter((k) => k !== kw) });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(draft);
    } else if (e.key === "Backspace" && draft === "") {
      const last = state.trigger_keywords[state.trigger_keywords.length - 1];
      if (last) removeKeyword(last);
    }
  }

  const preview =
    state.trigger_keywords.length > 0
      ? state.trigger_keywords.map((k) => k.toUpperCase()).join(", ")
      : "LINK, SEND or YES";

  return (
    <div>
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Trigger type"
        className="mb-6 flex gap-1 border-b border-border-default"
      >
        {TABS.map((tab) => {
          const active = state.trigger_type === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => set({ trigger_type: tab.id })}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                active ? "text-ink" : "text-ink-muted hover:text-ink-secondary",
              )}
            >
              {tab.label}
              {active && (
                <motion.span
                  layoutId={reduce ? undefined : "trigger-tab-underline"}
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-action"
                />
              )}
            </button>
          );
        })}
      </div>

      {state.trigger_type === "keyword" ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-ink">
            Trigger keywords
          </label>
          <div
            onClick={() => inputRef.current?.focus()}
            className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-border-default bg-surface-canvas px-3 py-2 focus-within:border-border-focus focus-within:ring-2 focus-within:ring-brand/30"
          >
            <AnimatePresence initial={false}>
              {state.trigger_keywords.map((kw) => (
                <motion.span
                  key={kw}
                  layout={!reduce}
                  variants={reduce ? undefined : chipVariants}
                  initial={reduce ? undefined : "hidden"}
                  animate={reduce ? undefined : "show"}
                  exit={reduce ? undefined : "exit"}
                  className="inline-flex items-center gap-1 rounded-full bg-selected-bg px-2.5 py-1 text-sm font-medium text-brand"
                >
                  {kw}
                  <button
                    type="button"
                    aria-label={`Remove ${kw}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeKeyword(kw);
                    }}
                    className="rounded-full p-0.5 hover:bg-black/5"
                  >
                    <X className="size-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => addKeyword(draft)}
              placeholder={
                state.trigger_keywords.length === 0
                  ? "Type a word and press Enter"
                  : "Add another…"
              }
              className="min-w-32 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
          </div>
          <p className="mt-3 text-sm text-ink-secondary">
            When someone comments{" "}
            <span className="font-semibold text-ink">{preview}</span> on this
            post, send a DM.
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Matching is case-insensitive and exact-word.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border-default bg-surface-card p-5">
          <p className="text-sm font-medium text-ink">
            Every comment triggers the DM.
          </p>
          <p className="mt-1 text-sm text-ink-secondary">
            Anyone who comments on this post gets your message — no keyword
            needed. Best for broad giveaways and launches.
          </p>
        </div>
      )}
    </div>
  );
}
