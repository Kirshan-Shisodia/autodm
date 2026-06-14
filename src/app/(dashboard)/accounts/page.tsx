import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ConnectButton } from "@/components/accounts/connect-button";
import { AccountCard } from "@/components/accounts/account-card";

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

function Banner({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    success: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
    error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
    info: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  }[tone];
  return (
    <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: accounts } = await supabase
    .from("instagram_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = accounts ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium">Connected Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Connect your Instagram Business account to start automating DMs.
          </p>
        </div>
        <ConnectButton />
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
        <Banner tone="info">
          We connected to Facebook but found no Instagram Business account.
          Link your Instagram account to a Facebook Page, then try again.
        </Banner>
      )}

      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm font-medium">No accounts connected yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Click “Connect Instagram Account” to get started.
            </p>
          </div>
        ) : (
          list.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))
        )}
      </div>
    </div>
  );
}
