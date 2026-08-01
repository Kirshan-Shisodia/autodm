"use client";

// Share panel: the link, the channels, the code. The two copy affordances are
// the whole point of the screen, so they confirm in place (label swaps to
// "Copied", announced politely) rather than firing a toast the user has to
// chase. Channel buttons are plain anchors — they work with JS disabled and
// with middle-click.

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, Mail, Tag } from "lucide-react";

import { cn } from "@/lib/utils";
import { shareUrl, type ShareChannel } from "@/lib/referrals";

/** Brand glyphs. lucide has no wordmarks, so these are minimal inline paths. */
const CHANNELS: {
  id: ShareChannel;
  label: string;
  tile: string;
  glyph: React.ReactNode;
}[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    tile: "bg-[#25D366] text-white",
    glyph: (
      <path d="M12.04 2A9.9 9.9 0 0 0 2.1 11.9c0 1.75.46 3.46 1.34 4.97L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01A9.9 9.9 0 0 0 22 11.94 9.9 9.9 0 0 0 12.04 2Zm5.8 14.06c-.24.68-1.42 1.31-1.96 1.35-.5.04-.98.22-3.3-.69-2.79-1.1-4.55-3.95-4.69-4.13-.13-.18-1.11-1.48-1.11-2.82 0-1.35.7-2 .95-2.28.25-.27.55-.34.73-.34h.52c.17 0 .4-.06.62.48.24.57.8 1.97.87 2.11.07.14.12.3.02.48-.09.18-.14.29-.28.45l-.42.48c-.14.14-.28.3-.12.58.16.27.71 1.17 1.53 1.9 1.05.93 1.94 1.22 2.21 1.36.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.22.6-.13.25.09 1.57.74 1.84.87.27.14.45.2.52.32.07.11.07.65-.17 1.33Z" />
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    tile: "bg-[#1877F2] text-white",
    glyph: (
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" />
    ),
  },
  {
    id: "twitter",
    label: "Twitter",
    tile: "bg-[#0F1419] text-white",
    glyph: (
      <path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-6.08l-4.76-6.22L5.46 21H2.44l7.06-8.07L2.25 3h6.24l4.3 5.69L17.53 3Zm-1.06 16.17h1.67L7.6 4.74H5.81l10.66 14.43Z" />
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    tile: "bg-[#0A66C2] text-white",
    glyph: (
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.83v1.64h.05A4.2 4.2 0 0 1 17.65 8.7c4.04 0 4.79 2.53 4.79 5.82V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.19 1.45-2.19 2.96V21h-4V9Z" />
    ),
  },
];

/** One row of copy state, reset on a timer so the tick doesn't stick forever. */
function useCopy(): [string | null, (id: string, value: string) => void] {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback((id: string, value: string) => {
    void navigator.clipboard?.writeText(value).then(() => {
      setCopied(id);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  return [copied, copy];
}

function CopyButton({
  copied,
  onClick,
  label,
}: {
  copied: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition-colors duration-100 [transition-timing-function:var(--ease-standard)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        copied
          ? "border-success/25 bg-success-bg text-success"
          : "border-border-default bg-surface-card text-ink-secondary hover:bg-hover-bg hover:text-ink",
      )}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}

/** Decorative parcel — HALO warm neutrals only, hidden from assistive tech. */
function GiftMotif() {
  return (
    <svg
      viewBox="0 0 200 150"
      className="h-32 w-48 shrink-0"
      aria-hidden
      focusable="false"
    >
      <g fill="none" stroke="#D7D0C5" strokeWidth="2" strokeLinecap="round">
        <path d="M46 40l-6-8M62 26l-2-10M78 40l7-8" />
        <path d="M150 96l6 7M164 78l9-3" />
      </g>
      <circle cx="152" cy="48" r="13" fill="#F0DFC3" />
      <text
        x="152"
        y="53"
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        fill="#A96B24"
      >
        ₹
      </text>
      <path d="M40 78h124v46a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6V78Z" fill="#EFE4D4" />
      <path d="M34 62h136v18H34z" fill="#E3D3BC" />
      <path d="M94 62h18v68H94z" fill="#D9C3A3" />
      <path
        d="M103 62c-10-2-18-6-18-13a8 8 0 0 1 16 0c0 7 8 11 18 13a8 8 0 0 0-16 0Z"
        fill="#D9C3A3"
      />
    </svg>
  );
}

export function ShareCard({ link, code }: { link: string; code: string }) {
  const [copied, copy] = useCopy();

  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <h2 className="text-[15px] font-semibold text-ink">
        Share Your Referral Link
      </h2>
      <p className="mt-1 text-[13px] text-ink-tertiary">
        Invite your friends and earn amazing rewards
      </p>

      <div className="mt-4 flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="min-w-0 flex-1">
          {/* ---- The link ---- */}
          <div className="flex items-center gap-3 rounded-lg border border-border-default bg-surface-muted px-3 py-2.5">
            <Link2 className="size-4 shrink-0 text-ink-muted" aria-hidden />
            <span className="wz-font-mono min-w-0 flex-1 truncate text-[13px] text-ink">
              {link}
            </span>
            <CopyButton
              copied={copied === "link"}
              onClick={() => copy("link", link)}
              label="Copy Link"
            />
          </div>

          {/* ---- Channels ---- */}
          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border-default" />
            <span className="text-[11px] text-ink-muted">or share via</span>
            <span className="h-px flex-1 bg-border-default" />
          </div>

          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {CHANNELS.map((channel) => (
              <li key={channel.id}>
                <a
                  href={shareUrl(channel.id, link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-card px-2 text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full",
                      channel.tile,
                    )}
                    aria-hidden
                  >
                    <svg viewBox="0 0 24 24" className="size-3" fill="currentColor">
                      {channel.glyph}
                    </svg>
                  </span>
                  {channel.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={shareUrl("email", link)}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-card px-2 text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
              >
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-ink-inverse"
                  aria-hidden
                >
                  <Mail className="size-3" />
                </span>
                Email
              </a>
            </li>
          </ul>

          {/* ---- The code ---- */}
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-border-default bg-surface-card px-3 py-2.5">
            <Tag className="size-4 shrink-0 text-ink-muted" aria-hidden />
            <span className="text-[13px] text-ink-tertiary">
              Your Referral Code
            </span>
            <span className="wz-font-mono min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
              {code}
            </span>
            <CopyButton
              copied={copied === "code"}
              onClick={() => copy("code", code)}
              label="Copy Code"
            />
          </div>
        </div>

        <div className="hidden shrink-0 justify-center xl:flex">
          <GiftMotif />
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {copied === "link"
          ? "Referral link copied to clipboard"
          : copied === "code"
            ? "Referral code copied to clipboard"
            : ""}
      </p>
    </section>
  );
}
