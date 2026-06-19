"use client";

// The app shell (spec §4): sticky sidebar + topbar that every app page lives
// inside. Below 1024px the sidebar collapses into a focus-trapped drawer.
// Stripe-light surface — no dark plate here (spec §2).

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { planLabel } from "@/lib/dashboard";
import { NAV_GROUPS, resolveHref } from "./nav";
import { AccountSwitcher } from "./account-switcher";
import { UserMenu } from "./user-menu";
import type { ShellAccount, ShellUser } from "./types";

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
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.heading}>
          <div className="mb-1 flex items-center gap-2 px-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--wz-text-muted)]">
              {group.heading}
            </span>
            {group.pro && (
              <span className="wz-font-mono rounded bg-[var(--wz-surface)] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[var(--wz-text-muted)]">
                Pro
              </span>
            )}
          </div>
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
                      "flex min-h-[40px] items-center gap-3 rounded-md border-l-2 px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wz-accent)]",
                      active
                        ? "border-[var(--wz-accent)] bg-[var(--wz-accent)]/8 font-semibold text-[var(--wz-text)]"
                        : "border-transparent text-[var(--wz-text-muted)] hover:bg-[var(--wz-surface)] hover:text-[var(--wz-text)]",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
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

function ProfileChip({ user }: { user: ShellUser }) {
  return (
    <div className="flex items-center gap-3 border-t border-[var(--wz-border)] px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-medium text-white">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          (user.name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--wz-text)]">
          {user.name}
        </div>
      </div>
      <span className="wz-font-mono rounded bg-[var(--wz-surface)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--wz-text-muted)]">
        {planLabel(user.plan)}
      </span>
    </div>
  );
}

function Brand() {
  return (
    <Link
      href="/dashboard"
      className="flex h-14 shrink-0 items-center gap-2 px-5 text-[var(--wz-text)]"
    >
      <span className="flex size-6 items-center justify-center rounded-md bg-[var(--wz-accent)] text-xs font-bold text-white">
        A
      </span>
      <span className="text-[15px] font-semibold tracking-tight">AutoDM</span>
    </Link>
  );
}

export function AppShell({
  user,
  accounts,
  children,
}: {
  user: ShellUser;
  accounts: ShellAccount[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Esc to close + focus trap while the drawer is open (spec §12).
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
    <div className="wz-font-ui min-h-[100dvh] bg-[var(--wz-bg-alt)] text-[var(--wz-text)]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-[var(--wz-border)] bg-[var(--wz-bg)] lg:flex">
        <Brand />
        <SidebarNav plan={user.plan} pathname={pathname} />
        <ProfileChip user={user} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDrawer}
            aria-hidden
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="wz-animate-sheet absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-[var(--wz-border)] bg-[var(--wz-bg)]"
          >
            <div className="flex h-14 items-center justify-between pr-2">
              <Brand />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeDrawer}
                aria-label="Close navigation"
                className="flex size-9 items-center justify-center rounded-md text-[var(--wz-text-muted)] hover:bg-[var(--wz-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wz-accent)]"
              >
                <X className="size-5" />
              </button>
            </div>
            {accounts.length > 1 && (
              <div className="border-y border-[var(--wz-border)] px-4 py-3">
                <AccountSwitcher accounts={accounts} />
              </div>
            )}
            <SidebarNav
              plan={user.plan}
              pathname={pathname}
              onNavigate={closeDrawer}
            />
            <ProfileChip user={user} />
          </div>
        </div>
      )}

      {/* Topbar + main */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[var(--wz-border)] bg-[var(--wz-bg)]/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-[var(--wz-bg)]/80 sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="flex size-9 items-center justify-center rounded-md text-[var(--wz-text-muted)] hover:bg-[var(--wz-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wz-accent)] lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <div className="hidden lg:block">
            <AccountSwitcher accounts={accounts} />
          </div>

          <div className="flex-1" />
          <UserMenu user={user} />
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
