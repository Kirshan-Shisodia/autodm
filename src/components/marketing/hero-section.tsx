import { Band, Container } from "@/components/marketing/container";
import { CtaLink } from "@/components/marketing/cta-link";
import { CommentToDmDemo } from "@/components/marketing/comment-to-dm-demo";
import { SIGNUP_HREF } from "@/components/marketing/nav";

export function HeroSection() {
  return (
    <Band id="hero" className="relative overflow-hidden bg-surface-app">
      {/* Static, low-amplitude amber glow behind the demo. Decorative; no drift
          (spec §21 restraint — the demo is the only mover). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 hidden h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,#ffd4a8_0%,transparent_70%)] opacity-40 blur-2xl lg:block"
      />

      <Container wide className="relative">
        <div className="grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          {/* Copy column */}
          <div className="landing-enter">
            <p className="text-xs font-semibold tracking-[0.55px] text-brand uppercase">
              For Instagram creators
            </p>
            <div className="eyebrow-line mt-2 w-16" />

            <h1 className="mt-4 text-[clamp(36px,5vw,64px)] leading-[1.05] font-extrabold tracking-[-0.4px] text-ink text-balance">
              Turn Instagram comments into DMs — automatically.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-secondary text-pretty">
              ChatPilott watches your posts and reels for the keywords you choose,
              then instantly sends the link, guide, or offer to everyone who
              comments. No manual replies. No missed leads.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CtaLink href={SIGNUP_HREF} size="lg">
                Start free
              </CtaLink>
              <CtaLink href="#how" variant="ghost" size="lg">
                See how it works ▸
              </CtaLink>
            </div>

            {/* SocialProofLine intentionally omitted until a real number exists
                (spec §9 — omit rather than fake). */}
          </div>

          {/* Visual column — interactive demo */}
          <div className="lg:pl-6">
            <CommentToDmDemo />
          </div>
        </div>
      </Container>
    </Band>
  );
}
