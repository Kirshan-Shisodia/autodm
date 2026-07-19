"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * Full-width primary CTA for auth forms (spec §8, §11). Reads the parent
 * `<form>` pending state via `useFormStatus`, so it works with the server-action
 * forms without extra wiring: on submit it disables, swaps its label, sets
 * `aria-busy`, and shows a spinner (opacity pulse under reduced motion, §11).
 * Prevents double-submit.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-action px-4 text-[14px] font-semibold text-ink-inverse transition-colors",
        "hover:bg-action-hover active:bg-action-pressed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas",
        "disabled:cursor-not-allowed disabled:opacity-80",
        className,
      )}
    >
      {pending && (
        <span
          aria-hidden
          className="size-4 rounded-full border-2 border-ink-inverse/40 border-t-ink-inverse motion-safe:animate-spin motion-reduce:animate-pulse"
        />
      )}
      {pending ? pendingLabel : children}
    </button>
  );
}
