"use client";

// Step 4 — Compose DM (spec §5, the signature step). Textarea with a mono
// character count, emoji popover, and an "Insert link" action that drops the
// {LINK} placeholder into the message and captures the destination URL.

import { useRef } from "react";
import { Link as LinkIcon } from "lucide-react";

import { EmojiPopover } from "@/components/automations/wizard/emoji-popover";
import {
  DM_MAX,
  LINK_PLACEHOLDER,
  type WizardState,
} from "@/lib/automations/wizard";

export function StepMessage({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  const count = state.dm_message.length;
  const over = count > DM_MAX;

  function insertAtCursor(text: string) {
    const ta = taRef.current;
    if (!ta) {
      set({ dm_message: state.dm_message + text });
      return;
    }
    const start = ta.selectionStart ?? state.dm_message.length;
    const end = ta.selectionEnd ?? state.dm_message.length;
    const next =
      state.dm_message.slice(0, start) + text + state.dm_message.slice(end);
    set({ dm_message: next });
    // restore caret after the inserted text
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function insertLink() {
    if (!state.dm_message.includes(LINK_PLACEHOLDER)) {
      insertAtCursor(` ${LINK_PLACEHOLDER}`);
    }
  }

  const hasPlaceholder = state.dm_message.includes(LINK_PLACEHOLDER);

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-white">
        <textarea
          ref={taRef}
          value={state.dm_message}
          onChange={(e) => set({ dm_message: e.target.value })}
          rows={6}
          placeholder="Hey! Thanks for commenting 🙌 Here's the link I promised:"
          aria-label="Direct message"
          aria-invalid={over}
          className="w-full resize-none rounded-t-[var(--wz-r-card)] bg-transparent p-3 text-sm text-[var(--wz-text)] placeholder:text-[var(--wz-text-muted)] focus:outline-none"
        />
        {/* Toolbar — pinned to the textarea so it stays reachable on mobile. */}
        <div className="flex items-center justify-between gap-2 border-t border-[var(--wz-border)] px-2 py-1.5">
          <div className="flex items-center gap-1">
            <EmojiPopover onPick={(e) => insertAtCursor(e)} />
            <button
              type="button"
              onClick={insertLink}
              disabled={hasPlaceholder}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[var(--wz-r-button)] px-2.5 text-sm font-medium text-[var(--wz-text)] hover:bg-[var(--wz-surface)] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wz-accent)]"
            >
              <LinkIcon className="size-4" /> Insert link
            </button>
          </div>
          <span
            className={`wz-font-mono text-xs ${over ? "text-[var(--wz-accent-pop)]" : "text-[var(--wz-text-muted)]"}`}
          >
            {count.toLocaleString()} / {DM_MAX.toLocaleString()}
          </span>
        </div>
      </div>

      {over && (
        <p className="wz-font-mono text-xs text-[var(--wz-accent-pop)]">
          {count.toLocaleString()} / {DM_MAX.toLocaleString()} — trim{" "}
          {(count - DM_MAX).toLocaleString()} characters.
        </p>
      )}

      {hasPlaceholder && (
        <div className="space-y-1.5">
          <label
            htmlFor="dm_link"
            className="text-sm font-medium text-[var(--wz-text)]"
          >
            Link destination
          </label>
          <input
            id="dm_link"
            type="url"
            inputMode="url"
            value={state.dm_link}
            onChange={(e) => set({ dm_link: e.target.value })}
            placeholder="https://yourstore.com/offer"
            className="w-full rounded-[var(--wz-r-input)] border border-[var(--wz-border)] bg-[var(--wz-surface)] p-2.5 text-sm text-[var(--wz-text)] placeholder:text-[var(--wz-text-muted)] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[var(--wz-accent)]"
          />
          <p className="text-xs text-[var(--wz-text-muted)]">
            We&apos;ll turn this into a short, trackable link in the message.
          </p>
        </div>
      )}
    </div>
  );
}
