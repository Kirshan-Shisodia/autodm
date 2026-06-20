import type { Metadata } from "next";
import Link from "next/link";
import {
  AtSign,
  Hash,
  Send,
  MousePointerClick,
  Film,
  LayoutDashboard,
  Check,
  ArrowRight,
} from "lucide-react";

import { LandingNav } from "@/components/marketing/landing-nav";
import { Faq } from "@/components/marketing/faq";
import { MarketingFooter } from "@/components/marketing/footer";
import { PhonePreview } from "@/components/automations/wizard/phone-preview";

export const metadata: Metadata = {
  title: "AutoDM — Turn comments into DMs, automatically",
  description:
    "AutoDM auto-replies to the people who comment on your Instagram posts and reels — sending the link they asked for over a real DM. Built on Meta's official Instagram API.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "AutoDM — Turn comments into DMs, automatically",
    description:
      "Comment-to-DM automation for Instagram. Reply to your audience and send the link they asked for, automatically.",
    url: "/",
    siteName: "AutoDM",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoDM — Turn comments into DMs, automatically",
    description:
      "Comment-to-DM automation for Instagram. Reply to your audience and send the link they asked for, automatically.",
  },
};

const STEPS = [
  {
    icon: AtSign,
    title: "Connect Instagram",
    body: "Link your Instagram Business or Creator account once, through Instagram's official login.",
  },
  {
    icon: Hash,
    title: "Pick a post & keyword",
    body: "Choose any post or reel and the keyword that should trigger a reply — like “link” or “guide”.",
  },
  {
    icon: Send,
    title: "We auto-DM commenters",
    body: "When someone comments your keyword, AutoDM sends them the message and link you set up.",
  },
];

const FEATURES = [
  {
    icon: Hash,
    title: "Keyword triggers",
    body: "Reply only when a comment matches the keywords you choose. No keyword, no DM.",
  },
  {
    icon: MousePointerClick,
    title: "Link tracking",
    body: "Send the link your audience asked for and see every click, so you know what resonates.",
  },
  {
    icon: Film,
    title: "Posts & reels",
    body: "Run automations on any post or reel — wherever your audience is commenting.",
  },
  {
    icon: LayoutDashboard,
    title: "Live dashboard",
    body: "Watch DMs go out in real time and track sends, clicks, and leads in one place.",
  },
];

const TIERS = [
  {
    name: "Free",
    price: "₹0",
    cadence: "/mo",
    dms: "1,000",
    highlight: false,
    features: ["1 automation", "Keyword triggers", "Link tracking"],
  },
  {
    name: "Pro",
    price: "₹999",
    cadence: "/mo",
    dms: "25,000",
    highlight: true,
    features: [
      "Unlimited automations",
      "Comment auto-replies",
      "Click analytics",
      "Lead capture",
    ],
  },
  {
    name: "Platinum",
    price: "₹4,999",
    cadence: "/mo",
    dms: "300,000",
    highlight: false,
    features: [
      "Everything in Pro",
      "Multiple accounts",
      "Priority support",
    ],
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ====================================================== HERO (dark A24) */}
      <div className="bg-[var(--wz-bg-dark)]">
        <LandingNav />

        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-10 lg:grid-cols-2 lg:gap-8 lg:pb-32 lg:pt-16">
          <div className="wz-animate-plate">
            <p className="wz-font-mono text-xs uppercase tracking-[0.2em] text-[var(--wz-accent-warm)]">
              Instagram DM Automation
            </p>
            <h1 className="wz-font-display mt-5 text-[44px] font-semibold leading-[1.05] tracking-tight text-[var(--wz-text-dark)] sm:text-6xl lg:text-[clamp(64px,7vw,96px)]">
              Turn comments into DMs, automatically.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[var(--wz-text-dark-muted)]">
              When someone comments on your post, AutoDM replies with the link
              they asked for — a real Instagram message, sent the moment they
              engage.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-[var(--wz-r-button)] bg-[var(--wz-accent)] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[var(--wz-accent-hover)]"
              >
                Get started
                <ArrowRight className="size-4" />
              </Link>
              {/* The one red accent per the hero viewport (spec A2). */}
              <span className="inline-flex items-center rounded-full border border-[var(--wz-accent-pop)] px-3 py-1 text-sm font-medium text-[var(--wz-accent-pop)]">
                Free to start
              </span>
            </div>
          </div>

          {/* Signature element: the live IG-DM phone mockup from the wizard. */}
          <div className="wz-animate-plate flex justify-center lg:justify-end">
            <PhonePreview
              username="yourbrand"
              message={
                "Hey! Thanks for commenting 🙌 Here's the link you asked for: {LINK}"
              }
              hasLink
            />
          </div>
        </section>
      </div>

      <main className="bg-[var(--wz-bg)] text-[var(--wz-text)]">
        {/* ============================================== HOW IT WORKS (light) */}
        <section
          id="how-it-works"
          className="border-b border-[var(--wz-border)] bg-[var(--wz-bg-alt)]"
        >
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <div className="max-w-2xl">
              <p className="wz-font-mono text-xs uppercase tracking-[0.18em] text-[var(--wz-text-muted)]">
                How it works
              </p>
              <h2 className="wz-font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Set it up once. It runs on its own.
              </h2>
            </div>

            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-[var(--wz-r-button)] border border-[var(--wz-border)] bg-[var(--wz-bg)]">
                      <s.icon className="size-5 text-[var(--wz-accent)]" />
                    </span>
                    <span className="wz-font-mono text-sm text-[var(--wz-text-muted)]">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--wz-text-muted)]">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ==================================================== FEATURES (light) */}
        <section id="features" className="border-b border-[var(--wz-border)]">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <div className="max-w-2xl">
              <p className="wz-font-mono text-xs uppercase tracking-[0.18em] text-[var(--wz-text-muted)]">
                Features
              </p>
              <h2 className="wz-font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything you need to reply to your audience.
              </h2>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-[var(--wz-border)] sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col gap-4 bg-[var(--wz-bg)] p-6"
                >
                  <span className="flex size-10 items-center justify-center rounded-[var(--wz-r-button)] border border-[var(--wz-border)] bg-[var(--wz-bg-alt)]">
                    <f.icon className="size-5 text-[var(--wz-accent)]" />
                  </span>
                  <h3 className="text-base font-medium">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--wz-text-muted)]">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================== PRICING (light) */}
        <section
          id="pricing"
          className="border-b border-[var(--wz-border)] bg-[var(--wz-bg-alt)]"
        >
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <div className="max-w-2xl">
              <p className="wz-font-mono text-xs uppercase tracking-[0.18em] text-[var(--wz-text-muted)]">
                Pricing
              </p>
              <h2 className="wz-font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Start free. Scale when you grow.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {TIERS.map((t) => (
                <div
                  key={t.name}
                  className={`flex flex-col rounded-[var(--wz-r-card)] border bg-[var(--wz-bg)] p-6 ${
                    t.highlight
                      ? "border-[var(--wz-accent)] shadow-[0_0_0_1px_var(--wz-accent)]"
                      : "border-[var(--wz-border)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{t.name}</h3>
                    {t.highlight && (
                      <span className="rounded-full bg-[var(--wz-accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--wz-accent)]">
                        Most popular
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="wz-font-mono text-3xl font-semibold">
                      {t.price}
                    </span>
                    <span className="text-sm text-[var(--wz-text-muted)]">
                      {t.cadence}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[var(--wz-text-muted)]">
                    <span className="wz-font-mono text-[var(--wz-text)]">
                      {t.dms}
                    </span>{" "}
                    DMs / month
                  </p>

                  <ul className="mt-6 flex flex-1 flex-col gap-3">
                    {t.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2.5 text-sm text-[var(--wz-text-muted)]"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-[var(--wz-accent)]" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={`mt-8 inline-flex items-center justify-center rounded-[var(--wz-r-button)] px-4 py-2.5 text-sm font-medium transition-colors ${
                      t.highlight
                        ? "bg-[var(--wz-accent)] text-white hover:bg-[var(--wz-accent-hover)]"
                        : "border border-[var(--wz-border)] text-[var(--wz-text)] hover:bg-[var(--wz-bg-alt)]"
                    }`}
                  >
                    Get started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= FAQ (light) */}
        <section className="border-b border-[var(--wz-border)]">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="wz-font-mono text-xs uppercase tracking-[0.18em] text-[var(--wz-text-muted)]">
                FAQ
              </p>
              <h2 className="wz-font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Questions, answered honestly.
              </h2>
            </div>
            <Faq />
          </div>
        </section>

        {/* ================================================== FINAL CTA (light) */}
        <section className="bg-[var(--wz-bg)]">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center sm:py-24">
            <h2 className="wz-font-display mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Reply to every commenter, without lifting a finger.
            </h2>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-[var(--wz-r-button)] bg-[var(--wz-accent)] px-6 py-3 text-base font-medium text-white transition-colors hover:bg-[var(--wz-accent-hover)]"
            >
              Get started free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </>
  );
}
