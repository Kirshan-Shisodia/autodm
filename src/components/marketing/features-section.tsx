import {
  BarChart3,
  Clapperboard,
  Hash,
  ShieldCheck,
  UserPlus,
  Zap,
} from "lucide-react";

import { Band, Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";

const FEATURES = [
  {
    icon: Hash,
    title: "Keyword triggers",
    body: "Fire a DM on any word or phrase your followers comment.",
  },
  {
    icon: Zap,
    title: "Instant delivery",
    body: "Replies go out within seconds, while attention is highest.",
  },
  {
    icon: Clapperboard,
    title: "Posts & reels",
    body: "Automate the comments on any post or reel you publish.",
  },
  {
    icon: UserPlus,
    title: "Lead capture",
    body: "Collect email addresses right inside the DM conversation.",
  },
  {
    icon: BarChart3,
    title: "Clear analytics",
    body: "See comments matched, DMs sent, and link clicks at a glance.",
  },
  {
    icon: ShieldCheck,
    title: "Meta-compliant",
    body: "Built entirely on Instagram’s official Graph API.",
  },
];

export function FeaturesSection() {
  return (
    <Band id="features" className="bg-surface-app">
      <Container>
        <div className="py-16 lg:py-20">
          <SectionHeading
            eyebrow="Features"
            title="Everything you need to turn comments into customers"
          />

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border-default bg-surface-card p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-hover-bg text-brand">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.16px] text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Band>
  );
}
