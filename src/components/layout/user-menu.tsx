"use client";

// Topbar user menu (spec §4): avatar → Settings, Billing, Sign out.
// HALO-tokened surface — warm card, warm hover, HALO danger for Sign out —
// so the menu matches the rest of the app instead of shadcn's grey defaults.

import Link from "next/link";
import { CreditCard, LogOut, Settings } from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ShellUser } from "./types";

export function UserMenu({
  user,
  /** Replaces the bare avatar — the sidebar passes a whole profile row. */
  trigger,
  align = "end",
  side,
}: {
  user: ShellUser;
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        // `asChild` would fight the custom trigger's own layout, so the
        // trigger stays a button and simply renders whatever it's handed.
        className={
          trigger
            ? "w-full rounded-lg focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset focus-visible:outline-none"
            : "flex size-8 items-center justify-center rounded-full bg-[var(--wz-accent)] text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
        }
      >
        {trigger ??
          (user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="size-full rounded-full object-cover"
            />
          ) : (
            (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
          ))}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        className="wz-font-ui min-w-56 rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-[var(--wz-bg)] p-1.5 text-[var(--wz-text)] shadow-floating ring-0"
      >
        <DropdownMenuLabel className="flex flex-col px-2 py-1.5">
          <span className="text-sm font-medium text-[var(--wz-text)]">
            {user.name}
          </span>
          <span className="truncate text-xs font-normal text-[var(--wz-text-muted)]">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[var(--wz-border)]" />
        <DropdownMenuItem
          asChild
          className="rounded-md px-2 py-1.5 text-[var(--wz-text)] focus:bg-[var(--wz-surface)] focus:text-[var(--wz-text)]"
        >
          <Link href="/settings">
            <Settings className="size-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="rounded-md px-2 py-1.5 text-[var(--wz-text)] focus:bg-[var(--wz-surface)] focus:text-[var(--wz-text)]"
        >
          <Link href="/billing">
            <CreditCard className="size-4" /> Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[var(--wz-border)]" />
        <DropdownMenuItem
          asChild
          variant="destructive"
          className="rounded-md px-2 py-1.5 data-[variant=destructive]:text-[var(--wz-accent-pop)] data-[variant=destructive]:focus:bg-[var(--wz-accent-pop)]/10 data-[variant=destructive]:focus:text-[var(--wz-accent-pop)]"
        >
          <form action={signOut}>
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
