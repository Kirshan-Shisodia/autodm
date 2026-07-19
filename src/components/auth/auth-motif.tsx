import { Send } from "lucide-react";

/**
 * Decorative comment→DM motif for the brand panel (spec §6, §21) — product
 * continuity with the landing hero, styled to match the landing demo (white
 * card, muted incoming comment, dark auto-reply bubble) so it reads cleanly on
 * the light aurora wash.
 *
 * Deliberately NOT the interactive landing demo: this lives inside an
 * `aria-hidden` panel, so it has no inputs, no tab stops, no user affordances.
 * The only motion is a slow CSS "breathe" on the reply bubble, gated behind
 * prefers-reduced-motion in globals.css (renders a static frame otherwise).
 */
export function AuthMotif() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border-default bg-surface-card p-5">
      {/* Incoming comment */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-semibold text-ink-secondary">
          MK
        </span>
        <div className="rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-2.5">
          <p className="text-[13px] font-semibold text-ink">maya.codes</p>
          <p className="text-[15px] text-ink">
            <span className="font-semibold text-brand">LINK</span> 🙌
          </p>
        </div>
      </div>

      {/* Auto-reply DM — the slow breathing frame */}
      <div className="auth-motif-dm mt-4 flex items-start justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-action px-4 py-3 text-ink-inverse">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.55px] text-ink-inverse/70 uppercase">
            <Send className="size-3" /> ChatPilott · sent instantly
          </p>
          <p className="text-[15px] leading-relaxed">
            Hey Maya! Here&rsquo;s your guide 👉{" "}
            <span className="font-geist-mono underline decoration-white/40 underline-offset-2">
              yourbrand.co/link
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
