// Footer (spec §6, §10). The legal links (Privacy · Terms · Data Deletion) block
// Meta App Review if missing, so they ship here regardless of page state. The
// "Not affiliated with Meta" disclaimer keeps us clear of trademark implication.

import Link from "next/link";

import { footerColumns } from "./content";
import { Container } from "./primitives";

export function LandingFooter() {
  return (
    <footer className="border-t border-border-default bg-surface-app pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.heading}>
              <h3 className="text-sm font-semibold text-ink">
                {column.heading}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-tertiary transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider-warm mt-12" />

        <div className="mt-8 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <span className="text-lg font-semibold tracking-[-0.4px] text-ink">
            AutoDM<span className="text-brand">.</span>
          </span>
          <p className="text-sm text-ink-muted">
            Not affiliated with, endorsed by, or sponsored by Meta or Instagram.
          </p>
        </div>
      </Container>
    </footer>
  );
}
