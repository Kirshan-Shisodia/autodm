"use client";

// The signature element (spec §4 + §7.7): a live Instagram-DM phone mockup that
// renders the creator's message exactly as the follower receives it — link chip
// and all. When the message changes it "types": a three-dot indicator pulses,
// then the bubble reveals and the "1.4s after the comment" timestamp fades in.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link as LinkIcon } from "lucide-react";

import { LINK_PLACEHOLDER } from "@/lib/automations/wizard";

function MessageBody({ text }: { text: string }) {
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

function TypingDots() {
  return (
    <span className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-[#a8a8a8]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
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
  const reduce = useReducedMotion();
  const trimmed = message.trim();
  const [shown, setShown] = useState(message);
  const [typing, setTyping] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    if (reduce || message.trim().length === 0) {
      // No typing animation — reveal immediately (next tick keeps setState out
      // of the effect body).
      const t = setTimeout(() => {
        setTyping(false);
        setShown(message);
      }, 0);
      timers.current = [t];
      return () => timers.current.forEach(clearTimeout);
    }
    // Debounce 400ms → pulse the typing indicator → reveal the message.
    const t1 = setTimeout(() => setTyping(true), 400);
    const t2 = setTimeout(() => {
      setTyping(false);
      setShown(message);
    }, 900);
    timers.current = [t1, t2];
    return () => timers.current.forEach(clearTimeout);
  }, [message, reduce]);

  const showPlaceholder = trimmed.length === 0;
  const revealed = !typing && !showPlaceholder;

  return (
    <div className="mx-auto flex w-full max-w-[210px] flex-col items-center lg:h-full lg:max-w-none">
      <div className="relative aspect-[9/19] w-[170px] overflow-hidden rounded-[2.25rem] border-[6px] border-[#1a1820] bg-[#1a1820] shadow-[var(--shadow-modal,0_16px_48px_-8px_rgba(26,24,32,0.16))] sm:w-[210px] lg:w-auto lg:min-h-0 lg:max-h-[520px] lg:flex-1">
        <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-[#1a1820]" />

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
                    ? "bg-[#efefef] italic text-[#a8a8a8]"
                    : "bg-[#efefef] text-[#262626]"
                }`}
              >
                {showPlaceholder ? (
                  "Your message preview will appear here…"
                ) : typing ? (
                  <TypingDots />
                ) : (
                  <span className="whitespace-pre-wrap wrap-break-word">
                    <MessageBody text={shown} />
                  </span>
                )}
              </div>
            </div>

            {/* explicit link chip, revealed last */}
            <AnimatePresence>
              {hasLink && revealed && (
                <motion.div
                  className="flex justify-start"
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  <span className="flex max-w-[80%] items-center gap-2 rounded-2xl rounded-bl-md border border-[#dbdbdb] bg-white px-3 py-2 text-left">
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
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* timestamp fades in after reveal */}
            <AnimatePresence>
              {revealed && (
                <motion.p
                  className="text-center text-[10px] text-[#c7c7c7]"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.15 }}
                >
                  1.4s after the comment
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* input bar (decorative) */}
          <div className="border-t border-[#dbdbdb] px-3 py-2">
            <div className="h-7 rounded-full bg-[#efefef]" />
          </div>
        </div>
      </div>
      <p className="mt-3 shrink-0 text-center font-mono text-[11px] text-ink-muted">
        Live preview · exactly what your follower receives
      </p>
    </div>
  );
}
