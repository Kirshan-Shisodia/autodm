import * as React from "react";
import { ChevronRight, Hash, Plug, Send } from "lucide-react";

import { Band, Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CtaLink } from "@/components/marketing/cta-link";
import { SIGNUP_HREF } from "@/components/marketing/nav";

const STEPS = [
  {
    icon: Plug,
    title: "Connect Instagram",
    body: "Log in once with Meta’s official, secure API. Takes about 30 seconds.",
  },
  {
    icon: Hash,
    title: "Pick a post & keyword",
    body: "Choose any post or reel and the trigger word your followers should comment.",
  },
  {
    icon: Send,
    title: "AutoDM does the rest",
    body: "Every matching comment gets your DM instantly — the link, guide, or offer you set.",
  },
];

export function HowItWorksSection() {
  return (
    <Band id="how" className="bg-surface-canvas">
      <Container>
        <div className="py-16 lg:py-20">
          <SectionHeading
            eyebrow="How it works"
            title="Live in three steps"
            subtitle="No code, no complicated setup. Connect your account and your first automation is running in minutes."
          />

          <div className="mt-12 flex flex-col gap-8 md:flex-row md:items-start md:gap-4">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.title}>
                {i > 0 && (
                  <ChevronRight
                    aria-hidden
                    className="hidden size-6 shrink-0 self-center text-ink-muted md:block"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-selected-bg text-brand">
                      <step.icon className="size-5" />
                    </span>
                    <span className="font-geist-mono text-sm text-ink-tertiary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.16px] text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-secondary">
                    {step.body}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <CtaLink href={SIGNUP_HREF} size="lg">
              Start free
            </CtaLink>
          </div>
        </div>
      </Container>
    </Band>
  );
}
