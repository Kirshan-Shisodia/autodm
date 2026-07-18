// Pricing teaser (spec §6, §8): two cards, Free anchored first, Pro highlighted
// with the one amber "Most popular" badge + focus border. Platinum is
// deliberately demoted to a text link → /pricing. Prices are mono numerals.

import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { pricing, platinumLink } from "./content";
import { Container, SectionHeading, ctaPrimary, ctaSecondary } from "./primitives";
import { Reveal } from "./reveal";

export function PricingTeaser() {
  return (
    <section id="pricing" className="bg-surface-canvas py-20 max-lg:py-16">
      <Container>
        <SectionHeading
          eyebrow="What it costs"
          title="Start free. Upgrade when the DMs pay for it."
          intro="No credit card to start. Every plan is billed monthly in ₹, cancel anytime."
        />

        <Reveal className="mx-auto mt-12 grid max-w-[800px] grid-cols-1 gap-6 md:grid-cols-2">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col rounded-lg border bg-surface-app p-6",
                plan.highlighted
                  ? "border-brand"
                  : "border-border-default",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-ink">
                  {plan.name}
                </h3>
                {plan.badge ? (
                  <span className="rounded-full bg-warning-bg px-3 py-1 text-xs font-medium text-warning-text">
                    {plan.badge}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-geist-mono text-3xl font-semibold text-ink lg:text-[36px]">
                  {plan.price}
                </span>
                <span className="text-sm text-ink-tertiary">{plan.period}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-ink-secondary">
                {plan.limit}
              </p>
              {plan.priceNote ? (
                <p className="font-geist-mono mt-1 text-xs text-ink-tertiary">
                  {plan.priceNote}
                </p>
              ) : null}

              <p className="mt-4 text-sm leading-normal text-ink-secondary">
                {plan.blurb}
              </p>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-ink-secondary"
                  >
                    <Check
                      className="mt-0.5 size-4 flex-none text-brand"
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={cn(
                  "mt-6 w-full",
                  plan.highlighted ? ctaPrimary : ctaSecondary,
                )}
              >
                {plan.cta.label}
              </Link>
            </div>
          ))}
        </Reveal>

        <p className="mt-8 text-center text-sm">
          <Link
            href={platinumLink.href}
            className="font-medium text-brand hover:underline"
          >
            {platinumLink.label}
          </Link>
        </p>
      </Container>
    </section>
  );
}
