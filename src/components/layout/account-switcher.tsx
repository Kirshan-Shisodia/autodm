"use client";

// Sidebar account switcher. Lists the user's connected IG accounts and names
// the plan underneath, so the two facts that scope everything else on screen
// — which account, which tier — sit together at the top of the chrome.
//
// One account → a static chip, no affordance to press. Multiple → a dropdown.
// Switching is presentational for now: every screen reads all accounts.

import { useState } from "react";
import { ChevronsUpDown, AtSign } from "lucide-react";

import { cn } from "@/lib/utils";
import { planLabel } from "@/lib/dashboard";
import { PlatformIcon } from "@/components/accounts/platform-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ShellAccount, ShellUser } from "./types";

const CHIP =
  "flex w-full items-center gap-2.5 rounded-lg border border-border-default bg-surface-card px-2.5 py-2 text-left";

// The one shared brand mark, so the sidebar and the Accounts screen can't
// drift. lucide-react v1 dropped its brand icons, hence the local SVG.
function Glyph() {
  return <PlatformIcon platform="instagram" size="sm" />;
}

function Label({
  username,
  plan,
}: {
  username: string;
  plan: ShellUser["plan"];
}) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[13px] font-medium text-ink">
        @{username}
      </span>
      <span className="block truncate text-[11px] text-brand">
        {planLabel(plan)} Plan
      </span>
    </span>
  );
}

export function AccountSwitcher({
  accounts,
  plan,
  className,
}: {
  accounts: ShellAccount[];
  plan: ShellUser["plan"];
  className?: string;
}) {
  const [selectedId, setSelectedId] = useState(accounts[0]?.id);
  const selected = accounts.find((a) => a.id === selectedId) ?? accounts[0];

  if (accounts.length === 0) {
    return (
      <div className={cn(CHIP, "border-dashed", className)}>
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-ink-muted"
          aria-hidden
        >
          <AtSign className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-ink-tertiary">
            No account
          </span>
          <span className="block truncate text-[11px] text-ink-muted">
            {planLabel(plan)} Plan
          </span>
        </span>
      </div>
    );
  }

  if (accounts.length === 1) {
    return (
      <div className={cn(CHIP, className)}>
        <Glyph />
        <Label username={selected.ig_username} plan={plan} />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          CHIP,
          "transition-colors duration-100 [transition-timing-function:var(--ease-standard)] outline-none hover:bg-hover-bg focus-visible:ring-2 focus-visible:ring-brand",
          className,
        )}
      >
        <Glyph />
        <Label username={selected.ig_username} plan={plan} />
        <ChevronsUpDown className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
      </DropdownMenuTrigger>
      {/* Width already tracks the trigger via the shared content styles. */}
      <DropdownMenuContent align="start">
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onSelect={() => setSelectedId(account.id)}
            className="gap-2.5 text-[13px]"
          >
            <Glyph />@{account.ig_username}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
