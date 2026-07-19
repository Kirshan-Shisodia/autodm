import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Band, Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CtaLink } from "@/components/marketing/cta-link";

// ⚠️ Placeholder figures — confirm against PRD §3.6 before launch. Prices/limits
// live here as a single source so a change is one edit.
const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "For getting your first automation live.",
    features: [
      "1 Instagram account",
      "1 active automation",
      "100 DMs / month",
      "Basic analytics",
    ],
    cta: "Start free",
    href: "/signup?plan=free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    tagline: "For creators growing an audience.",
    features: [
      "5 Instagram accounts",
      "Unlimited automations",
      "10,000 DMs / month",
      "Lead capture & export",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Choose Pro",
    href: "/signup?plan=pro",
    featured: true,
  },
];

export function PricingSection() {
  return (
    <Band id="pricing" className="bg-surface-canvas">
      <Container>
        <div className="py-16 lg:py-20">
          <SectionHeading
            eyebrow="Pricing"
            title="Start free. Upgrade when you grow."
            subtitle="No card required to start. Every plan runs on Instagram’s official API."
          />

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-surface-card p-8",
                  plan.featured ? "border-action" : "border-border-default"
                )}
              >
                {plan.featured && (
                  <span className="absolute -top-3 right-8 rounded-full bg-selected-bg px-3 py-1 text-xs font-semibold tracking-[0.55px] text-brand uppercase">
                    Most popular
                  </span>
                )}

                <h3 className="text-xl font-semibold tracking-[-0.16px] text-ink">
                  {plan.name}
                </h3>
                <p className="mt-1 text-[15px] text-ink-secondary">
                  {plan.tagline}
                </p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-geist-mono text-display-sm font-bold text-ink">
                    {plan.price}
                  </span>
                  <span className="text-sm text-ink-tertiary">
                    {plan.period}
                  </span>
                </div>

                <ul className="mt-6 mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-success"
                      />
                      <span className="text-[15px] text-ink-secondary">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <CtaLink
                  href={plan.href}
                  size="lg"
                  variant={plan.featured ? "primary" : "outline"}
                  className="mt-auto w-full"
                >
                  {plan.cta}
                </CtaLink>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Band>
  );
}
