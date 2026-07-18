// Features (spec §6): 6 flat cards in a 3×2 grid. Depth from 1px borders and a
// surface shift on hover — no lift, no shadow (DLS Rule 2). Icon tile in
// surface.muted, h3, two-line body.

import { features } from "./content";
import { Container, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 max-lg:py-16">
      <Container>
        <SectionHeading
          eyebrow="What it works on"
          title="One automation, everywhere your comments happen."
          intro="Posts, Reels, Stories — plus the inbox, analytics, and lead capture to make sense of what comes back."
        />

        <Reveal className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-lg border border-border-default bg-surface-canvas p-6 transition-colors hover:border-border-strong hover:bg-hover-bg"
              >
                <div className="flex size-10 items-center justify-center rounded-md bg-surface-muted transition-colors group-hover:bg-selected-bg">
                  <Icon className="size-5 text-ink" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-[-0.16px] text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-normal text-ink-secondary">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </Reveal>
      </Container>
    </section>
  );
}
