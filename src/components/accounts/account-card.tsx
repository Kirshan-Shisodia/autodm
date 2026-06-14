"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DisconnectDialog } from "./disconnect-dialog";

type Account = {
  id: string;
  ig_username: string;
  fb_page_name: string | null;
  is_active: boolean;
  token_expires_at: string | null;
  last_webhook_at: string | null;
  created_at: string;
};

const DAY_MS = 86_400_000;

function statusOf(account: Account): {
  label: string;
  tone: "green" | "amber" | "red";
} {
  if (!account.is_active) return { label: "Disconnected", tone: "red" };
  if (!account.token_expires_at) return { label: "Healthy", tone: "green" };

  const days = Math.floor(
    (new Date(account.token_expires_at).getTime() - Date.now()) / DAY_MS,
  );
  if (days < 0) return { label: "Token expired — reconnect", tone: "red" };
  if (days <= 7) {
    return {
      label: `Token expiring in ${days} day${days === 1 ? "" : "s"}`,
      tone: "amber",
    };
  }
  return { label: "Healthy", tone: "green" };
}

export function AccountCard({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const status = statusOf(account);
  const dot = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  }[status.tone];

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-medium text-white">
        {account.ig_username?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="flex-1">
        <div className="font-medium">@{account.ig_username}</div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {account.fb_page_name && <span>{account.fb_page_name} ·</span>}
          <span className={cn("inline-block h-2 w-2 rounded-full", dot)} />
          <span>{status.label}</span>
        </div>
      </div>
      {status.tone === "red" ? (
        <Button asChild variant="outline" size="sm">
          <a href="/api/auth/instagram/start">Reconnect</a>
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Disconnect
        </Button>
      )}
      <DisconnectDialog open={open} onOpenChange={setOpen} account={account} />
    </div>
  );
}
