"use client";

// Lightweight emoji picker (spec §2.1 / §5 Step 4): a popover using
// --wz-shadow-pop. Kept dependency-free — a curated grid covers the common set.

import { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";

const EMOJIS = [
  "😀","😁","😂","🤣","😊","😍","🥰","😎","🤩","🙌",
  "👋","👍","🔥","✨","🎉","💯","❤️","🧡","💜","💙",
  "✅","👇","👀","💬","📩","📥","🔗","🎁","🛒","💸",
  "⚡","🚀","⭐","🏆","💡","📌","🙏","👏","💪","😉",
];

export function EmojiPopover({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Insert emoji"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-[var(--wz-r-button)] text-[var(--wz-text-muted)] hover:bg-[var(--wz-surface)] hover:text-[var(--wz-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wz-accent)]"
      >
        <Smile className="size-5" />
      </button>
      {open && (
        <div
          className="absolute bottom-full right-0 z-20 mb-2 w-[260px] rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-white p-2"
          style={{ boxShadow: "var(--wz-shadow-pop)" }}
          role="menu"
        >
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onPick(e);
                  setOpen(false);
                }}
                className="flex size-7 items-center justify-center rounded text-lg hover:bg-[var(--wz-surface)]"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
