"use client";

// The signature element (spec §0, §14): an Instagram comment that visibly
// becomes a DM on a loop. It's the whole product in three seconds.
//
// Driven by a phase counter (not a fragile CSS timeline) so each beat is
// explicit and easy to tune. Dimensions are reserved (aspect-[4/5], fixed
// max-width) so the animation mounts with zero CLS. Decorative for a11y —
// aria-hidden with an adjacent visually-hidden description — and under
// prefers-reduced-motion it holds the final "delivered" frame, no loop.

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

// 0: comment in · 1: keyword highlighted · 2: DM bubble in · 3: delivered/hold
const PHASE_MS = [400, 900, 700, 2500];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function CommentToDmDemo() {
  const reduced = usePrefersReducedMotion();
  // Start at the final frame — correct for SSR, no-JS, and reduced motion.
  // Motion (if allowed) loops from here. All state updates run inside timers so
  // nothing sets state synchronously during the effect.
  const [phase, setPhase] = useState(3);

  useEffect(() => {
    if (reduced) {
      const reset = setTimeout(() => setPhase(3), 0);
      return () => clearTimeout(reset);
    }
    let current = 3;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      timer = setTimeout(() => {
        current = (current + 1) % 4;
        setPhase(current);
        advance();
      }, PHASE_MS[current]);
    };
    advance();
    return () => clearTimeout(timer);
  }, [reduced]);

  const commentIn = phase >= 0;
  const keywordHot = phase >= 1;
  const dmIn = phase >= 2;
  const delivered = phase >= 3;

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      {/* Phone-frame silhouette — reads "Instagram" without Meta trademarks. */}
      <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border-strong bg-surface-canvas p-4">
        <div aria-hidden className="flex h-full flex-col justify-center gap-4">
          {/* IG comment card */}
          <div
            className={cn(
              "rounded-xl border border-border-default bg-surface-app p-4 transition-all duration-300 ease-out",
              commentIn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="size-7 flex-none rounded-full bg-selected-bg" />
              <span className="text-sm font-semibold text-ink">
                priya_creates
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-secondary">
              Love this! Drop me the{" "}
              <span
                className={cn(
                  "rounded px-1 font-medium transition-colors duration-200",
                  keywordHot
                    ? "bg-selected-bg text-brand"
                    : "bg-transparent text-ink-secondary",
                )}
              >
                LINK
              </span>{" "}
              🙌
            </p>
          </div>

          {/* Arrow beat */}
          <div className="flex justify-center">
            <span
              className={cn(
                "font-geist-mono text-xs text-ink-tertiary transition-opacity duration-200",
                keywordHot ? "opacity-100" : "opacity-0",
              )}
            >
              ↓ auto-DM
            </span>
          </div>

          {/* Outgoing DM bubble */}
          <div
            className={cn(
              "flex flex-col items-end transition-all duration-300 ease-out",
              dmIn ? "scale-100 opacity-100" : "scale-[0.96] opacity-0",
            )}
          >
            <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-action px-4 py-2.5 text-sm text-white">
              Here you go 👉 your free guide is on its way. Thanks for the love!
            </div>
            <span
              className={cn(
                "font-geist-mono mt-1.5 text-[11px] text-ink-tertiary transition-opacity duration-300",
                delivered ? "opacity-100" : "opacity-0",
              )}
            >
              Delivered · just now
            </span>
          </div>
        </div>
      </div>

      {/* Screen-reader description of the decorative animation. */}
      <p className="sr-only">
        Demo: when someone comments the keyword “LINK” on your Instagram post,
        AutoDM automatically sends them a direct message.
      </p>
    </div>
  );
}
