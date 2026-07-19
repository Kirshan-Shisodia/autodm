import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * ChatPilott logo, links home (auth spec §6). Matches the landing/footer
 * lockup so the auth surface reads as the same product. Amber focus ring.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ChatPilott home"
      className={cn(
        "inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/chatpilott-logo.svg"
        alt="ChatPilott"
        width={120}
        height={28}
        className="h-7 w-auto"
      />
    </Link>
  );
}
