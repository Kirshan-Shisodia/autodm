"use client";

// Draft state for a settings section.
//
// Each panel is a form over a plain object: the server gives the saved values,
// the user edits a local copy, and "Save Changes" posts the whole object. This
// hook owns that pattern so the panels contain no state plumbing.
//
// Two details worth calling out:
//   - `dirty` is a deep-ish compare against the last saved snapshot, not a
//     "something was touched" flag, so toggling a switch back off correctly
//     disables the save button again.
//   - After a successful save the snapshot is rebased to the submitted draft.
//     revalidatePath re-renders the server component with the same values, so
//     rebasing avoids a flash of "unsaved changes" while that round-trips.

import * as React from "react";
import { toast } from "sonner";

type SaveResult = { ok: true } | { ok: false; error: string };

const MESSAGES: Record<string, string> = {
  unauthorized: "Your session expired. Sign in again.",
  invalid_input: "Some values look wrong — check the highlighted fields.",
  save_failed: "Couldn't save those settings. Try again.",
  invalid_template: "That template no longer exists.",
  seat_limit_reached: "You've used every seat on your plan.",
  key_limit_reached: "You've reached the API key limit for your plan.",
  webhook_limit_reached: "You've reached the webhook limit for your plan.",
  already_invited: "That person has already been invited.",
  https_required: "Webhook endpoints must use HTTPS.",
  confirmation_mismatch: "That didn't match. Nothing was changed.",
};

export function errorMessage(code: string): string {
  return MESSAGES[code] ?? "Something went wrong — try again.";
}

export function useSectionForm<T extends object>(
  saved: T,
  save: (value: T) => Promise<SaveResult>,
  successMessage = "Settings saved.",
) {
  const [draft, setDraft] = React.useState<T>(saved);
  const [baseline, setBaseline] = React.useState<T>(saved);
  const [pending, startTransition] = React.useTransition();

  // The server can change underneath us — another tab, or a "Reset to
  // recommended" from the rail. Adopt the new values whenever they differ from
  // what we last saw.
  //
  // Adjusted during render rather than in an effect: React re-runs this
  // component immediately with the new state and never commits the stale UI,
  // whereas an effect would paint the old values first and then flash.
  // The comparison is on the serialised form because the server object is a
  // fresh reference on every render.
  const savedKey = JSON.stringify(saved);
  const [lastSavedKey, setLastSavedKey] = React.useState(savedKey);

  if (savedKey !== lastSavedKey) {
    setLastSavedKey(savedKey);
    setDraft(saved);
    setBaseline(saved);
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  /** Patch one or more fields of the draft. */
  const set = React.useCallback(<K extends keyof T>(patch: Pick<T, K> | Partial<T>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  /** Curried single-field setter, for `onChange={field("dark_mode")}`. */
  const field = React.useCallback(
    <K extends keyof T>(key: K) =>
      (value: T[K]) =>
        setDraft((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const submit = React.useCallback(() => {
    const snapshot = draft;
    startTransition(async () => {
      const result = await save(snapshot);
      if (!result.ok) {
        toast.error(errorMessage(result.error));
        return;
      }
      setBaseline(snapshot);
      toast.success(successMessage);
    });
  }, [draft, save, successMessage]);

  const reset = React.useCallback(() => setDraft(baseline), [baseline]);

  return { draft, set, field, dirty, pending, submit, reset };
}

/** Fire-and-forget action with toast feedback — for row-level buttons. */
export function useAction() {
  const [pending, startTransition] = React.useTransition();

  const run = React.useCallback(
    (
      action: () => Promise<SaveResult>,
      { success, onSuccess }: { success?: string; onSuccess?: () => void } = {},
    ) => {
      startTransition(async () => {
        const result = await action();
        if (!result.ok) {
          toast.error(errorMessage(result.error));
          return;
        }
        if (success) toast.success(success);
        onSuccess?.();
      });
    },
    [],
  );

  return { pending, run };
}
