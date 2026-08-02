"use client";

// Settings › Notifications — three channel tabs plus quiet hours.
//
// All three channels save together: they are one row, and a user who turns off
// email alerts and then switches tabs to adjust push would otherwise lose the
// first change. The single "Save Changes" button therefore commits the whole
// notification sheet regardless of which tab is showing.

import * as React from "react";
import {
  Bell,
  ChartNoAxesColumn,
  Clock,
  CreditCard,
  Gauge,
  Globe,
  Heart,
  Mail,
  MessageSquare,
  MonitorSmartphone,
  TriangleAlert,
  UserPlus,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  CHANNEL_LABEL,
  FREQUENCY_OPTIONS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TOPICS,
  TIMEZONE_OPTIONS,
  TIME_OPTIONS,
  channelCount,
  formatTimeRange,
  type NotificationChannel,
  type NotificationPref,
  type NotificationSettings,
  type SettingsData,
} from "@/lib/settings/model";
import { saveNotificationSettings } from "@/app/(app)/settings/actions";
import {
  PrimaryButton,
  SelectField,
  SettingRow,
  SettingsCard,
  SettingsColumn,
  SettingsColumns,
  Tabs,
  Toggle,
} from "../primitives";
import { NeedHelpCard, PromptCard, SummaryRail } from "../summary-rail";
import { useSectionForm } from "../use-section-form";

const CHANNEL_ICONS: Record<NotificationChannel, LucideIcon> = {
  email: Mail,
  push: Bell,
  in_app: MonitorSmartphone,
};

const TOPIC_ICONS: Record<string, LucideIcon> = {
  mail: Mail,
  "user-plus": UserPlus,
  message: MessageSquare,
  chart: ChartNoAxesColumn,
  card: CreditCard,
  users: Users,
  bell: Bell,
  heart: Heart,
  zap: Zap,
  gauge: Gauge,
};

export function NotificationsSection({ data }: { data: SettingsData }) {
  const form = useSectionForm(
    data.notifications,
    saveNotificationSettings,
    "Notification preferences saved.",
  );
  const [channel, setChannel] = React.useState<NotificationChannel>("email");

  const prefs = form.draft[channel];

  const setPref = (key: string, patch: Partial<NotificationPref>) => {
    form.set({
      [channel]: {
        ...prefs,
        [key]: { ...prefs[key], ...patch },
      },
    } as Partial<NotificationSettings>);
  };

  const email = channelCount(form.draft.email, "email");
  const push = channelCount(form.draft.push, "push");
  const inApp = channelCount(form.draft.in_app, "in_app");

  return (
    <>
      <div className="space-y-6">
        <Tabs
          value={channel}
          onChange={setChannel}
          tabs={NOTIFICATION_CHANNELS.map((c) => ({
            value: c,
            label: CHANNEL_LABEL[c],
          }))}
        />

        {/* 7/5: the topic list needs width for a toggle and a frequency
            select side by side; quiet hours and the cross-channel recap are
            narrow. At 1728px the right column splits two-up. */}
        <SettingsColumns>
          <SettingsColumn span={7} span3xl={6}>
            <SettingsCard
              title={`${CHANNEL_LABEL[channel].replace("Notifications", "Notification")} Settings`}
              blurb={`Choose which updates and alerts you want to receive via ${channel === "in_app" ? "the app" : channel}.`}
              action={
                <PrimaryButton
                  disabled={!form.dirty || form.pending}
                  onClick={form.submit}
                >
                  {form.pending ? "Saving…" : "Save Changes"}
                </PrimaryButton>
              }
            >
              {NOTIFICATION_TOPICS[channel].map((topic) => {
                const pref = prefs[topic.key];
                return (
                  <SettingRow
                    key={topic.key}
                    icon={TOPIC_ICONS[topic.icon] ?? Bell}
                    tone={topic.locked ? "danger" : "neutral"}
                    label={topic.label}
                    hint={topic.hint}
                    control={
                      <>
                        <Toggle
                          label={topic.label}
                          checked={pref?.enabled ?? false}
                          disabled={topic.locked}
                          onChange={(enabled) =>
                            setPref(topic.key, { enabled })
                          }
                        />
                        <SelectField
                          label={`${topic.label} frequency`}
                          value={pref?.frequency ?? "instant"}
                          options={FREQUENCY_OPTIONS}
                          disabled={!pref?.enabled}
                          onChange={(frequency) =>
                            setPref(topic.key, { frequency })
                          }
                          className="min-w-[140px]"
                        />
                      </>
                    }
                  />
                );
              })}
            </SettingsCard>
          </SettingsColumn>

          <SettingsColumn span={5} span3xl={6} split3xl>
            <SettingsCard
              title="Quiet Hours"
              blurb="Set a time range when you do not want to receive non-urgent email notifications."
            >
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-warning-bg px-3 py-2.5 text-[12px] text-warning-text">
                <TriangleAlert
                  className="mt-px size-3.5 shrink-0"
                  aria-hidden
                />
                You will still receive critical alerts and billing
                notifications.
              </div>

              <SettingRow
                icon={Clock}
                tone="brand"
                label="Enable Quiet Hours"
                hint="Pause non-urgent emails during these hours."
                control={
                  <Toggle
                    label="Enable quiet hours"
                    checked={form.draft.quiet_hours_enabled}
                    onChange={form.field("quiet_hours_enabled")}
                  />
                }
              />
              <SettingRow
                icon={Clock}
                label="Start Time"
                hint="Quiet hours begin at this time."
                control={
                  <SelectField
                    label="Quiet hours start"
                    value={form.draft.quiet_hours_start}
                    options={TIME_OPTIONS}
                    disabled={!form.draft.quiet_hours_enabled}
                    onChange={form.field("quiet_hours_start")}
                    className="min-w-[130px]"
                  />
                }
              />
              <SettingRow
                icon={Clock}
                label="End Time"
                hint="Quiet hours end at this time."
                control={
                  <SelectField
                    label="Quiet hours end"
                    value={form.draft.quiet_hours_end}
                    options={TIME_OPTIONS}
                    disabled={!form.draft.quiet_hours_enabled}
                    onChange={form.field("quiet_hours_end")}
                    className="min-w-[130px]"
                  />
                }
              />
              <SettingRow
                icon={Globe}
                tone="running"
                label="Timezone"
                hint="Timezone used for quiet hours."
                control={
                  <SelectField
                    label="Quiet hours timezone"
                    value={form.draft.quiet_hours_timezone}
                    options={TIMEZONE_OPTIONS}
                    disabled={!form.draft.quiet_hours_enabled}
                    onChange={form.field("quiet_hours_timezone")}
                    className="min-w-[190px]"
                  />
                }
              />
            </SettingsCard>

            {/* Switching channel tabs used to be exploratory — you had to open
              each one to find out whether it was on. This recaps the two you
              aren't looking at, from counts the model already computes. */}
            <SettingsCard
              title="Channel Overview"
              blurb="How many topics are switched on in each channel."
            >
              {NOTIFICATION_CHANNELS.map((c) => {
                const count = channelCount(form.draft[c], c);
                const active = c === channel;
                return (
                  <SettingRow
                    key={c}
                    icon={CHANNEL_ICONS[c]}
                    tone={active ? "brand" : "neutral"}
                    label={CHANNEL_LABEL[c]}
                    hint={active ? "Currently editing" : "Switch tabs to edit"}
                    control={
                      <span className="wz-font-mono text-[13px] font-medium text-ink tabular-nums">
                        {count.on} / {count.total}
                      </span>
                    }
                  />
                );
              })}
            </SettingsCard>
          </SettingsColumn>
        </SettingsColumns>
      </div>

      <SummaryRail
        title="Notification Summary"
        blurb="Your current notification configuration"
        resetKey="notifications"
        items={[
          {
            icon: Mail,
            label: "Email Notifications",
            value: `${email.on} / ${email.total}`,
            status: email.on > 0 ? "enabled" : undefined,
            tone: "success",
          },
          {
            icon: Bell,
            label: "Push Notifications",
            value: `${push.on} / ${push.total}`,
            status: push.on > 0 ? "enabled" : undefined,
            tone: "brand",
          },
          {
            icon: MonitorSmartphone,
            label: "In-App Notifications",
            value: `${inApp.on} / ${inApp.total}`,
            status: inApp.on > 0 ? "enabled" : undefined,
          },
          {
            icon: Clock,
            label: "Quiet Hours",
            value: form.draft.quiet_hours_enabled
              ? formatTimeRange(
                  form.draft.quiet_hours_start,
                  form.draft.quiet_hours_end,
                )
              : "Off",
          },
        ]}
      >
        <PromptCard
          title="Stay in Control"
          body="Customize your preferences and stay updated on what matters the most to you."
          cta="Learn More"
          href="/help"
        />
        <NeedHelpCard topic="notifications and how they work" />
      </SummaryRail>
    </>
  );
}
