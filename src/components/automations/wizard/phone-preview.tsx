"use client";

// The signature element (spec §1.3): a live Instagram-DM phone mockup that
// renders the creator's message exactly as the follower will receive it —
// link chip and all — updating as they type.

import { Link as LinkIcon } from "lucide-react";

import { LINK_PLACEHOLDER } from "@/lib/automations/wizard";

function MessageBody({ text }: { text: string }) {
  // Split on the {LINK} placeholder so it can render as a tappable chip.
  const parts = text.split(LINK_PLACEHOLDER);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="font-medium text-[#3797f0] underline decoration-[#3797f0]/40 underline-offset-2">
              your-link.co/abc123
            </span>
          )}
        </span>
      ))}
    </>
  );
}

export function PhonePreview({
  username,
  message,
  hasLink,
}: {
  username: string;
  message: string;
  hasLink: boolean;
}) {
  const showPlaceholder = message.trim().length === 0;

  return (
    <div className="mx-auto w-full max-w-[300px]">
      {/* iPhone frame */}
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[2.25rem] border-[6px] border-black bg-black shadow-xl">
        {/* notch */}
        <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-black" />

        {/* screen */}
        <div className="flex h-full flex-col bg-white">
          {/* DM header */}
          <div className="flex items-center gap-2.5 border-b border-[#dbdbdb] px-3 pb-2 pt-7">
            <div className="size-7 rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#962fbf]" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#262626]">
                {username}
              </p>
              <p className="text-[11px] text-[#8e8e8e]">Instagram</p>
            </div>
          </div>

          {/* conversation */}
          <div className="flex flex-1 flex-col justify-end gap-2 px-3 py-3">
            <p className="text-center text-[10px] text-[#8e8e8e]">
              {username} sent you a message
            </p>
            <div className="flex justify-start">
              <div
                className={`max-w-[80%] rounded-2xl rounded-bl-md px-3 py-2 text-[13px] leading-snug ${
                  showPlaceholder
                    ? "bg-[#efefef] text-[#a8a8a8] italic"
                    : "bg-[#efefef] text-[#262626]"
                }`}
              >
                <span className="whitespace-pre-wrap break-words">
                  {showPlaceholder ? (
                    "Your message preview will appear here…"
                  ) : (
                    <MessageBody text={message} />
                  )}
                </span>
              </div>
            </div>

            {/* explicit link chip when {LINK} is present */}
            {hasLink && !showPlaceholder && (
              <div className="flex justify-start">
                <button
                  type="button"
                  tabIndex={-1}
                  className="flex max-w-[80%] items-center gap-2 rounded-2xl rounded-bl-md border border-[#dbdbdb] bg-white px-3 py-2 text-left"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#efefef]">
                    <LinkIcon className="size-3.5 text-[#3797f0]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-medium text-[#262626]">
                      Open link
                    </span>
                    <span className="block truncate text-[11px] text-[#8e8e8e]">
                      your-link.co
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* input bar (decorative) */}
          <div className="border-t border-[#dbdbdb] px-3 py-2">
            <div className="h-7 rounded-full bg-[#efefef]" />
          </div>
        </div>
      </div>
      <p className="wz-font-mono mt-3 text-center text-[11px] text-[var(--wz-text-muted)]">
        Live preview · exactly what your follower receives
      </p>
    </div>
  );
}
