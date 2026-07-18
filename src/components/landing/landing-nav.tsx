"use client";

// Sticky top nav (spec §4, §6). Transparent over the hero, then glass
// (surface.glass + 12px blur) once scrolled past 24px. Start free is visible in
// every viewport — it stays in the bar on mobile next to the hamburger.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Container, ctaPrimary } from "./primitives";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      aria-label="Main"
      className={cn(
        "sticky top-0 z-40 h-[72px] transition-colors",
        scrolled
          ? "border-b border-border-default/50 bg-white/60 backdrop-blur-[12px]"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-full items-center justify-between gap-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-[-0.4px] text-ink"
        >
          AutoDM<span className="text-brand">.</span>
        </Link>

        <nav
          aria-label="Sections"
          className="hidden items-center gap-8 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-ink-secondary transition-colors hover:text-ink sm:inline-flex"
          >
            Log in
          </Link>
          <Link href="/signup" className={ctaPrimary}>
            Start free
          </Link>

          {/* Mobile: anchors collapse into a dropdown sheet. */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Open menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app focus-visible:outline-none"
              >
                <Menu className="size-5" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-border-default bg-white shadow-[0_8px_24px_-4px_rgba(26,24,32,0.08)]"
              >
                {NAV_LINKS.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <a href={link.href} className="text-ink-secondary">
                      {link.label}
                    </a>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Link href="/login" className="text-ink-secondary">
                    Log in
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Container>
    </header>
  );
}
