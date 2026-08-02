"use client";

// Settings › Automation Defaults — the values pre-filled into every new
// automation. Editing them never touches automations that already exist; the
// card copy says so, because "defaults" is otherwise easy to read as "apply to
// everything".
//
// Layout: 6/6, two cards of five rows each. The split is by question rather
// than by control type — *what the automation does* on the left, *when and how
// much* on the right. Both write one database row, so they share a single
// dirty state and commit together from the save bar.

import {
  ChartNoAxesColumn,
  Clock,
  Globe,
  MessageSquare,
  RotateCcw,
  Shield,
  Tag,
  Zap,
} from "lucide-react";

import {
  AUTOMATION_DEFAULTS,
  LABEL_OPTIONS,
  REPLY_OPTIONS,
  RETRY_OPTIONS,
  TIMEZONE_OPTIONS,
  TIME_OPTIONS,
  TRIGGER_OPTIONS,
  formatTimeRange,
  labelFor,
  type AutomationDefaults,
  type SettingsData,
} from "@/lib/settings/model";
import { saveAutomationDefaults } from "@/app/(app)/settings/actions";
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

export function AutomationDefaultsSection({ data }: { data: SettingsData }) {
  const form = useSectionForm(
    data.automation,
    saveAutomationDefaults,
    "Automation defaults saved.",
  );

  return (
    <>
      <SettingsColumns>
        {/* ---------------- What it does ---------------- */}
        <SettingsColumn span={6}>
          <SettingsCard
            title="Trigger & Reply"
            blurb="What starts a new automation, how it answers, and whether it needs sign-off."
          >
            <SettingRow
              icon={Zap}
              tone="success"
              label="Default Trigger Type"
              hint="Choose the default trigger for new automations."
              control={
                <SelectField
                  label="Default trigger type"
                  value={form.draft.trigger_type}
                  options={TRIGGER_OPTIONS}
                  onChange={(v) =>
                    form.set({
                      trigger_type: v as AutomationDefaults["trigger_type"],
                    })
                  }
                  className="min-w-[170px]"
                />
              }
            />
            <SettingRow
              icon={MessageSquare}
              label="Default Reply Type"
              hint="Choose the default reply type for new automations."
              control={
                <SelectField
                  label="Default reply type"
                  value={form.draft.reply_type}
                  options={REPLY_OPTIONS}
                  onChange={(v) =>
                    form.set({
                      reply_type: v as AutomationDefaults["reply_type"],
                    })
                  }
                  className="min-w-[170px]"
                />
              }
            />
            <SettingRow
              icon={Tag}
              tone="amber"
              label="Default Label"
              hint="Select a label for new automations."
              control={
                <SelectField
                  label="Default label"
                  value={form.draft.label}
                  options={LABEL_OPTIONS}
                  onChange={form.field("label")}
                  className="min-w-[140px]"
                />
              }
            />
            <SettingRow
              icon={MessageSquare}
              label="Default Fallback Message"
              hint="Message to send if the main message fails."
              control={
                <InlineTextField
                  label="Default fallback message"
                  value={form.draft.fallback_message}
                  onChange={form.field("fallback_message")}
                  className="min-w-[240px]"
                  maxLength={1000}
                />
              }
            />
            <SettingRow
              icon={Shield}
              tone="success"
              label="Default Approval"
              hint="New automations will be paused until approved."
              control={
                <Toggle
                  label="Require approval"
                  checked={form.draft.require_approval}
                  onChange={form.field("require_approval")}
                />
              }
            />
          </SettingsCard>
        </SettingsColumn>

        {/* ---------------- When, and how much ---------------- */}
        <SettingsColumn span={6}>
          <SettingsCard
            title="Timing & Limits"
            blurb="When automations are allowed to run, and how hard they're allowed to push."
          >
            <SettingRow
              icon={Clock}
              tone="brand"
              label="Default Time Delay"
              hint="Set the default delay between trigger and reply."
              control={
                <NumberField
                  label="Default time delay in seconds"
                  value={form.draft.time_delay_seconds}
                  onChange={form.field("time_delay_seconds")}
                  unit="Seconds"
                  min={0}
                  max={3600}
                />
              }
            />
            <SettingRow
              icon={Clock}
              label="Default Working Hours"
              hint="Set the default active hours for automations."
              control={
                <div className="flex items-center gap-1.5">
                  <SelectField
                    label="Working hours start"
                    value={form.draft.working_hours_start}
                    options={TIME_OPTIONS}
                    onChange={form.field("working_hours_start")}
                    className="min-w-[118px]"
                  />
                  <span className="text-[12px] text-ink-muted">–</span>
                  <SelectField
                    label="Working hours end"
                    value={form.draft.working_hours_end}
                    options={TIME_OPTIONS}
                    onChange={form.field("working_hours_end")}
                    className="min-w-[118px]"
                  />
                </div>
              }
            />
            <SettingRow
              icon={Globe}
              tone="running"
              label="Default Timezone"
              hint="Set the default timezone for all automations."
              control={
                <SelectField
                  label="Default timezone"
                  value={form.draft.timezone}
                  options={TIMEZONE_OPTIONS}
                  onChange={form.field("timezone")}
                  className="min-w-[210px]"
                />
              }
            />
            <SettingRow
              icon={ChartNoAxesColumn}
              tone="running"
              label="Default DM Limit"
              hint="Daily DM limit for new automations."
              control={
                <NumberField
                  label="Default daily DM limit"
                  value={form.draft.dm_limit_per_day}
                  onChange={form.field("dm_limit_per_day")}
                  unit="DMs / Day"
                  min={1}
                  max={100000}
                />
              }
            />
            <SettingRow
              icon={RotateCcw}
              tone="danger"
              label="Default Retry Attempt"
              hint="Number of retry attempts if DM fails."
              control={
                <SelectField
                  label="Default retry attempts"
                  value={String(form.draft.retry_attempts)}
                  options={RETRY_OPTIONS}
                  onChange={(v) => form.set({ retry_attempts: Number(v) })}
                  className="min-w-[140px]"
                />
              }
            />
          </SettingsCard>

          <SaveBar
            dirty={form.dirty}
            pending={form.pending}
            onSave={form.submit}
            onDiscard={form.reset}
            label="Unsaved automation defaults"
          />
        </SettingsColumn>
      </SettingsColumns>

      <SummaryRail
        title="Defaults Summary"
        blurb="Your current default settings"
        resetKey="automation"
        footerStrip
        items={[
          {
            icon: Zap,
            label: "Trigger Type",
            value: labelFor(TRIGGER_OPTIONS, form.draft.trigger_type),
            tone: "success",
          },
          {
            icon: MessageSquare,
            label: "Reply Type",
            value: labelFor(REPLY_OPTIONS, form.draft.reply_type),
          },
          {
            icon: Clock,
            label: "Time Delay",
            value: `${form.draft.time_delay_seconds} Second${form.draft.time_delay_seconds === 1 ? "" : "s"}`,
            tone: "brand",
          },
          {
            icon: Clock,
            label: "Working Hours",
            value: formatTimeRange(
              form.draft.working_hours_start,
              form.draft.working_hours_end,
            ),
          },
          {
            icon: Globe,
            label: "Timezone",
            value: form.draft.timezone,
            tone: "brand",
          },
        ]}
      >
        <PromptCard
          title="Work smarter with defaults"
          body={`Save time by setting smart defaults for all your automations. Recommended delay is ${AUTOMATION_DEFAULTS.time_delay_seconds} seconds.`}
          cta="Learn More"
          href="/help"
        />
        <NeedHelpCard topic="automation defaults and how they work" />
      </SummaryRail>
    </>
  );
}
