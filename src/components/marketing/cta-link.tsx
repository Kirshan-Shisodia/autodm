import Link from "next/link";

import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline" | "inverse";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Brand amber chip (text.brand) → darker on hover/pressed. Flat, no gradient.
  primary:
    "bg-brand text-ink-inverse hover:bg-brand-hover active:bg-brand-pressed",
  // Low-emphasis secondary; warm hover wash (interaction.hover-bg).
  ghost: "text-ink hover:bg-hover-bg",
  // Bordered secondary — used by the Free plan card CTA.
  outline: "border border-border-strong text-ink hover:bg-hover-bg",
  // For dark bands (closing CTA on surface.inverse): light chip, ink label.
  inverse:
    "bg-surface-canvas text-ink hover:bg-surface-muted focus-visible:ring-offset-surface-inverse",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-[15px]", // ≥44px tap target (spec §12/§13)
  lg: "h-12 px-6 text-base",
};

/**
 * The one shared landing CTA (spec §8/§22). A real <Link>, so it navigates even
 * if JS hydration fails — no dead buttons. Focus ring uses brand amber with a
 * cream offset (spec §13). Works for /signup and same-page anchors alike.
 */
export function CtaLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link
      href={href}
      className={cn(
        "ease-standard inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-100 outline-none select-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
