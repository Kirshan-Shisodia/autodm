import Link from "next/link";

// Shared marketing footer (landing + privacy + terms). The Privacy and Terms
// links are required by Meta App Review and must resolve to real pages.
export function MarketingFooter() {
  return (
    <footer className="border-t border-[var(--wz-border)] bg-[var(--wz-bg)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="wz-font-display text-lg font-semibold text-[var(--wz-text)]">
            AutoDM
          </span>
          <p className="text-sm text-[var(--wz-text-muted)]">
            Comment-to-DM automation for Instagram.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
        >
          <Link
            href="/privacy"
            className="text-[var(--wz-text-muted)] transition-colors hover:text-[var(--wz-text)]"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-[var(--wz-text-muted)] transition-colors hover:text-[var(--wz-text)]"
          >
            Terms
          </Link>
          <a
            href="mailto:support@autodm.app"
            className="text-[var(--wz-text-muted)] transition-colors hover:text-[var(--wz-text)]"
          >
            Contact
          </a>
        </nav>
      </div>

      <div className="border-t border-[var(--wz-border)]">
        <p className="mx-auto max-w-6xl px-6 py-4 text-xs text-[var(--wz-text-muted)]">
          © {new Date().getFullYear()} AutoDM. All rights reserved. Not
          affiliated with or endorsed by Meta or Instagram.
        </p>
      </div>
    </footer>
  );
}
