import { AuthMotif } from "./auth-motif";
import { TrustQuote } from "./trust-quote";

/**
 * Desktop-only atmospheric panel of the split auth surface (spec §4, §6, §13).
 * Purely supportive: a product one-liner, the decorative comment→DM motif, and
 * a rotating trust quote. Hidden below `lg` (the surface's single device line);
 * `aria-hidden` because none of it is essential — the form panel carries the
 * task. Deep inverse surface for contrast against the cream form side.
 */
export function BrandPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden flex-col justify-between overflow-hidden bg-surface-inverse p-12 lg:flex"
    >
      {/* Eyebrow — HALO's signature micro-label */}
      <p className="text-[11px] font-semibold tracking-[0.55px] text-ink-inverse/50 uppercase">
        Comment-to-DM automation
      </p>

      {/* Product line + motif */}
      <div className="space-y-8">
        <h2 className="max-w-md text-[36px] leading-[40px] font-semibold tracking-[-0.4px] text-ink-inverse">
          Turn every comment into a conversation.
        </h2>
        <AuthMotif />
      </div>

      {/* Rotating social proof */}
      <TrustQuote />
    </aside>
  );
}
