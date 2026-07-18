// Shared landing primitives (spec §7 content hierarchy, §16 layout strategy).
// Server-safe — no hooks. Keeps every section on the same 1200px column, the
// same three type tiers (eyebrow / heading / body) and the same CTA styling.

import { cn } from "@/lib/utils";

// The marketing column is intentionally narrower than the app's 1440 shell —
// marketing reads better narrow (spec §4).
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto max-w-[1200px] px-6 lg:px-12", className)}>
      {children}
    </div>
  );
}

// Uppercase micro-label + gradient rule — HALO's signature section opener.
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-sm font-semibold tracking-[0.55px] text-brand uppercase">
        {children}
      </span>
      <span aria-hidden className="eyebrow-line w-16 flex-none" />
    </div>
  );
}

// Section h2 + optional intro. One h1 lives on the page (the hero); every other
// section opens at h2 (spec §13 heading order).
export function SectionHeading({
  eyebrow,
  title,
  intro,
  className,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.4px] text-ink lg:text-3xl">
        {title}
      </h2>
      {intro ? (
        <p className="mt-4 text-base leading-relaxed text-ink-secondary">
          {intro}
        </p>
      ) : null}
    </div>
  );
}

// CTAs navigate, so they are always <a>/<Link>, never onClick divs (spec §13).
// One primary verb everywhere ("Start free"); primary is dark ink, never amber.
const ctaBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

export const ctaPrimary = cn(
  ctaBase,
  "bg-action text-white hover:bg-action-hover active:bg-action-pressed focus-visible:ring-offset-surface-app",
);

export const ctaSecondary = cn(
  ctaBase,
  "border border-border-strong bg-transparent text-ink hover:bg-hover-bg focus-visible:ring-offset-surface-app",
);

// Light button on the single dark band (final CTA).
export const ctaLight = cn(
  ctaBase,
  "bg-white text-ink hover:bg-surface-muted focus-visible:ring-offset-surface-inverse",
);
