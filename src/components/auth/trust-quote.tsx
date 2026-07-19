"use client";

import * as React from "react";

/**
 * Rotating trust quote for the brand panel (spec §6, §14). Content-driven so
 * marketing can edit without touching auth logic. Lives in an aria-hidden
 * panel (decorative), and rotation is disabled under prefers-reduced-motion —
 * a single static quote is shown instead.
 */
const QUOTES = [
  { quote: "Set it up once. It replies while I sleep.", who: "@maya.codes" },
  { quote: "3,000 DMs sent last launch — zero copy-paste.", who: "@foundry.fit" },
  { quote: "My comments actually convert now.", who: "@studio.lane" },
] as const;

export function TrustQuote() {
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setI((n) => (n + 1) % QUOTES.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  const { quote, who } = QUOTES[i];

  return (
    <figure key={i} className="landing-enter max-w-sm">
      <blockquote className="text-[16px] leading-relaxed text-ink">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="font-geist-mono mt-2 text-[12px] text-ink-tertiary">
        {who}
      </figcaption>
    </figure>
  );
}
