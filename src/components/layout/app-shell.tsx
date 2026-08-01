"use client";

// The app shell: a single sticky sidebar that every app page lives inside.
// Below 1024px it collapses into a focus-trapped drawer, with a slim bar that
// exists only to hold the hamburger.
//
// There is deliberately no desktop topbar. The account switcher, the plan
// meter and the profile menu all live in the sidebar, which leaves the whole
// width of the viewport to the page — and lets each page own its own header
// (title, date range, primary action) instead of splitting those controls
// across two pieces of chrome.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsUpDown, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_GROUPS, resolveHref } from "./nav";
import { AccountSwitcher } from "./account-switcher";
import { PlanUsage } from "./plan-usage";
import { UserMenu } from "./user-menu";
import type { ShellAccount, ShellUsage, ShellUser } from "./types";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({
  plan,
  pathname,
  onNavigate,
}: {
  plan: ShellUser["plan"];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.heading}>
          <h3
            className={cn(
              "mb-1.5 px-3 text-[10px] font-semibold tracking-[0.09em] uppercase",
              group.pro ? "text-brand" : "text-ink-muted",
            )}
          >
            {group.heading}
          </h3>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = resolveHref(item, plan);
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] transition-colors duration-100 [transition-timing-function:var(--ease-standard)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset focus-visible:outline-none",
                      active
                        ? "bg-selected-bg font-medium text-brand"
                        : "font-medium text-ink-secondary hover:bg-hover-bg hover:text-ink",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[17px] shrink-0",
                        active ? "text-brand" : "text-ink-muted",
                      )}
                    />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-warning-bg px-1.5 py-0.5 text-[10px] font-medium text-warning-text">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Avatar({ user }: { user: ShellUser }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-action text-[13px] font-medium text-ink-inverse">
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
      )}
    </span>
  );
}

/**
 * The profile row at the foot of the sidebar. The whole row is the menu
 * trigger rather than just the avatar — at 240px wide there's no reason to
 * make people aim at a 32px circle.
 */
function ProfileRow({ user }: { user: ShellUser }) {
  return (
    <div className="border-t border-border-default p-2">
      <UserMenu
        user={user}
        align="start"
        side="top"
        trigger={
          <span className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg">
            <Avatar user={user} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">
                {user.name}
              </span>
              <span className="block truncate text-[11px] text-ink-muted">
                {user.email}
              </span>
            </span>
            <ChevronsUpDown
              className="size-3.5 shrink-0 text-ink-muted"
              aria-hidden
            />
          </span>
        }
      />
    </div>
  );
}

function Brand() {
  return (
    <Link
      href="/dashboard"
      aria-label="ChatPilott dashboard"
      className="flex h-14 shrink-0 items-center px-4 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset focus-visible:outline-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/chatpilott-logo.svg"
        alt="ChatPilott"
        width={170}
        height={40}
        className="h-10 w-auto"
      />
    </Link>
  );
}

function SidebarBody({
  user,
  accounts,
  usage,
  pathname,
  onNavigate,
}: {
  user: ShellUser;
  accounts: ShellAccount[];
  usage: ShellUsage;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="px-3 pb-3">
        <AccountSwitcher accounts={accounts} plan={user.plan} />
      </div>
      <SidebarNav plan={user.plan} pathname={pathname} onNavigate={onNavigate} />
      <PlanUsage usage={usage} plan={user.plan} />
      <ProfileRow user={user} />
    </>
  );
}

export function AppShell({
  user,
  accounts,
  usage,
  children,
}: {
  user: ShellUser;
  accounts: ShellAccount[];
  usage: ShellUsage;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Esc to close + focus trap while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDrawer();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  return (
    <div className="wz-font-ui min-h-[100dvh] bg-surface-app text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-chrome-border bg-surface-card lg:flex">
        <Brand />
        <SidebarBody
          user={user}
          accounts={accounts}
          usage={usage}
          pathname={pathname}
        />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[rgba(35,33,42,0.4)]"
            onClick={closeDrawer}
            aria-hidden
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="wz-animate-sheet absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-chrome-border bg-surface-card"
          >
            <div className="flex h-14 items-center justify-between pr-2">
              <Brand />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeDrawer}
                aria-label="Close navigation"
                className="flex size-9 items-center justify-center rounded-md text-ink-tertiary hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarBody
              user={user}
              accounts={accounts}
              usage={usage}
              pathname={pathname}
              onNavigate={closeDrawer}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        {/* Mobile-only bar. It exists to hold the hamburger; on desktop the
            sidebar covers everything it would otherwise carry. */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-chrome-border bg-surface-card/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface-card/75 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="flex size-9 items-center justify-center rounded-md text-ink-tertiary hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex-1" />
          <UserMenu user={user} />
        </header>

        <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
