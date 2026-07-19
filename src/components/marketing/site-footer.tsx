import Link from "next/link";

type FooterLink = { label: string; href: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Contact", href: "mailto:support@autodm.app" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Data Deletion", href: "/data-deletion" },
    ],
  },
];

const linkClass =
  "text-sm text-ink-secondary transition-colors hover:text-ink";

function FooterAnchor({ label, href }: FooterLink) {
  // mailto/tel are plain anchors; everything internal/anchor uses next/link.
  if (href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a href={href} className={linkClass}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={linkClass}>
      {label}
    </Link>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-chrome-border bg-surface-canvas">
      <div className="mx-auto w-[min(96vw,1600px)] px-[clamp(24px,6vw,96px)]">
        <div className="py-14">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Brand block */}
            <div className="col-span-2 md:col-span-1">
              <Link
                href="/"
                aria-label="ChatPilott home"
                className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/chatpilott-logo.svg"
                  alt="ChatPilott"
                  width={154}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-secondary">
                Comment-to-DM automation for Instagram creators.
              </p>
            </div>

            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-semibold tracking-[0.55px] text-ink-tertiary uppercase">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <FooterAnchor {...link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Trust line (spec §20e) + copyright */}
          <div className="mt-12 flex flex-col gap-4 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-relaxed text-ink-tertiary">
              ChatPilott uses Instagram’s official Graph API and complies with
              Meta’s Platform Terms. Not affiliated with or endorsed by Meta or
              Instagram.
            </p>
            <p className="font-geist-mono shrink-0 text-xs text-ink-tertiary">
              © {year} ChatPilott
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
