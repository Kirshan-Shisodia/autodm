import Link from "next/link";

/**
 * Legal microcopy under the form (spec §7, §18). Smallest type in the panel;
 * links to the existing /terms and /privacy pages in brand amber.
 */
export function LegalMicrocopy({ verb = "continuing" }: { verb?: string }) {
  return (
    <p className="text-[11px] leading-[16px] text-ink-tertiary">
      By {verb}, you agree to AutoDM&rsquo;s{" "}
      <Link
        href="/terms"
        className="text-brand underline underline-offset-2 hover:text-ink"
      >
        Terms
      </Link>{" "}
      and{" "}
      <Link
        href="/privacy"
        className="text-brand underline underline-offset-2 hover:text-ink"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
