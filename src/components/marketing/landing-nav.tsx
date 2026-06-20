"use client";

// Nav bar that sits transparent over the dark A24 hero (spec A3.1). It is part
// of the dark plate — not sticky — so its white text never collides with the
// Stripe-light sections below. Collapses to a hamburger under 768px (A6).

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "/login", label: "Login" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-20">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"
      >
        <Link
          href="/"
          className="wz-font-display text-xl font-semibold tracking-tight text-[var(--wz-text-dark)]"
        >
          AutoDM
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-[var(--wz-text-dark-muted)] transition-colors hover:text-[var(--wz-text-dark)]"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/signup"
            className="rounded-[var(--wz-r-button)] bg-[var(--wz-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--wz-accent-hover)]"
          >
            Get started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-[var(--wz-r-button)] text-[var(--wz-text-dark)] md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {/* Mobile panel */}
      {open && (
        <div className="md:hidden">
          <div className="mx-6 flex flex-col gap-1 rounded-[var(--wz-r-card)] border border-white/10 bg-[var(--wz-bg-dark-alt)] p-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-[var(--wz-r-button)] px-3 py-2.5 text-sm text-[var(--wz-text-dark-muted)] transition-colors hover:bg-white/5 hover:text-[var(--wz-text-dark)]"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-[var(--wz-r-button)] bg-[var(--wz-accent)] px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[var(--wz-accent-hover)]"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
