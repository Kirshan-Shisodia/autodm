"use client";

// Settings › Connected Accounts — the social connections and the OAuth scopes
// they granted.
//
// Everything here is derived from `instagram_accounts`: one Meta connection
// backs the Instagram, Page and Messenger rows, and the permission list is the
// scopes Meta actually returned, so revoking a scope upstream shows up here
// without any extra bookkeeping.
//
// Layout: 7/5. The accounts list gets the wide column because its rows carry
// the most information; permissions are a fixed four-row reference.
//
// The old "Social Accounts / Integrations" sub-tabs are gone — the second tab
// was a stub that pointed at the Integrations section, and a dead tab costs a
// click and 40px of height for nothing.

import Link from "next/link";
import { ArrowRight, Ban, CircleCheck, Lock, Pause } from "lucide-react";

import {
  PLATFORM_META,
  type AccountPermission,
  type SettingsData,
  type SocialAccount,
} from "@/lib/settings/model";
import {
  Chip,
  GhostButton,
  ListRow,
  Monogram,
  SettingsCard,
  SettingsColumn,
  SettingsColumns,
} from "../primitives";
import { NeedHelpCard, PromptCard, SummaryRail } from "../summary-rail";

const STATUS_CHIP: Record<
  SocialAccount["status"],
  { label: string; tone: "success" | "warning" | "neutral" }
> = {
  connected: { label: "Connected", tone: "success" },
  limited: { label: "Limited", tone: "warning" },
  not_connected: { label: "Not Connected", tone: "neutral" },
};

const TILE_TONE = {
  instagram: "danger",
  facebook: "running",
  messenger: "amber",
  tiktok: "neutral",
  youtube: "neutral",
} as const;

export function ConnectedAccountsSection({ data }: { data: SettingsData }) {
  const connected = data.accounts.filter(
    (a) => a.status === "connected",
  ).length;
  const limited = data.accounts.filter((a) => a.status === "limited").length;
  const missing = data.accounts.filter(
    (a) => a.status === "not_connected",
  ).length;
  const pct = (n: number) =>
    `${Math.round((n / Math.max(1, data.accounts.length)) * 100)}%`;

  return (
    <>
      <SettingsColumns>
        <SettingsColumn span={7}>
          <SettingsCard
            title="Connected Social Accounts"
            blurb="Connect your social media accounts to start automating."
            action={
              <Link
                href="/connect"
                className="inline-flex h-9 items-center rounded-lg bg-action px-4 text-[13px] font-medium text-ink-inverse transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-action-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Connect Account
              </Link>
            }
          >
            {data.accounts.map((account) => (
              <AccountRow key={account.platform} account={account} />
            ))}
          </SettingsCard>
        </SettingsColumn>

        <SettingsColumn span={5}>
          <SettingsCard
            title="Account Permissions"
            blurb="Review and manage permissions for your connected accounts."
          >
            {data.permissions.map((permission) => (
              <PermissionRow key={permission.name} permission={permission} />
            ))}
            <Link
              href="/accounts"
              className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-card text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink"
            >
              View All Permissions
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </SettingsCard>
        </SettingsColumn>
      </SettingsColumns>

      <SummaryRail
        title="Connection Summary"
        blurb={`${connected + limited} / ${data.accounts.length} accounts connected`}
        items={[
          {
            icon: CircleCheck,
            label: "Connected",
            value: `${connected} account${connected === 1 ? "" : "s"} (${pct(connected)})`,
            tone: "success",
          },
          {
            icon: Pause,
            label: "Limited",
            value: `${limited} account${limited === 1 ? "" : "s"} (${pct(limited)})`,
            tone: "brand",
          },
          {
            icon: Ban,
            label: "Not Connected",
            value: `${missing} account${missing === 1 ? "" : "s"} (${pct(missing)})`,
          },
          {
            icon: Lock,
            label: "Security",
            value: "We never post on your behalf",
            tone: "brand",
          },
        ]}
      >
        <PromptCard
          title="Why connect accounts?"
          body="Automate DMs and replies, track leads, access analytics and manage everything in one place."
          cta="Learn about security"
          href="/help"
        />
        <NeedHelpCard topic="connecting your accounts securely" />
      </SummaryRail>
    </>
  );
}

/**
 * Two-line row: identity on the first line, connection state on the second.
 * The status detail used to sit in a middle column that truncated at any
 * width narrower than half the page.
 */
function AccountRow({ account }: { account: SocialAccount }) {
  const meta = PLATFORM_META[account.platform];
  const chip = STATUS_CHIP[account.status];
  const unavailable = account.status === "not_connected";

  return (
    <ListRow>
      <Monogram text={meta.monogram} tone={TILE_TONE[account.platform]} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">
          {meta.name}
          <span className="ml-1.5 font-normal text-ink-tertiary">
            {account.handle}
          </span>
        </p>
        <p className="truncate text-[11px] text-ink-tertiary">
          {account.detail}
        </p>
      </div>
      <Chip tone={chip.tone}>{chip.label}</Chip>
      {unavailable ? (
        <Link
          href="/connect"
          className="inline-flex h-8 items-center rounded-lg border border-border-default bg-surface-card px-3 text-[12px] font-medium text-brand transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg"
        >
          Connect
        </Link>
      ) : (
        <Link
          href="/accounts"
          className="inline-flex h-8 items-center rounded-lg border border-border-default bg-surface-card px-3 text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink"
        >
          Manage
        </Link>
      )}
    </ListRow>
  );
}

function PermissionRow({ permission }: { permission: AccountPermission }) {
  const meta = PLATFORM_META[permission.platform];

  return (
    <ListRow>
      <Monogram text={meta.monogram} tone={TILE_TONE[permission.platform]} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">
          {permission.name}
        </p>
        <p className="truncate text-[11px] text-ink-tertiary">
          {permission.blurb}
        </p>
      </div>
      <Chip tone={permission.active ? "success" : "neutral"}>
        {permission.active ? "Active" : "Inactive"}
      </Chip>
      <GhostButton
        className="h-8 px-3 text-[12px]"
        disabled={!permission.active}
      >
        Review
      </GhostButton>
    </ListRow>
  );
}
