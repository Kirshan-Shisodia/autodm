import Link from "next/link";

/**
 * Shared HALO/Geist shell for the marketing-adjacent legal pages
 * (/privacy, /terms, /data-deletion). Keeps them visually consistent with the
 * landing page — cream canvas, Geist, ink text, amber links — so footer links
 * don't jump to an off-brand surface. Pure server component; no interactivity.
 */
export function LegalShell({
  title,
  lastUpdated,
  intro,
  children,
}: {
  title: string;
  lastUpdated: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="font-geist min-h-full bg-surface-app text-ink">
      {/* Quiet header — the wordmark links home, content is the point. */}
      <header className="border-b border-border-default bg-surface-canvas">
        <div className="mx-auto flex max-w-[860px] items-center justify-between px-6 py-5">
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
              height={36}
              className="h-8 w-auto"
            />
          </Link>
          <Link
            href="/"
            className="text-sm text-ink-secondary transition-colors hover:text-ink"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main>
        <article className="mx-auto max-w-[720px] px-6 py-16">
          <h1 className="text-4xl font-extrabold tracking-[-0.4px] text-ink">
            {title}
          </h1>
          <p className="font-geist-mono mt-3 text-sm text-ink-tertiary">
            Last updated: {lastUpdated}
          </p>
          <div className="mt-8 text-[15px] leading-relaxed text-ink-secondary">
            {intro}
          </div>
          {children}
        </article>
      </main>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 scroll-mt-24" id={id}>
      <h2 className="text-2xl font-bold tracking-[-0.16px] text-ink">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink-secondary">
        {children}
      </div>
    </section>
  );
}
