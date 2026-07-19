import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * AutoDM wordmark, links home (auth spec §6). Matches the landing/footer
 * lockup so the auth surface reads as the same product. Amber focus ring.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-block rounded-sm text-lg font-bold tracking-[-0.16px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand",
        className,
      )}
    >
      AutoDM
    </Link>
  );
}
