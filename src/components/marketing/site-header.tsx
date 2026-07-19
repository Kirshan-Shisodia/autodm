"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CtaLink } from "@/components/marketing/cta-link";
import { NAV_LINKS, SIGNUP_HREF } from "@/components/marketing/nav";

function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="ChatPilott home"
      className={cn(
        "inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/chatpilott-logo.svg"
        alt="ChatPilott"
        width={120}
        height={28}
        className="h-7 w-auto"
      />
    </Link>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Subtle elevation once the hero scrolls under the nav (spec §14).
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-surface-glass backdrop-blur-[12px] transition-shadow duration-100",
        scrolled ? "border-chrome-border shadow-floating" : "border-transparent"
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 w-[min(96vw,1600px)] items-center justify-between px-[clamp(24px,6vw,96px)]"
      >
        <Wordmark />

        {/* Desktop links — anchor-scroll to section bands. */}
        <ul className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-sm text-[15px] text-ink-secondary transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* Bordered, no fill — reads as a button but stays secondary to the
              filled "Start free". Left of it, shown from sm up (below sm the
              mobile menu carries the Log in link). */}
          <CtaLink
            href="/login"
            variant="outline"
            size="md"
            className="hidden sm:inline-flex"
          >
            Log in
          </CtaLink>
          <CtaLink href={SIGNUP_HREF} size="md" className="hidden sm:inline-flex">
            Start free
          </CtaLink>

          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="inline-flex size-11 items-center justify-center rounded-lg text-ink transition-colors hover:bg-hover-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none lg:hidden"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-surface-canvas font-geist text-ink"
            >
              <SheetTitle className="px-6 pt-6 text-base font-semibold text-ink">
                Menu
              </SheetTitle>
              <ul className="mt-2 flex flex-col px-3">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-3 text-base text-ink-secondary transition-colors hover:bg-hover-bg hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2 p-6">
                <CtaLink
                  href={SIGNUP_HREF}
                  size="lg"
                  className="w-full"
                  onClick={() => setMenuOpen(false)}
                >
                  Start free
                </CtaLink>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="py-2 text-center text-[15px] text-ink-secondary transition-colors hover:text-ink"
                >
                  Log in
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
