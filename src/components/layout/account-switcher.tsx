"use client";

// Topbar account switcher (spec §4). Lists the user's connected IG accounts.
// One account → static label, no dropdown. Multiple → a real dropdown.
// Switching is presentational for now; the dashboard reads all accounts.

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ShellAccount } from "./types";

function Avatar({ username }: { username: string }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-[11px] font-medium text-white">
      {username?.[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

export function AccountSwitcher({ accounts }: { accounts: ShellAccount[] }) {
  const [selectedId, setSelectedId] = useState(accounts[0]?.id);
  const selected = accounts.find((a) => a.id === selectedId) ?? accounts[0];

  if (accounts.length === 0) {
    return (
      <span className="text-sm text-[var(--wz-text-muted)]">
        No account connected
      </span>
    );
  }

  if (accounts.length === 1) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-[var(--wz-text)]">
        <Avatar username={selected.ig_username} />
        <span>@{selected.ig_username}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-[var(--wz-text)] outline-none hover:bg-[var(--wz-surface)] focus-visible:ring-2 focus-visible:ring-[var(--wz-accent)]">
        <Avatar username={selected.ig_username} />
        <span>@{selected.ig_username}</span>
        <ChevronDown className="size-4 text-[var(--wz-text-muted)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onSelect={() => setSelectedId(account.id)}
            className="gap-2"
          >
            <Avatar username={account.ig_username} />
            @{account.ig_username}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
