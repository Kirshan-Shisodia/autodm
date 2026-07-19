"use client";

import * as React from "react";
import { Heart, Send } from "lucide-react";

/**
 * Interactive comment→DM preview (spec §14 signature motion + §20b micro-
 * commitment). The visitor types a keyword and watches the mock DM populate,
 * turning passive reading into a small action. Isolated client island so the
 * rest of the landing page stays server-rendered/static.
 *
 * Motion is handled entirely by the `.landing-enter` CSS class, which already
 * respects prefers-reduced-motion (globals.css §Landing) — re-keying the DM
 * bubble on keyword change replays the entrance, or renders the final frame
 * instantly under reduced motion. No layout shift: the card reserves height.
 */
export function CommentToDmDemo() {
  const [keyword, setKeyword] = React.useState("LINK");

  const kw = (keyword.trim() || "LINK").toUpperCase().slice(0, 12);
  const slug =
    kw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
    "link";

  return (
    <div className="w-full">
      <div className="landing-enter min-h-[360px] rounded-2xl border border-border-default bg-surface-card p-5 sm:p-6">
        {/* Mock post header */}
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#c88a3e] text-sm font-bold text-ink-inverse"
          >
            YB
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold text-ink">yourbrand</p>
            <p className="font-geist-mono text-xs text-ink-tertiary">
              Original post · 2h
            </p>
          </div>
          <Heart aria-hidden className="ml-auto size-5 text-ink-tertiary" />
        </div>

        {/* Caption: the creator's call to action */}
        <p className="mt-4 text-[15px] leading-relaxed text-ink-secondary">
          Comment{" "}
          <mark className="rounded bg-selected-bg px-1.5 py-0.5 font-semibold text-ink">
            {kw}
          </mark>{" "}
          and I&rsquo;ll send the free guide straight to your DMs 🎁
        </p>

        <div className="divider-warm my-5" />

        {/* Incoming comment */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-ink-secondary"
          >
            MK
          </span>
          <div className="rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-2.5">
            <p className="text-[13px] font-semibold text-ink">maya.codes</p>
            <p className="text-[15px] text-ink">
              <span className="font-semibold text-brand">{kw}</span> 🙌
            </p>
          </div>
        </div>

        {/* Auto-reply DM — replays entrance whenever the keyword changes */}
        <div className="mt-4 flex items-start justify-end gap-3">
          <div
            key={kw}
            className="landing-enter max-w-[85%] rounded-2xl rounded-tr-sm bg-action px-4 py-3 text-ink-inverse"
          >
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.55px] text-ink-inverse/70 uppercase">
              <Send className="size-3" /> ChatPilott · sent instantly
            </p>
            <p className="text-[15px] leading-relaxed">
              Hey Maya! Thanks for commenting{" "}
              <span className="font-semibold">{kw}</span> 💛 Here&rsquo;s your
              guide 👉{" "}
              <span className="font-geist-mono underline decoration-white/40 underline-offset-2">
                yourbrand.co/{slug}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* The micro-commitment: let the visitor drive it */}
      <div className="mt-4">
        <label
          htmlFor="demo-keyword"
          className="block text-xs font-semibold tracking-[0.55px] text-ink-tertiary uppercase"
        >
          Try it — type your keyword
        </label>
        <input
          id="demo-keyword"
          type="text"
          value={keyword}
          maxLength={12}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="LINK"
          className="mt-2 w-full rounded-lg border border-border-default bg-surface-canvas px-4 py-3 text-[15px] font-medium tracking-[0.25px] text-ink uppercase transition-colors placeholder:text-ink-muted placeholder:normal-case focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        />
        {/* Announce the generated reply for assistive tech */}
        <p aria-live="polite" className="sr-only">
          When someone comments {kw}, ChatPilott replies with a link to
          yourbrand.co/{slug}.
        </p>
      </div>
    </div>
  );
}
