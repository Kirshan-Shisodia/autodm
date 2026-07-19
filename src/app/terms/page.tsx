import type { Metadata } from "next";

import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Terms of Service — AutoDM",
  description:
    "The terms that govern your use of AutoDM, the comment-to-DM automation service for Instagram.",
  alternates: { canonical: "/terms" },
};

// ⚠️ Not legal advice. Starter template — fill the [bracketed] details and have
// it reviewed before relying on it. Exists so the footer Terms link required by
// Meta App Review resolves to a real page.
const LAST_UPDATED = "June 20, 2026";

const LINK = "text-brand underline underline-offset-2";

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          These Terms of Service (“Terms”) govern your access to and use of
          AutoDM, operated by{" "}
          <strong className="text-ink">[legal/business name]</strong> (“we”,
          “us”). By creating an account or using the service, you agree to these
          Terms.
        </p>
      }
    >
      <LegalSection title="1. The service">
        <p>
          AutoDM lets you automatically reply, via Instagram direct message, to
          people who comment on your own Instagram posts and reels, using
          Meta&rsquo;s official Instagram APIs. You are responsible for the
          content of the messages you configure and for how you use the service.
        </p>
      </LegalSection>

      <LegalSection title="2. Acceptable use">
        <p>You agree not to use AutoDM to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>send unsolicited or bulk messages, spam, or cold DMs;</li>
          <li>
            violate Meta&rsquo;s Platform Terms, the Instagram Community
            Guidelines, or any applicable law;
          </li>
          <li>
            send messages to anyone who has not first engaged with your content;
          </li>
          <li>
            harass, deceive, or harm recipients, or infringe their rights.
          </li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these rules or that
          put our Meta platform access at risk.
        </p>
      </LegalSection>

      <LegalSection title="3. Your Instagram account">
        <p>
          You must own or be authorized to manage any Instagram account you
          connect. You authorize AutoDM to act on your behalf, within the
          permissions you grant through Instagram&rsquo;s official login, to
          read comments and send the messages you configure.
        </p>
      </LegalSection>

      <LegalSection title="4. Plans & billing">
        <p>
          Paid plans are billed in advance on a recurring basis through our
          payment provider. Monthly message limits apply per plan. You can
          cancel at any time; cancellation takes effect at the end of the
          current billing period.
        </p>
      </LegalSection>

      <LegalSection title="5. Disclaimer & liability">
        <p>
          AutoDM is provided “as is.” We do not control Meta&rsquo;s APIs and are
          not responsible for changes, downtime, or message delivery on
          Meta&rsquo;s platforms. To the maximum extent permitted by law, our
          liability is limited to the amount you paid us in the prior three
          months.
        </p>
      </LegalSection>

      <LegalSection title="6. Changes">
        <p>
          We may update these Terms from time to time. Material changes will be
          communicated by email or in the app, and the “Last updated” date above
          will reflect the revision.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a href="mailto:support@autodm.app" className={LINK}>
            support@autodm.app
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
