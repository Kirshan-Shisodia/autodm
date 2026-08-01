// Accounts. Lives inside the (app) shell so it gets the sidebar and topbar;
// auth is already enforced by that layout. Everything on screen is derived in
// lib/accounts.ts — this file only fetches and arranges.

import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleHelp, Plug } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/dashboard";
import {
  accountStats,
  expiryCalendar,
  healthChecks,
  healthPercent,
  integrationUsage,
  toConnections,
  type AccountRow,
} from "@/lib/accounts";
import { ConnectButton } from "@/components/accounts/connect-button";
import { ConnectionsTable } from "@/components/accounts/connections-table";
import { AccountStatCards } from "@/components/accounts/stat-cards";
import { HealthOverview } from "@/components/accounts/health-overview";
import { ExpiryCalendar } from "@/components/accounts/expiry-calendar";
import { IntegrationUsage } from "@/components/accounts/integration-usage";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Connection failed a security check. Please try again.",
  session_lost:
    "Your session expired during connection. Please log in and try again.",
  token_exchange_failed: "Facebook rejected the connection. Please try again.",
  long_token_failed: "Facebook rejected the connection. Please try again.",
  no_pages:
    "No Facebook Page found. Instagram Business accounts must be linked to a Facebook Page.",
  account_save_failed: "We couldn't save your account. Please try again.",
  config_missing: "Server configuration error. Please contact support.",
  unexpected: "Something went wrong. Please try again.",
};

const SELECT =
  "id, ig_username, fb_page_id, fb_page_name, token_expires_at, is_active, webhook_subscribed, last_webhook_at, scopes, created_at, disconnected_at";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string; view?: string }>;
}) {
  const { connected, error, view } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase
      .from("instagram_accounts")
      .select(SELECT)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("users").select("plan").eq("id", user.id).single(),
  ]);

  const all = (rows ?? []) as AccountRow[];
  const active = all.filter((r) => r.is_active);
  const archived = all.filter((r) => !r.is_active);
  const showArchived = view === "archived";

  const plan = (profile?.plan ?? "free") as Plan;
  // The table shows one slice; the summary panels always describe everything.
  const connections = toConnections(showArchived ? archived : active, plan);
  const allConnections = toConnections(all, plan);
  const usage = integrationUsage(active);
  const stats = accountStats(allConnections, usage);
  const checks = healthChecks(active, usage);

  return (
    <div className="space-y-5">
      {/* ---------------- Page header ---------------- */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.4px] text-ink max-sm:text-[22px]">
            Accounts
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">
            Manage all your connected social accounts and integrations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ConnectButton />
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-lg border-border-default bg-surface-card text-[13px] text-ink-secondary hover:bg-hover-bg"
          >
            <Link href="/help">
              <CircleHelp className="size-4 text-ink-muted" />
              Help
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Banner tone="error">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unexpected}
        </Banner>
      )}
      {connected === "true" && (
        <Banner tone="success">Instagram account connected successfully.</Banner>
      )}
      {connected === "none" && (
        <Banner tone="warning">
          We connected to Facebook but found no Instagram Business account. Link
          your Instagram account to a Facebook Page, then try again.
        </Banner>
      )}

      {/* ---------------- Stats strip ---------------- */}
      <AccountStatCards stats={stats} />

      {showArchived && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-muted px-4 py-3">
          <p className="text-[13px] text-ink-secondary">
            Showing archived accounts — these are disconnected and run no
            automations.
          </p>
          <Link
            href="/accounts"
            className="shrink-0 text-[12px] font-medium text-brand hover:text-brand-hover"
          >
            Back to active
          </Link>
        </div>
      )}

      {/* ---------------- Connections ---------------- */}
      {connections.length === 0 ? (
        <EmptyState
          archived={showArchived}
          archivedCount={showArchived ? 0 : archived.length}
        />
      ) : (
        <ConnectionsTable
          connections={connections}
          archivedCount={showArchived ? 0 : archived.length}
        />
      )}

      {/* ---------------- Health + expiry ---------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HealthOverview percent={healthPercent(checks)} checks={checks} />
        <ExpiryCalendar items={expiryCalendar(allConnections)} />
      </div>

      {/* ---------------- Integration usage ---------------- */}
      <IntegrationUsage rows={usage} />
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "success" | "error" | "warning";
  children: React.ReactNode;
}) {
  const styles = {
    success: "border-success/25 bg-success-bg text-success",
    error: "border-danger/25 bg-danger-bg text-danger",
    warning: "border-brand/25 bg-warning-bg text-warning-text",
  }[tone];

  return (
    <div className={`rounded-xl border px-4 py-3 text-[13px] ${styles}`}>
      {children}
    </div>
  );
}

// An invitation with a CTA, not an apology.
function EmptyState({
  archived,
  archivedCount,
}: {
  archived: boolean;
  archivedCount: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-surface-card px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-brand">
        <Plug className="size-6" aria-hidden />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-ink">
        {archived ? "Nothing archived" : "No accounts connected yet"}
      </h2>
      <p className="mt-1 max-w-sm text-[13px] text-ink-tertiary">
        {archived
          ? "Accounts you disconnect will show up here."
          : "Connect an Instagram Business account to start automating DMs."}
      </p>
      {!archived && <ConnectButton className="mt-6" />}
      {archivedCount > 0 && (
        <Link
          href="/accounts?view=archived"
          className="mt-4 text-[12px] font-medium text-ink-tertiary transition-colors hover:text-brand"
        >
          View archived accounts ({archivedCount})
        </Link>
      )}
    </div>
  );
}
