import type { Metadata } from "next";

import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Data Deletion — ChatPilott",
  description:
    "How to delete your ChatPilott account and the Instagram data we hold, including data accessed through Meta's official APIs.",
  alternates: { canonical: "/data-deletion" },
};

// ⚠️ Not legal advice. Exists so the Data Deletion Instructions URL required by
// Meta App Review (PRD §9.2.2) resolves to a real, actionable page. Fill the
// [bracketed] details and review before publishing.
const LAST_UPDATED = "June 20, 2026";

const LINK = "text-brand underline underline-offset-2";

export default function DataDeletionPage() {
  return (
    <LegalShell
      title="Data Deletion"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          You can delete your ChatPilott account and the Instagram data we hold at
          any time. This page explains exactly how, and what happens when you
          do. ChatPilott accesses Instagram data only through Meta&rsquo;s official
          APIs, and honors deletion requests from both ChatPilott and Meta.
        </p>
      }
    >
      <LegalSection id="in-app" title="1. Delete your account in ChatPilott">
        <p>
          Sign in and open{" "}
          <strong className="text-ink">Settings → Delete account</strong>. This
          permanently removes your ChatPilott account, your automations, your stored
          Instagram access tokens, and all associated comment and message logs.
        </p>
      </LegalSection>

      <LegalSection id="disconnect" title="2. Disconnect an Instagram account">
        <p>
          To remove the data tied to a single connected Instagram account
          without deleting your whole ChatPilott account, open{" "}
          <strong className="text-ink">Accounts</strong> and choose{" "}
          <strong className="text-ink">Disconnect</strong>. We delete that
          account&rsquo;s access tokens and stop processing its comments
          immediately, and purge its stored comment and message logs.
        </p>
      </LegalSection>

      <LegalSection id="remove-from-meta" title="3. Remove ChatPilott from Instagram or Facebook">
        <p>
          You can revoke ChatPilott&rsquo;s access directly from Meta:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-ink">Instagram:</strong> Settings →
            Website permissions → Apps and websites → remove{" "}
            <strong className="text-ink">ChatPilott</strong>.
          </li>
          <li>
            <strong className="text-ink">Facebook:</strong> Settings &amp;
            privacy → Settings → Business integrations → remove{" "}
            <strong className="text-ink">ChatPilott</strong>.
          </li>
        </ul>
        <p>
          When you do this, Meta sends us a data-deletion request and we{" "}
          <strong className="text-ink">
            automatically delete the Instagram data associated with your account
          </strong>{" "}
          — access tokens, commenter IDs, media IDs, and message logs.
        </p>
      </LegalSection>

      <LegalSection id="by-email" title="4. Request deletion by email">
        <p>
          Prefer to ask us directly? Email{" "}
          <a href="mailto:privacy@autodm.app" className={LINK}>
            privacy@autodm.app
          </a>{" "}
          with the subject{" "}
          <strong className="text-ink">&ldquo;Delete my data&rdquo;</strong>{" "}
          from the email address on your account. We may ask you to verify
          ownership before we proceed.
        </p>
      </LegalSection>

      <LegalSection id="what-and-when" title="5. What we delete, and when">
        <p>
          On a verified request we delete your personal data and Instagram
          tokens within{" "}
          <strong className="text-ink">30 days</strong>. This includes:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Your Instagram access tokens.</li>
          <li>Comment text and commenter Instagram user IDs.</li>
          <li>Media IDs for the posts and reels you automated.</li>
          <li>The messages ChatPilott sent on your behalf.</li>
          <li>Your account profile and captured leads.</li>
        </ul>
        <p>
          We may retain a minimal record of the deletion request itself, and any
          data we are legally required to keep, for as long as the law requires.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="6. Contact">
        <p>
          Questions about deleting your data? Email{" "}
          <a href="mailto:privacy@autodm.app" className={LINK}>
            privacy@autodm.app
          </a>
          . See our{" "}
          <a href="/privacy" className={LINK}>
            Privacy Policy
          </a>{" "}
          for the full detail on what we collect and how we use it.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
