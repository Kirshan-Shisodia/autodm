// Landing page (/) — HALO marketing surface. Server Component: metadata,
// section order, and FAQPage JSON-LD render server-side; the client islands
// (nav scroll state, comment→DM demo, FAQ accordion, section reveals) hydrate
// on top. All copy, pricing, links and CTAs work without JS.
//
// Full brief: AutoDM-Landing-Page-Implementation-Spec.md.

import type { Metadata } from "next";

import { faq } from "@/components/landing/content";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { RoiStrip } from "@/components/landing/roi-strip";
import { PricingTeaser } from "@/components/landing/pricing-teaser";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalCtaBand } from "@/components/landing/final-cta-band";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "AutoDM — Turn every Instagram comment into a customer",
  description:
    "Auto-DM anyone who comments your keyword on Instagram — Posts, Reels and Stories. Free forever plan, 1,000 DMs a month, no credit card. Built on Meta's official Graph API.",
  openGraph: {
    title: "AutoDM — Turn every Instagram comment into a customer",
    description:
      "Auto-DM anyone who comments your keyword on Instagram. Free forever plan, 1,000 DMs a month, no credit card.",
    type: "website",
  },
};

// FAQPage JSON-LD (spec §20.6) — the FAQ doubles as an SEO surface.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function LandingPage() {
  return (
    <div className="font-geist min-h-screen bg-surface-app text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-action focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <LandingNav />

      <main id="content">
        <HeroSection />
        {/* Social proof (#proof) and testimonials (#testimonials) are reserved
            bands, held off until real per spec §9 — enabling each is an added
            band, not a reflow. */}
        <FeaturesSection />
        <HowItWorksSection />
        <RoiStrip />
        <PricingTeaser />
        <FaqSection items={faq} />
        <FinalCtaBand />
      </main>

      <LandingFooter />
    </div>
  );
}
