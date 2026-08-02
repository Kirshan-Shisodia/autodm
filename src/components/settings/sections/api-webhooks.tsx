"use client";

// Settings › API & Webhooks — keys, endpoints and the access switch.
//
// A minted key is shown exactly once, in the banner at the top of the keys
// group. Only its SHA-256 hash and last four characters reach the database, so
// there is deliberately no "reveal" affordance on the rows below: if the user
// loses the plaintext, the fix is to revoke and re-issue.
//
// Layout: 7/5. Access and keys were split into two cards only because they
// were two cards — they are one subject, so they merge into one card with two
// labelled groups. Webhooks keep their own card because they are a separate
// integration surface with their own limits.

import Link from "next/link";
import * as React from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Copy,
  KeyRound,
  Link2,
  Plus,
  Trash2,
  TriangleAlert,
  Webhook,
} from "lucide-react";

import {
  SCOPE_LABEL,
  WEBHOOK_EVENT_OPTIONS,
  formatDate,
  formatDateTime,
  maskKey,
  type ApiKey,
  type SettingsData,
  type WebhookEndpoint,
} from "@/lib/settings/model";
import {
  createApiKey,
  createWebhook,
  deleteWebhook,
  revokeApiKey,
  saveApiSettings,
  testWebhook,
} from "@/app/(app)/settings/actions";
import {
  CardGroup,
  Chip,
  EmptyState,
  GhostButton,
  ListRow,
  Monogram,
  NumberField,
  PrimaryButton,
  SettingRow,
  SettingsCard,
  SettingsColumn,
  SettingsColumns,
  Toggle,
} from "../primitives";
import { NeedHelpCard, PromptCard, SummaryRail } from "../summary-rail";
import { useAction, useSectionForm } from "../use-section-form";

export function ApiWebhooksSection({ data }: { data: SettingsData }) {
  const form = useSectionForm(data.api, saveApiSettings, "API settings saved.");
  const [minted, setMinted] = React.useState<string | null>(null);
  const [creatingKey, setCreatingKey] = React.useState(false);
  const [creatingHook, setCreatingHook] = React.useState(false);

  return (
    <>
      <SettingsColumns>
        {/* ---------------- Access + keys ---------------- */}
        <SettingsColumn span={7}>
          <SettingsCard
            title="API Access & Keys"
            blurb="Use the ChatPilott API to build custom integrations and automate at scale."
          >
            <CardGroup
              label="Access"
              action={
                form.dirty ? (
                  <PrimaryButton
                    className="h-8 px-3 text-[12px]"
                    disabled={form.pending}
                    onClick={form.submit}
                  >
                    {form.pending ? "Saving…" : "Save"}
                  </PrimaryButton>
                ) : undefined
              }
            >
              <div className="mt-3 mb-1 flex items-start gap-2 rounded-lg bg-warning-bg px-3 py-2.5 text-[12px] text-warning-text">
                <TriangleAlert
                  className="mt-px size-3.5 shrink-0"
                  aria-hidden
                />
                Keep your API keys secure. Do not share them publicly or expose
                them in client-side code.
              </div>

              <SettingRow
                icon={Link2}
                tone="running"
                label="Enable API Access"
                hint="Allow access to the ChatPilott API for your workspace."
                control={
                  <Toggle
                    label="Enable API access"
                    checked={form.draft.api_access_enabled}
                    onChange={(v) => form.set({ api_access_enabled: v })}
                  />
                }
              />
              <SettingRow
                icon={BarChart3}
                tone="brand"
                label="Rate Limit"
                hint="Requests per minute across all keys."
                control={
                  <NumberField
                    label="Rate limit per minute"
                    value={form.draft.rate_limit_per_min}
                    onChange={form.field("rate_limit_per_min")}
                    unit="req / min"
                    min={60}
                    max={10000}
                  />
                }
              />
            </CardGroup>

            <CardGroup
              label={`Keys · ${data.apiKeys.length} / ${data.counts.apiKeyLimit}`}
              action={
                <PrimaryButton
                  className="h-8 px-3 text-[12px]"
                  onClick={() => setCreatingKey((v) => !v)}
                  disabled={!form.draft.api_access_enabled}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Create API Key
                </PrimaryButton>
              }
            >
              {minted && (
                <MintedKeyBanner
                  value={minted}
                  onDismiss={() => setMinted(null)}
                />
              )}

              {creatingKey && (
                <CreateKeyForm
                  onDone={(key) => {
                    setMinted(key);
                    setCreatingKey(false);
                  }}
                />
              )}

              {data.apiKeys.length === 0 ? (
                <EmptyState>
                  No keys yet — create one to start calling the API.
                </EmptyState>
              ) : (
                data.apiKeys.map((key) => <KeyRow key={key.id} apiKey={key} />)
              )}

              <FooterLink href="/help">View API Documentation</FooterLink>
            </CardGroup>
          </SettingsCard>
        </SettingsColumn>

        {/* ---------------- Webhooks ---------------- */}
        <SettingsColumn span={5}>
          <SettingsCard
            title="Webhooks"
            blurb="Set up webhook endpoints to receive real-time events from ChatPilott."
            action={
              <PrimaryButton onClick={() => setCreatingHook((v) => !v)}>
                Add Webhook
              </PrimaryButton>
            }
          >
            {creatingHook && (
              <CreateWebhookForm onDone={() => setCreatingHook(false)} />
            )}

            {data.webhooks.length === 0 ? (
              <EmptyState>No endpoints yet.</EmptyState>
            ) : (
              data.webhooks.map((hook) => (
                <WebhookRow key={hook.id} hook={hook} />
              ))
            )}

            <FooterLink href="/help">View Webhook Logs</FooterLink>
          </SettingsCard>
        </SettingsColumn>
      </SettingsColumns>

      <SummaryRail
        title="API & Webhooks Summary"
        blurb="Your developer configuration overview"
        footerStrip
        items={[
          {
            icon: KeyRound,
            label: "API Keys",
            value: `${data.apiKeys.length} / ${data.counts.apiKeyLimit}`,
            status: data.apiKeys.length > 0 ? "Active" : undefined,
            tone: "brand",
          },
          {
            icon: Webhook,
            label: "Webhooks",
            value: `${data.webhooks.length} / ${data.counts.webhookLimit}`,
            status: data.webhooks.length > 0 ? "Active" : undefined,
            tone: "success",
          },
          {
            icon: Check,
            label: "API Access",
            value: form.draft.api_access_enabled ? "Enabled" : "Disabled",
            tone: form.draft.api_access_enabled ? "success" : "danger",
          },
          {
            icon: BarChart3,
            label: "Rate limit",
            value: `${form.draft.rate_limit_per_min.toLocaleString("en-IN")} req / min`,
          },
        ]}
      >
        <PromptCard
          title="Build without limits"
          body="Integrate ChatPilott with your favorite apps and services using our powerful API and real-time webhooks."
          cta="Explore Developer Docs"
          href="/help"
        />
        <NeedHelpCard topic="API access and webhooks" />
      </SummaryRail>
    </>
  );
}

// ------------------------------------------------------------------

/** The bottom-of-card link shared by the keys group and the webhooks card. */
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mt-3 flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-card text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink"
    >
      {children}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

function MintedKeyBanner({
  value,
  onDismiss,
}: {
  value: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="mt-3 mb-3 rounded-xl border border-brand/25 bg-warning-bg p-3">
      <p className="text-[12px] font-medium text-warning-text">
        Copy this key now — it won&apos;t be shown again.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="wz-font-mono min-w-0 flex-1 truncate rounded-lg bg-surface-card px-2.5 py-2 text-[12px] text-ink">
          {value}
        </code>
        <GhostButton
          className="h-9 px-3"
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
          }}
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </GhostButton>
        <GhostButton className="h-9 px-3" onClick={onDismiss}>
          Done
        </GhostButton>
      </div>
    </div>
  );
}

function CreateKeyForm({ onDone }: { onDone: (key: string) => void }) {
  const [name, setName] = React.useState("");
  const [scope, setScope] = React.useState<ApiKey["scope"]>("read_only");
  const [busy, setBusy] = React.useState(false);

  return (
    <div className="mt-3 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border-default bg-surface-app p-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Key name, e.g. Production"
        aria-label="API key name"
        className="h-9 min-w-[160px] flex-1 rounded-lg border border-border-default bg-surface-card px-3 text-[13px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand"
      />
      <div className="flex overflow-hidden rounded-lg border border-border-default">
        {(["read_only", "full_access"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`h-9 px-3 text-[12px] font-medium transition-colors duration-100 [transition-timing-function:var(--ease-standard)] ${
              scope === s
                ? "bg-selected-bg text-brand"
                : "bg-surface-card text-ink-tertiary hover:bg-hover-bg"
            }`}
          >
            {SCOPE_LABEL[s]}
          </button>
        ))}
      </div>
      <PrimaryButton
        disabled={busy || name.trim() === ""}
        onClick={async () => {
          setBusy(true);
          try {
            const result = await createApiKey({ name, scope });
            if (result.ok) onDone(result.data.key);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Plus className="size-4" aria-hidden />
        {busy ? "Creating…" : "Create"}
      </PrimaryButton>
    </div>
  );
}

function KeyRow({ apiKey }: { apiKey: ApiKey }) {
  const { pending, run } = useAction();

  return (
    <ListRow>
      <Monogram text={apiKey.prefix.slice(-2).toUpperCase()} tone="amber" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">
          {apiKey.name}
        </p>
        <p className="wz-font-mono truncate text-[11px] text-ink-tertiary">
          {maskKey(apiKey)} · created {formatDate(apiKey.created_at)}
        </p>
      </div>
      <Chip tone="success">Active</Chip>
      <Chip tone={apiKey.scope === "full_access" ? "brand" : "neutral"}>
        {SCOPE_LABEL[apiKey.scope]}
      </Chip>
      <button
        type="button"
        aria-label={`Revoke ${apiKey.name}`}
        disabled={pending}
        onClick={() =>
          run(() => revokeApiKey(apiKey.id), { success: "API key revoked." })
        }
        className="rounded-lg p-1.5 text-ink-muted transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-danger-bg hover:text-danger disabled:pointer-events-none disabled:opacity-30"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </ListRow>
  );
}

function CreateWebhookForm({ onDone }: { onDone: () => void }) {
  const { pending, run } = useAction();
  const [url, setUrl] = React.useState("");
  const [events, setEvents] = React.useState<string[]>(["lead.created"]);

  return (
    <div className="mb-3 space-y-2 rounded-xl border border-border-default bg-surface-app p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/hooks/chatpilott"
          aria-label="Webhook URL"
          className="h-9 min-w-[200px] flex-1 rounded-lg border border-border-default bg-surface-card px-3 text-[13px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand"
        />
        <PrimaryButton
          disabled={pending || url.trim() === "" || events.length === 0}
          onClick={() =>
            run(() => createWebhook({ url, events }), {
              success: "Webhook added.",
              onSuccess: () => {
                setUrl("");
                onDone();
              },
            })
          }
        >
          <Plus className="size-4" aria-hidden />
          {pending ? "Adding…" : "Add"}
        </PrimaryButton>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {WEBHOOK_EVENT_OPTIONS.map((event) => {
          const on = events.includes(event.value);
          return (
            <button
              key={event.value}
              type="button"
              aria-pressed={on}
              onClick={() =>
                setEvents((prev) =>
                  on
                    ? prev.filter((e) => e !== event.value)
                    : [...prev, event.value],
                )
              }
              className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[11px] font-medium transition-colors duration-100 [transition-timing-function:var(--ease-standard)] ${
                on
                  ? "border-brand/30 bg-selected-bg text-brand"
                  : "border-border-default bg-surface-card text-ink-tertiary hover:bg-hover-bg"
              }`}
            >
              {event.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WebhookRow({ hook }: { hook: WebhookEndpoint }) {
  const { pending, run } = useAction();

  return (
    <ListRow>
      <Monogram text="WH" tone="running" />
      <div className="min-w-0 flex-1">
        <p className="wz-font-mono truncate text-[12px] text-ink">{hook.url}</p>
        <p className="truncate text-[11px] text-ink-tertiary">
          {hook.events
            .map(
              (e) =>
                WEBHOOK_EVENT_OPTIONS.find((o) => o.value === e)?.label ?? e,
            )
            .join(", ")}{" "}
          · {formatDateTime(hook.last_triggered_at)}
        </p>
      </div>
      <Chip
        tone={
          hook.status === "failing"
            ? "danger"
            : hook.status === "paused"
              ? "neutral"
              : "success"
        }
      >
        {hook.status === "failing"
          ? "Failing"
          : hook.status === "paused"
            ? "Paused"
            : "Active"}
      </Chip>
      <GhostButton
        className="h-8 px-3 text-[12px]"
        disabled={pending}
        onClick={() =>
          run(
            async () => {
              const result = await testWebhook(hook.id);
              return result.ok
                ? { ok: true as const }
                : { ok: false as const, error: result.error };
            },
            { success: "Test event delivered." },
          )
        }
      >
        Test
      </GhostButton>
      <button
        type="button"
        aria-label={`Delete webhook ${hook.url}`}
        disabled={pending}
        onClick={() =>
          run(() => deleteWebhook(hook.id), { success: "Webhook deleted." })
        }
        className="rounded-lg p-1.5 text-ink-muted transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-danger-bg hover:text-danger disabled:pointer-events-none disabled:opacity-30"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </ListRow>
  );
}
