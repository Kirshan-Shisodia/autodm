// Hero (spec §4, §7). Aurora wash behind a 55/45 two-column layout: copy left,
// live comment→DM demo right. One h1 on the whole page lives here. The trust
// strip sits directly under the CTA to answer the ban-fear before any scroll.

import Link from "next/link";

import { hero, trustStrip } from "./content";
import { Container, Eyebrow, ctaPrimary, ctaSecondary } from "./primitives";
import { CommentToDmDemo } from "./comment-to-dm-demo";

export function HeroSection() {
  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Static aurora wash — the demo is the only moving object in the hero. */}
      <div
        aria-hidden
        className="aurora-wash pointer-events-none absolute inset-0 -z-10 opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-b from-transparent to-surface-app"
      />

      <Container className="grid items-center gap-12 py-20 max-lg:py-16 lg:grid-cols-[55fr_45fr]">
        <div className="landing-enter">
          <Eyebrow>{hero.eyebrow}</Eyebrow>

          <h1 className="mt-5 text-4xl leading-[1.05] font-semibold tracking-[-0.4px] text-ink md:text-5xl 2xl:text-[56px]">
            {hero.headline}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-secondary">
            {hero.sub}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={hero.primaryCta.href} className={ctaPrimary}>
              {hero.primaryCta.label}
            </Link>
            <a href={hero.secondaryCta.href} className={ctaSecondary}>
              {hero.secondaryCta.label}
            </a>
          </div>

          <p className="mt-4 text-sm font-medium text-ink-tertiary">
            {hero.microcopy}
          </p>

          <TrustStrip />
        </div>

        <div className="landing-enter">
          <CommentToDmDemo />
        </div>
      </Container>
    </section>
  );
}

function TrustStrip() {
  return (
    <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
      {trustStrip.map((item) => {
        const Icon = item.icon;
        return (
          <li
            key={item.label}
            className="flex items-center gap-2 text-sm font-medium text-ink-secondary"
          >
            <Icon className="size-4 text-ink-tertiary" aria-hidden />
            {item.label}
          </li>
        );
      })}
    </ul>
  );
}
