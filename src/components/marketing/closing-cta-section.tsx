import { Band, Container } from "@/components/marketing/container";
import { CtaLink } from "@/components/marketing/cta-link";
import { SIGNUP_HREF } from "@/components/marketing/nav";

/**
 * Warm aurora moment right before the footer — recaps the value and repeats the
 * one shared CTA (spec §8 last-chance instance). Aurora is a light wash, so the
 * copy is dark ink and the CTA uses the amber `primary` variant to pop.
 */
export function ClosingCtaSection() {
  return (
    <Band className="aurora-wash">
      <Container wide>
        <div className="flex flex-col items-center py-20 text-center lg:py-24">
          <h2 className="max-w-2xl text-[clamp(28px,4vw,44px)] leading-[1.1] font-extrabold tracking-[-0.4px] text-ink text-balance">
            Turn your next comment into a conversation.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-ink-secondary text-pretty">
            Set up your first automation free in under five minutes.
          </p>
          <div className="mt-8">
            <CtaLink href={SIGNUP_HREF} variant="primary" size="lg">
              Start free
            </CtaLink>
          </div>
        </div>
      </Container>
    </Band>
  );
}
