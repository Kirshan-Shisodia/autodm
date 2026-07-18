// Final CTA band (spec §6, §8): the page's single dark moment on surface.inverse
// — one line, one light button, a full stop before the footer.

import Link from "next/link";

import { Container, ctaLight } from "./primitives";

export function FinalCtaBand() {
  return (
    <section id="cta" className="bg-surface-inverse py-20 max-lg:py-16">
      <Container className="flex flex-col items-center gap-8 text-center">
        <h2 className="max-w-2xl text-2xl font-semibold tracking-[-0.4px] text-white lg:text-3xl">
          Your next customer is already commenting. Start replying automatically.
        </h2>
        <Link href="/signup" className={ctaLight}>
          Start free — 1,000 DMs on us
        </Link>
      </Container>
    </section>
  );
}
