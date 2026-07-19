import type { Metadata } from "next";

import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — AutoDM",
  description:
    "How AutoDM collects, uses, and protects your data, including Instagram data accessed through Meta's official APIs.",
  alternates: { canonical: "/privacy" },
};

// ⚠️ Not legal advice. This is a structured starting template (spec Part B).
// Fill every [bracketed] placeholder with your real business details and have
// it reviewed against India's DPDP Act 2023, GDPR, and CCPA before publishing.
const LAST_UPDATED = "June 20, 2026";

const LINK = "text-brand underline underline-offset-2";

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          This Privacy Policy explains what data AutoDM (“we”, “us”, “our”)
          collects when you use our service, how we use it, and the choices you
          have. AutoDM helps creators automatically reply to people who comment
          on their own Instagram posts and reels, using Meta&rsquo;s official
          Instagram APIs.
        </p>
      }
    >
      <LegalSection id="who-we-are" title="1. Who we are">
        <p>
          AutoDM is operated by{" "}
          <strong className="text-ink">[legal/business name]</strong>, based in{" "}
          <strong className="text-ink">[country/jurisdiction]</strong>. You can
          reach us at{" "}
          <a href="mailto:privacy@autodm.app" className={LINK}>
            privacy@autodm.app
          </a>{" "}
          or at <strong className="text-ink">[business address]</strong>.
        </p>
      </LegalSection>

      <LegalSection id="data-we-collect" title="2. What data we collect">
        <p>
          <strong className="text-ink">Instagram data via Meta&rsquo;s APIs.</strong>{" "}
          When you connect an Instagram account, we access and store:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Your Instagram <strong className="text-ink">access tokens</strong>,
            stored encrypted at rest.
          </li>
          <li>
            The <strong className="text-ink">comment text</strong> on your posts
            and reels, and the{" "}
            <strong className="text-ink">commenter Instagram user IDs</strong>{" "}
            needed to reply.
          </li>
          <li>
            <strong className="text-ink">Media IDs</strong> for the posts and
            reels you choose to automate.
          </li>
          <li>
            The{" "}
            <strong className="text-ink">
              messages AutoDM sends on your behalf
            </strong>
            .
          </li>
        </ul>
        <p>
          <strong className="text-ink">Account data.</strong> Your email, name,
          and plan.
        </p>
        <p>
          <strong className="text-ink">Captured leads.</strong> Email addresses
          you collect from followers through DM conversations you configure.
        </p>
        <p>
          <strong className="text-ink">Usage data.</strong> Link-click events,
          recorded with{" "}
          <strong className="text-ink">hashed IP addresses</strong> (we do not
          store raw IPs).
        </p>
      </LegalSection>

      <LegalSection id="how-we-use-it" title="3. How we use your data">
        <p>
          We use your data solely to operate the automations you set up: to read
          the comments on your posts, match the keywords you choose, and send
          the direct messages you configure. We also use account data to run
          your subscription and provide support.
        </p>
        <p>
          <strong className="text-ink">We do not sell your personal data</strong>{" "}
          and we do not use your Instagram data for advertising.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="4. Third parties & sub-processors">
        <p>
          We share data only with the service providers required to run AutoDM:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-ink">Meta</strong> (Instagram / Graph API) —{" "}
            <a
              href="https://privacycenter.instagram.com/policy"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK}
            >
              policy
            </a>
          </li>
          <li>
            <strong className="text-ink">Supabase</strong> (database &
            authentication) —{" "}
            <a
              href="https://supabase.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK}
            >
              policy
            </a>
          </li>
          <li>
            <strong className="text-ink">Vercel</strong> (hosting) —{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className={LINK}
            >
              policy
            </a>
          </li>
          <li>
            <strong className="text-ink">
              [payment provider: Razorpay / Cashfree]
            </strong>{" "}
            (billing)
          </li>
          <li>
            <strong className="text-ink">[email provider]</strong>{" "}
            (transactional email)
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="retention" title="5. Data retention">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            DM and activity logs are kept for{" "}
            <strong className="text-ink">90 days</strong>.
          </li>
          <li>Captured leads are kept until you request their deletion.</li>
          <li>
            Instagram access tokens are kept until you disconnect the account or
            delete your AutoDM account.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="data-deletion" title="6. Data deletion">
        <p>
          You can delete your data at any time. Use the in-app{" "}
          <strong className="text-ink">“Delete Account”</strong> flow, or email{" "}
          <a href="mailto:privacy@autodm.app" className={LINK}>
            privacy@autodm.app
          </a>{" "}
          with the subject “Delete my data”. We will delete your personal data
          and Instagram tokens within{" "}
          <strong className="text-ink">30 days</strong> of a verified request.
        </p>
        <p>
          <strong className="text-ink">Instagram / Meta data deletion.</strong>{" "}
          If you remove AutoDM from your Instagram or Facebook account, Meta
          notifies us and we honor that data-deletion request automatically. For
          step-by-step instructions, see our{" "}
          <a href="/data-deletion" className={LINK}>
            Data Deletion page
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="7. Your rights">
        <p>
          Depending on where you live, you have the right to access, correct,
          delete, and export your personal data, and to object to or restrict
          certain processing. To exercise any of these rights, email{" "}
          <a href="mailto:privacy@autodm.app" className={LINK}>
            privacy@autodm.app
          </a>
          . We respond to verified requests within the timeframe required by
          applicable law (including India&rsquo;s DPDP Act 2023, the GDPR, and
          the CCPA where they apply).
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="8. Cookies">
        <p>
          We use strictly necessary cookies to keep you signed in and to
          maintain your session. If we use analytics cookies, they are used only
          to understand aggregate product usage and never to track you across
          other sites.
        </p>
      </LegalSection>

      <LegalSection id="children" title="9. Children">
        <p>
          AutoDM is not directed to anyone under{" "}
          <strong className="text-ink">
            [13 / 16 / 18 — per your jurisdiction]
          </strong>
          , and we do not knowingly collect their data. If you believe a minor
          has provided us data, contact us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="10. Changes to this policy">
        <p>
          We may update this policy from time to time. When we do, we will
          revise the “Last updated” date above and, for material changes, notify
          you by email or in the app.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact">
        <p>
          Questions about this policy or your data? Email{" "}
          <a href="mailto:privacy@autodm.app" className={LINK}>
            privacy@autodm.app
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
