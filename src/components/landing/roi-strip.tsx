// ROI strip (spec §6): three big mono numerals + tertiary captions. The math
// that makes the free plan an obvious yes — reply time you get back, hours
// saved, minutes to set up.

import { roiStats } from "./content";
import { Container, Eyebrow } from "./primitives";
import { Reveal } from "./reveal";

export function RoiStrip() {
  return (
    <section id="roi" className="py-20 max-lg:py-16">
      <Container>
        <Eyebrow>What it&apos;s worth</Eyebrow>
        <p className="mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.4px] text-ink lg:text-3xl">
          1,000 comments · 30 seconds each to answer by hand = 8+ hours a month
          you get back.
        </p>

        <Reveal className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {roiStats.map((stat) => (
            <div key={stat.value}>
              <div className="font-geist-mono text-3xl font-semibold text-ink lg:text-[36px]">
                {stat.value}
              </div>
              <p className="mt-2 text-sm text-ink-tertiary">{stat.caption}</p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
