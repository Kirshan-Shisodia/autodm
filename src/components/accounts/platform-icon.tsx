// Platform marks. The one place foreign colour is allowed on this screen —
// Instagram's gradient and Facebook's blue are identifying marks, not styling,
// so they sit outside the HALO palette rules and never leak past this file.
//
// The glyphs are inline SVG rather than lucide imports: lucide-react v1 dropped
// its brand icons, and these are the only two we need.

import { cn } from "@/lib/utils";
import type { Platform } from "@/lib/accounts";

const TILE: Record<Platform, string> = {
  instagram:
    "bg-[linear-gradient(135deg,#f9ce34_0%,#ee2a7b_50%,#6228d7_100%)] text-white",
  facebook: "bg-[#1877f2] text-white",
};

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle
        cx="12"
        cy="12"
        r="4.2"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="17.6" cy="6.4" r="1.25" fill="currentColor" />
    </svg>
  );
}

function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M13.6 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.8V3.63A21 21 0 0 0 14.4 3.5c-2.4 0-4 1.45-4 4.12V9.9H7.7V13h2.7v8z"
      />
    </svg>
  );
}

const GLYPH = { instagram: InstagramGlyph, facebook: FacebookGlyph } as const;

export function PlatformIcon({
  platform,
  size = "md",
  className,
}: {
  platform: Platform;
  size?: "sm" | "md";
  className?: string;
}) {
  const Glyph = GLYPH[platform];
  const md = size === "md";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        md ? "size-9" : "size-6 rounded-md",
        TILE[platform],
        className,
      )}
      aria-hidden
    >
      <Glyph className={md ? "size-[18px]" : "size-3.5"} />
    </span>
  );
}
