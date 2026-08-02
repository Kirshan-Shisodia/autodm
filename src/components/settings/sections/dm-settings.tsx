"use client";

// Settings › DM Settings — how messages themselves behave once an automation
// fires.
//
// Layout: 6/6, two cards of six rows each — the most evenly balanced page in
// the module. The split is *what gets sent* vs *how it gets sent and how
// often*, which puts the three limits that keep an account inside Meta's
// tolerances together in one place rather than scattered across three cards.
//
// Both cards write one database row, so they share a dirty state and commit
// from the save bar.

import {
  Ban,
  ChartNoAxesColumn,
  Clock,
  FileText,
  Image as ImageIcon,
  Link2,
  MessageSquare,
  Pause,
  Send,
  Undo2,
  Users,
} from "lucide-react";

import {
  DM_DEFAULTS,
  FILE_SIZE_OPTIONS,
  MESSAGE_TYPE_OPTIONS,
  labelFor,
  type DmSettings,
  type SettingsData,
} from "@/lib/settings/model";
import { saveDmSettings } from "@/app/(app)/settings/actions";
import {
  InlineTextField,
  NumberField,
  SaveBar,
  SelectField,
  SettingRow,
  SettingsCard,
  SettingsColumn,
  SettingsColumns,
  Toggle,
} from "../primitives";
import { NeedHelpCard, PromptCard, SummaryRail } from "../summary-rail";
import { useSectionForm } from "../use-section-form";

/**
 * Sentinel for "no template selected".
 *
 * `template_id` is nullable, but Radix Select reserves the empty string for
 * "cleared, show the placeholder" and throws if an Item is given `value=""`.
 * So the null state travels through the select as this sentinel and is mapped
 * back to `null` on the way in and out.
 */
const NO_TEMPLATE = "none";

export function DmSettingsSection({ data }: { data: SettingsData }) {
  const form = useSectionForm(data.dm, saveDmSettings, "DM settings saved.");

  // A workspace with no saved templates still needs a valid select value.
  const templateOptions = [
    { value: NO_TEMPLATE, label: "No template" },
    ...data.templates.map((t) => ({ value: t.id, label: t.name })),
  ];
  const templateName =
    data.templates.find((t) => t.id === form.draft.template_id)?.name ??
    "No template";

  return (
    <>
      <SettingsColumns>
        {/* ---------------- What gets sent ---------------- */}
        <SettingsColumn span={6}>
          <SettingsCard
            title="Message Content"
            blurb="What ChatPilott sends when a trigger is matched."
          >
            <SettingRow
              icon={MessageSquare}
              label="Enable Auto DM"
              hint="Automatically send DMs when a trigger is matched."
              control={
                <Toggle
                  label="Enable auto DM"
                  checked={form.draft.auto_dm_enabled}
                  onChange={form.field("auto_dm_enabled")}
                />
              }
            />
            <SettingRow
              icon={Send}
              tone="running"
              label="Default Message Type"
              hint="Choose the default type of message to send."
              control={
                <SelectField
                  label="Default message type"
                  value={form.draft.message_type}
                  options={MESSAGE_TYPE_OPTIONS}
                  onChange={(v) =>
                    form.set({ message_type: v as DmSettings["message_type"] })
                  }
                  className="min-w-[170px]"
                />
              }
            />
            <SettingRow
              icon={FileText}
              tone="amber"
              label="Default DM Template"
              hint="Select the default message template."
              control={
                <SelectField
                  label="Default DM template"
                  value={form.draft.template_id ?? NO_TEMPLATE}
                  options={templateOptions}
                  onChange={(v) =>
                    form.set({ template_id: v === NO_TEMPLATE ? null : v })
                  }
                  className="min-w-[180px]"
                />
              }
            />
            <SettingRow
              icon={Undo2}
              tone="success"
              label="Default Fallback Message"
              hint="Message to send when main message fails."
              control={
                <InlineTextField
                  label="Fallback message"
                  value={form.draft.fallback_message}
                  onChange={form.field("fallback_message")}
                  className="min-w-[240px]"
                  maxLength={1000}
                />
              }
            />
            <SettingRow
              icon={Link2}
              tone="running"
              label="Link Preview"
              hint="Show link previews in messages."
              control={
                <Toggle
                  label="Link preview"
                  checked={form.draft.link_preview}
                  onChange={form.field("link_preview")}
                />
              }
            />
            <SettingRow
              icon={Users}
              tone="amber"
              label="Humanize Messages"
              hint="Add randomization to make messages look more human."
              control={
                <Toggle
                  label="Humanize messages"
                  checked={form.draft.humanize_messages}
                  onChange={form.field("humanize_messages")}
                />
              }
            />
          </SettingsCard>
        </SettingsColumn>

        {/* ---------------- How, and how often ---------------- */}
        <SettingsColumn span={6}>
          <SettingsCard
            title="Delivery & Limits"
            blurb="Pacing, attachments, and the limits that keep your account in good standing."
          >
            <SettingRow
              icon={Clock}
              tone="brand"
              label="Typing Delay"
              hint="Add a typing delay to make DMs feel natural."
              control={
                <NumberField
                  label="Typing delay in seconds"
                  value={form.draft.typing_delay_seconds}
                  onChange={form.field("typing_delay_seconds")}
                  unit="Seconds"
                  min={0}
                  max={60}
                />
              }
            />
            <SettingRow
              icon={ImageIcon}
              tone="success"
              label="Media Support"
              hint="Allow sending images, videos and files in DMs."
              control={
                <Toggle
                  label="Media support"
                  checked={form.draft.media_support}
                  onChange={form.field("media_support")}
                />
              }
            />
            <SettingRow
              icon={FileText}
              label="Max File Size"
              hint="Set the maximum file size for attachments."
              control={
                <SelectField
                  label="Max file size"
                  value={String(form.draft.max_file_size_mb)}
                  options={FILE_SIZE_OPTIONS}
                  disabled={!form.draft.media_support}
                  onChange={(v) => form.set({ max_file_size_mb: Number(v) })}
                  className="min-w-[120px]"
                />
              }
            />
            <SettingRow
              icon={Pause}
              tone="brand"
              label="Stop DM on Unsubscribe"
              hint="Stop sending DMs when a user unsubscribes."
              control={
                <Toggle
                  label="Stop DM on unsubscribe"
                  checked={form.draft.stop_on_unsubscribe}
                  onChange={form.field("stop_on_unsubscribe")}
                />
              }
            />
            <SettingRow
              icon={Ban}
              tone="danger"
              label="Block Non-Followers"
              hint="Do not send DMs to users who don't follow you."
              control={
                <Toggle
                  label="Block non-followers"
                  checked={form.draft.block_non_followers}
                  onChange={form.field("block_non_followers")}
                />
              }
            />
            <SettingRow
              icon={ChartNoAxesColumn}
              tone="brand"
              label="Daily DM Limit (Per User)"
              hint="Limit number of DMs sent to a user per day."
              control={
                <NumberField
                  label="Daily DM limit per user"
                  value={form.draft.daily_dm_limit_per_user}
                  onChange={form.field("daily_dm_limit_per_user")}
                  unit="DMs / Day"
                  min={1}
                  max={100}
                />
              }
            />
          </SettingsCard>

          <SaveBar
            dirty={form.dirty}
            pending={form.pending}
            onSave={form.submit}
            onDiscard={form.reset}
            label="Unsaved DM settings"
          />
        </SettingsColumn>
      </SettingsColumns>

      <SummaryRail
        title="DM Settings Summary"
        blurb="Your current DM configuration"
        resetKey="dm"
        footerStrip
        items={[
          {
            icon: MessageSquare,
            label: "Auto DM",
            value: form.draft.auto_dm_enabled ? "Enabled" : "Disabled",
            status: form.draft.auto_dm_enabled ? "Enabled" : undefined,
            tone: form.draft.auto_dm_enabled ? "success" : "danger",
          },
          {
            icon: Send,
            label: "Message Type",
            value: labelFor(MESSAGE_TYPE_OPTIONS, form.draft.message_type),
          },
          {
            icon: FileText,
            label: "Template",
            value: templateName,
            tone: "brand",
          },
          {
            icon: Clock,
            label: "Typing Delay",
            value: `${form.draft.typing_delay_seconds} Second${form.draft.typing_delay_seconds === 1 ? "" : "s"}`,
          },
          {
            icon: ChartNoAxesColumn,
            label: "Daily DM Limit",
            value: `${form.draft.daily_dm_limit_per_user} DMs / Day`,
            tone: "brand",
          },
        ]}
      >
        <PromptCard
          title="Make conversations better"
          body={`Customize your DM behavior to improve engagement and save time. We recommend a ${DM_DEFAULTS.typing_delay_seconds}s typing delay.`}
          cta="Learn More"
          href="/help"
        />
        <NeedHelpCard topic="DM settings and best practices" />
      </SummaryRail>
    </>
  );
}
