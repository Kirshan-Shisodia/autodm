import type { Metadata } from "next";

import { SiteHeader } from "@/components/marketing/site-header";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { ClosingCtaSection } from "@/components/marketing/closing-cta-section";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "ChatPilott — Turn Instagram comments into DMs, automatically",
  description:
    "ChatPilott watches your Instagram posts and reels for the keywords you choose and instantly DMs the link, guide, or offer to everyone who comments.",
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <div className="font-geist flex min-h-full flex-col bg-surface-app text-ink">
      {/* Skip-to-content: first focusable element (spec §13). */}
      <a
        href="#hero"
        className="sr-only rounded-lg bg-action px-4 py-2 text-ink-inverse focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <PricingSection />
        {/* Deferred until real quotes exist — renders nothing today (spec §9). */}
        <TestimonialsSection />
        <FaqSection />
        <ClosingCtaSection />
      </main>

      <SiteFooter />
    </div>
  );
}
