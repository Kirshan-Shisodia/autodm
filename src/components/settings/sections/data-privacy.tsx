"use client";

// Settings › Data & Privacy — visibility, retention, export and the GDPR exits.
//
// The export runs as a server action and hands back a JSON string the browser
// turns into a download. Doing it that way (rather than a route handler) keeps
// the query behind the same RLS session the rest of the page uses, and the
// payload deliberately never selects the encrypted token columns.

import * as React from "react";
import {
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  Lock,
  Mail,
  Share2,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  RETENTION_OPTIONS,
  STORAGE_LOCATION_OPTIONS,
  VISIBILITY_OPTIONS,
  labelFor,
  type PrivacySettings,
  type SettingsData,
} from "@/lib/settings/model";
import {
  exportAccountData,
  savePrivacySettings,
} from "@/app/(app)/settings/actions";
import {
  GhostButton,
  PrimaryButton,
  SelectField,
  SettingRow,
  SettingsCard,
  SettingsColumn,
  SettingsColumns,
  Toggle,
} from "../primitives";
import { NeedHelpCard, PromptCard, SummaryRail } from "../summary-rail";
import { useSectionForm } from "../use-section-form";
import { DeleteAccountDialog } from "./danger-zone";

export function DataPrivacySection({ data }: { data: SettingsData }) {
  const form = useSectionForm(
    data.privacy,
    savePrivacySettings,
    "Privacy preferences saved.",
  );
  const [deleting, setDeleting] = React.useState(false);

  return (
    <>
      {/* 7/5: the one long form on the left, the two short action cards
          stacked on the right. At 1728px the right column splits two-up for a
          true 4/4/4 row. */}
      <SettingsColumns>
        <SettingsColumn span={7} span3xl={4}>
          <SettingsCard
            title="Privacy Settings"
            blurb="Control who can see your data and how it's used."
            action={
              <PrimaryButton
                disabled={!form.dirty || form.pending}
                onClick={form.submit}
              >
                {form.pending ? "Saving…" : "Save Preferences"}
              </PrimaryButton>
            }
          >
            <SettingRow
              icon={Lock}
              tone="success"
              label="Profile Visibility"
              hint="Control who can see your profile and activity."
              control={
                <SelectField
                  label="Profile visibility"
                  value={form.draft.profile_visibility}
                  options={VISIBILITY_OPTIONS}
                  onChange={(v) =>
                    form.set({
                      profile_visibility:
                        v as PrivacySettings["profile_visibility"],
                    })
                  }
                  className="min-w-[180px]"
                />
              }
            />
            <SettingRow
              icon={Eye}
              tone="running"
              label="Activity Visibility"
              hint="Allow others to see when you're active."
              control={
                <Toggle
                  label="Activity visibility"
                  checked={form.draft.activity_visibility}
                  onChange={form.field("activity_visibility")}
                />
              }
            />
            <SettingRow
              icon={Share2}
              tone="brand"
              label="Data Sharing"
              hint="Allow anonymous usage data collection to improve ChatPilott."
              control={
                <Toggle
                  label="Data sharing"
                  checked={form.draft.data_sharing}
                  onChange={form.field("data_sharing")}
                />
              }
            />
            <SettingRow
              icon={Sparkles}
              tone="danger"
              label="Personalized Recommendations"
              hint="Enable personalized tips and workflow suggestions."
              control={
                <Toggle
                  label="Personalized recommendations"
                  checked={form.draft.personalized_recommendations}
                  onChange={form.field("personalized_recommendations")}
                />
              }
            />
            <SettingRow
              icon={Clock}
              label="Retention Period"
              hint="Choose how long we keep your data."
              control={
                <SelectField
                  label="Retention period"
                  value={String(form.draft.retention_months)}
                  options={RETENTION_OPTIONS}
                  onChange={(v) => form.set({ retention_months: Number(v) })}
                  className="min-w-[140px]"
                />
              }
            />
            <SettingRow
              icon={Mail}
              tone="success"
              label="Marketing Communications"
              hint="Receive product updates, offers and newsletters."
              control={
                <Toggle
                  label="Marketing communications"
                  checked={form.draft.marketing_communications}
                  onChange={form.field("marketing_communications")}
                />
              }
            />
          </SettingsCard>
        </SettingsColumn>

        <SettingsColumn span={5} span3xl={8} split3xl>
          <SettingsCard title="Your Data" blurb="Manage and export your data.">
            <SettingRow
              icon={Download}
              tone="running"
              label="Export Data"
              hint="Download a copy of all your data."
              control={<ExportButton label="Export Data" />}
            />
            <SettingRow
              icon={FileText}
              label="Download Account Report"
              hint="Get a detailed report of your account activity."
              control={<ExportButton label="Download Report" />}
            />
            <SettingRow
              icon={Database}
              tone="brand"
              label="Data Storage Location"
              hint="See where your data is securely stored."
              control={
                <SelectField
                  label="Data storage location"
                  value={form.draft.data_storage_location}
                  options={STORAGE_LOCATION_OPTIONS}
                  onChange={(v) =>
                    form.set({
                      data_storage_location:
                        v as PrivacySettings["data_storage_location"],
                    })
                  }
                  className="min-w-[160px]"
                />
              }
            />
          </SettingsCard>

          <SettingsCard
            title="Privacy & Compliance"
            blurb="Manage your privacy rights and compliance settings."
          >
            <SettingRow
              icon={Shield}
              tone="success"
              label="GDPR Compliance"
              hint="Manage your GDPR data processing preferences."
              control={<GhostButton disabled>Manage</GhostButton>}
            />
            <SettingRow
              icon={Trash2}
              danger
              label="Delete Account"
              hint="Permanently delete your account and all associated data."
              control={
                <GhostButton tone="danger" onClick={() => setDeleting(true)}>
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete Account
                </GhostButton>
              }
            />
          </SettingsCard>
        </SettingsColumn>
      </SettingsColumns>

      <SummaryRail
        title="Data & Privacy Summary"
        blurb="Your current privacy configuration"
        resetKey="privacy"
        items={[
          {
            icon: Lock,
            label: "Profile Visibility",
            value: labelFor(VISIBILITY_OPTIONS, form.draft.profile_visibility),
            tone: "success",
          },
          {
            icon: Eye,
            label: "Activity Visibility",
            value: form.draft.activity_visibility ? "Visible" : "Hidden",
          },
          {
            icon: Share2,
            label: "Data Sharing",
            value: form.draft.data_sharing ? "Enabled" : "Disabled",
            tone: "brand",
          },
          {
            icon: Clock,
            label: "Retention Period",
            value: `${form.draft.retention_months} Months`,
          },
        ]}
      >
        <PromptCard
          title="Your privacy matters"
          body="We use industry-standard security measures to keep your data safe and secure."
          cta="Learn More"
          href="/privacy"
        />
        <NeedHelpCard topic="data & privacy and your rights" />
      </SummaryRail>

      <DeleteAccountDialog
        open={deleting}
        email={data.profile.email}
        onClose={() => setDeleting(false)}
      />
    </>
  );
}

/**
 * Materialises the export in the browser. The blob URL is revoked immediately
 * after the click so the JSON — which contains lead emails — isn't left
 * addressable for the rest of the session.
 */
function ExportButton({ label }: { label: string }) {
  const [busy, setBusy] = React.useState(false);

  return (
    <GhostButton
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const result = await exportAccountData();
          if (!result.ok) return;

          const url = URL.createObjectURL(
            new Blob([result.data.json], { type: "application/json" }),
          );
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = result.data.filename;
          anchor.click();
          URL.revokeObjectURL(url);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Download className="size-3.5" aria-hidden />
      {busy ? "Preparing…" : label}
    </GhostButton>
  );
}
