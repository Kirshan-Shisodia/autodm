"use client";

// Settings › General — workspace identity, the personal profile, and the
// six client-side preferences.
//
// Workspace and profile save separately because they write to different tables
// (`workspace_settings` vs `users`) and a failed avatar upload shouldn't block
// a timezone change. Preferences save with the workspace card since they live
// on the same row.

import {
  Bell,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  Shield,
  Sun,
  User,
  type LucideIcon,
} from "lucide-react";

import {
  LANGUAGE_OPTIONS,
  ROLE_INFO,
  TIMEZONE_OPTIONS,
  WORKSPACE_PREFERENCE_KEYS,
  labelFor,
  type SettingsData,
  type WorkspaceSettings,
} from "@/lib/settings/model";
import {
  saveProfile,
  saveWorkspaceSettings,
} from "@/app/(app)/settings/actions";
import {
  GhostButton,
  InlineTextField,
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

const PREFERENCE_ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  layers: Layers,
  bell: Bell,
  mail: Mail,
  send: Send,
  refresh: RefreshCw,
};

export function GeneralSection({ data }: { data: SettingsData }) {
  const workspace = useSectionForm(
    data.workspace,
    saveWorkspaceSettings,
    "Workspace settings saved.",
  );
  const profile = useSectionForm(
    { full_name: data.profile.name },
    saveProfile,
    "Profile updated.",
  );

  return (
    <>
      {/* 7/5: identity and location together on the left, the preference
          switches — a different kind of decision — on the right. At 1728px the
          left column splits two-up, giving a true 4/4/4 row. */}
      <SettingsColumns>
        <SettingsColumn span={7} span3xl={8} split3xl>
          {/* ---------------- Workspace ---------------- */}
          <SettingsCard
            title="Workspace Information"
            blurb="Basic details about your workspace."
            action={
              <PrimaryButton
                disabled={!workspace.dirty || workspace.pending}
                onClick={workspace.submit}
              >
                {workspace.pending ? "Saving…" : "Save Changes"}
              </PrimaryButton>
            }
          >
            <SettingRow
              icon={FileText}
              label="Workspace Name"
              hint="This is your workspace name."
              control={
                <InlineTextField
                  label="Workspace name"
                  value={workspace.draft.workspace_name}
                  onChange={workspace.field("workspace_name")}
                  maxLength={80}
                />
              }
            />
            <SettingRow
              icon={Globe}
              tone="running"
              label="Workspace Timezone"
              hint="Timezone used for reports and scheduling."
              control={
                <SelectField
                  label="Workspace timezone"
                  value={workspace.draft.workspace_timezone}
                  onChange={workspace.field("workspace_timezone")}
                  options={TIMEZONE_OPTIONS}
                  className="min-w-[190px]"
                />
              }
            />
            <SettingRow
              icon={Globe}
              tone="amber"
              label="Workspace Language"
              hint="Language for dashboard and emails."
              control={
                <SelectField
                  label="Workspace language"
                  value={workspace.draft.workspace_language}
                  onChange={workspace.field("workspace_language")}
                  options={LANGUAGE_OPTIONS}
                />
              }
            />
          </SettingsCard>

          {/* ---------------- Profile ---------------- */}
          <SettingsCard
            title="Profile Information"
            blurb="Your personal account details."
            action={
              <PrimaryButton
                disabled={!profile.dirty || profile.pending}
                onClick={profile.submit}
              >
                {profile.pending ? "Saving…" : "Save Changes"}
              </PrimaryButton>
            }
          >
            <SettingRow
              icon={User}
              label="Name"
              hint="Shown across the workspace."
              control={
                <InlineTextField
                  label="Full name"
                  value={profile.draft.full_name}
                  onChange={profile.field("full_name")}
                  maxLength={80}
                />
              }
            />
            <SettingRow
              icon={Mail}
              tone="success"
              label="Email"
              hint="Verified · used for account notifications."
              control={
                // Changing the sign-in address is an auth flow with its own
                // verification step, so it is deliberately read-only here.
                <span className="inline-flex h-9 min-w-[200px] items-center truncate rounded-lg border border-border-default bg-surface-muted px-3 text-[13px] text-ink-tertiary">
                  {data.profile.email}
                </span>
              }
            />
            <SettingRow
              icon={MessageSquare}
              tone="amber"
              label="Phone Number (Optional)"
              hint="Used for important account notifications."
              control={
                <InlineTextField
                  label="Phone number"
                  value={workspace.draft.phone_number ?? ""}
                  onChange={(v) =>
                    workspace.set({
                      phone_number: (v === ""
                        ? null
                        : v) as WorkspaceSettings["phone_number"],
                    })
                  }
                  placeholder="Add a number"
                  maxLength={20}
                />
              }
            />
            <SettingRow
              icon={ImageIcon}
              label="Profile Picture"
              hint="JPG, PNG or WebP. Max size 2MB."
              control={<GhostButton disabled>Change Avatar</GhostButton>}
            />
          </SettingsCard>
        </SettingsColumn>

        {/* ---------------- Preferences ---------------- */}
        <SettingsColumn span={5} span3xl={4}>
          <SettingsCard
            title="Preferences"
            blurb="Personalise how ChatPilott looks and behaves."
          >
            {WORKSPACE_PREFERENCE_KEYS.map((pref) => (
              <SettingRow
                key={pref.key}
                icon={PREFERENCE_ICONS[pref.icon] ?? Bell}
                tone={pref.key === "dark_mode" ? "brand" : "neutral"}
                label={pref.label}
                hint={pref.hint}
                control={
                  <Toggle
                    label={pref.label}
                    checked={Boolean(workspace.draft[pref.key])}
                    onChange={(v) =>
                      workspace.set({
                        [pref.key]: v,
                      } as Partial<WorkspaceSettings>)
                    }
                  />
                }
              />
            ))}
          </SettingsCard>
        </SettingsColumn>
      </SettingsColumns>

      <SummaryRail
        title="Workspace Summary"
        blurb="Your current workspace configuration"
        resetKey="general"
        items={[
          {
            icon: FileText,
            label: "Workspace",
            value: workspace.draft.workspace_name,
          },
          {
            icon: Globe,
            label: "Timezone",
            value: workspace.draft.workspace_timezone,
            tone: "brand",
          },
          {
            icon: Globe,
            label: "Language",
            value: labelFor(
              LANGUAGE_OPTIONS,
              workspace.draft.workspace_language,
            ),
          },
          {
            icon: Shield,
            label: "Role",
            value: `Workspace ${ROLE_INFO[data.profile.role].label}`,
            status: ROLE_INFO[data.profile.role].label,
            tone: "success",
          },
        ]}
      >
        <PromptCard
          title="Make it yours"
          body="Set your workspace details and preferences so ChatPilott works the way your team does."
          cta="Learn More"
          href="/help"
        />
        <NeedHelpCard topic="workspace settings and preferences" />
      </SummaryRail>
    </>
  );
}
