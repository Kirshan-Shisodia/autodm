// How it works (spec §6): 3 numbered steps, horizontal on desktop with a
// connecting hairline, vertical on mobile. Mono step numbers. Step 2 shows the
// keyword chip so the "set a word" idea is concrete.

import { steps } from "./content";
import { Container, SectionHeading } from "./primitives";
import { Reveal } from "./reveal";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-surface-canvas py-20 max-lg:py-16">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Live in under five minutes."
          intro="No code, no complicated funnels. Three steps and your comments start converting themselves."
        />

        <Reveal className="relative mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Connecting hairline behind the numbers (desktop only). */}
          <div
            aria-hidden
            className="divider-warm absolute top-3 right-0 left-0 hidden md:block"
          />
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <span className="font-geist-mono text-xl font-medium text-brand">
                {step.number}
              </span>
              <h3 className="mt-4 text-base font-semibold tracking-[-0.16px] text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-normal text-ink-secondary">
                {step.body}
              </p>
              {step.number === "02" ? (
                <span className="font-geist-mono mt-3 inline-flex rounded-full bg-selected-bg px-3 py-1 text-xs font-medium text-brand">
                  LINK
                </span>
              ) : null}
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
