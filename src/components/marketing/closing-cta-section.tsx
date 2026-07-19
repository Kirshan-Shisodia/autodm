import { Band, Container } from "@/components/marketing/container";
import { CtaLink } from "@/components/marketing/cta-link";
import { SIGNUP_HREF } from "@/components/marketing/nav";

/**
 * The single dark moment (surface.inverse) right before the footer — recaps the
 * value and repeats the one shared CTA (spec §8 last-chance instance). Uses the
 * `inverse` CtaLink variant (light chip on dark).
 */
export function ClosingCtaSection() {
  return (
    <Band className="bg-surface-inverse">
      <Container wide>
        <div className="flex flex-col items-center py-20 text-center lg:py-24">
          <h2 className="max-w-2xl text-[clamp(28px,4vw,44px)] leading-[1.1] font-extrabold tracking-[-0.4px] text-ink-inverse text-balance">
            Turn your next comment into a conversation.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-ink-inverse/70 text-pretty">
            Set up your first automation free in under five minutes.
          </p>
          <div className="mt-8">
            <CtaLink href={SIGNUP_HREF} variant="inverse" size="lg">
              Start free
            </CtaLink>
          </div>
        </div>
      </Container>
    </Band>
  );
}
