"use client";

// Step 4 — Message (spec §6, the signature step). Textarea with an n/1000
// counter, emoji popover, and an "Insert {LINK}" action that drops the
// placeholder in. Typing hard-stops at the limit. When {LINK} is present the
// destination URL field is required (validated on Activate, server-side too).

import { useRef } from "react";
import { Link as LinkIcon } from "lucide-react";

import { EmojiPopover } from "@/components/automations/wizard/emoji-popover";
import {
  DM_MAX,
  LINK_PLACEHOLDER,
  type WizardState,
} from "@/lib/automations/wizard";
import { cn } from "@/lib/utils";

export function StepMessage({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  const count = state.dm_message.length;
  const nearLimit = count > DM_MAX * 0.9;

  function insertAtCursor(text: string) {
    const ta = taRef.current;
    if (!ta) {
      set({ dm_message: (state.dm_message + text).slice(0, DM_MAX) });
      return;
    }
    const start = ta.selectionStart ?? state.dm_message.length;
    const end = ta.selectionEnd ?? state.dm_message.length;
    const next = (
      state.dm_message.slice(0, start) +
      text +
      state.dm_message.slice(end)
    ).slice(0, DM_MAX);
    set({ dm_message: next });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = Math.min(start + text.length, DM_MAX);
      ta.setSelectionRange(pos, pos);
    });
  }

  const hasPlaceholder = state.dm_message.includes(LINK_PLACEHOLDER);
  const linkMissing = hasPlaceholder && state.dm_link.trim() === "";

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border-default bg-surface-canvas focus-within:border-border-focus focus-within:ring-2 focus-within:ring-brand/30">
        <textarea
          ref={taRef}
          value={state.dm_message}
          onChange={(e) => set({ dm_message: e.target.value.slice(0, DM_MAX) })}
          rows={6}
          maxLength={DM_MAX}
          placeholder="Hey! Thanks for commenting 🙌 Here's the link I promised:"
          aria-label="Direct message"
          className="w-full resize-none bg-transparent p-3.5 text-sm leading-relaxed text-ink placeholder:text-ink-muted focus:outline-none"
        />
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 border-t border-border-default px-2 py-1.5">
          <div className="flex items-center gap-1">
            <EmojiPopover onPick={(e) => insertAtCursor(e)} />
            <button
              type="button"
              onClick={() =>
                !hasPlaceholder && insertAtCursor(` ${LINK_PLACEHOLDER}`)
              }
              disabled={hasPlaceholder}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-bg disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <LinkIcon className="size-4" /> Insert {"{LINK}"}
            </button>
          </div>
          <span
            className={cn(
              "font-mono text-xs tabular-nums",
              count >= DM_MAX
                ? "text-danger"
                : nearLimit
                  ? "text-warning-text"
                  : "text-ink-muted",
            )}
          >
            {count.toLocaleString()} / {DM_MAX.toLocaleString()}
          </span>
        </div>
      </div>

      {hasPlaceholder && (
        <div className="space-y-1.5">
          <label htmlFor="dm_link" className="text-sm font-medium text-ink">
            Link destination
          </label>
          <input
            id="dm_link"
            type="url"
            inputMode="url"
            value={state.dm_link}
            onChange={(e) => set({ dm_link: e.target.value })}
            aria-invalid={linkMissing}
            placeholder="https://yourstore.com/offer"
            className={cn(
              "w-full rounded-lg border bg-surface-canvas p-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30",
              linkMissing
                ? "border-danger focus:border-danger"
                : "border-border-default focus:border-border-focus",
            )}
          />
          <p className="text-xs text-ink-muted">
            {linkMissing
              ? "Add a destination — {LINK} needs somewhere to point."
              : "We'll turn this into a short, trackable link in the message."}
          </p>
        </div>
      )}
    </div>
  );
}
