"use client";

// FAQ accordion (spec A3.6). Stripe-light. The "Is this allowed by Instagram?"
// answer is written for Meta's reviewer as much as for the creator — honest,
// API-grounded, spam-free.

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is this allowed by Instagram?",
    a: "Yes. AutoDM uses Meta's official Instagram Graph API and the private-reply mechanism. It only sends a message in response to a user's own comment on your post or reel, and it respects Meta's messaging windows. It is not a mass-messaging or cold-DM tool — every reply is to someone who engaged with you first.",
  },
  {
    q: "Which Instagram accounts can I connect?",
    a: "Any Instagram Business or Creator account that's linked to a Facebook Page. You connect it once through Instagram's official login — AutoDM never sees or stores your password.",
  },
  {
    q: "Does it work on both posts and reels?",
    a: "Yes. Pick any post or reel, choose the keyword that triggers a reply, and AutoDM watches that media's comments for you.",
  },
  {
    q: "What does the follower receive?",
    a: "A normal Instagram direct message from your account — the exact text you wrote, including any link you set. They can reply right in their inbox, just like any other DM.",
  },
  {
    q: "Can I send the link someone asked for?",
    a: "That's the main use case. When a follower comments your keyword, AutoDM sends them the link you configured and tracks the click so you can see what's working.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--wz-border)]">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 py-5 text-left"
        >
          <span className="text-base font-medium text-[var(--wz-text)]">
            {q}
          </span>
          <ChevronDown
            className={`size-5 shrink-0 text-[var(--wz-text-muted)] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </h3>
      {open && (
        <p className="-mt-1 pb-5 pr-8 text-sm leading-relaxed text-[var(--wz-text-muted)]">
          {a}
        </p>
      )}
    </div>
  );
}

export function Faq() {
  return (
    <div className="mx-auto max-w-3xl">
      {FAQS.map((f) => (
        <FaqItem key={f.q} {...f} />
      ))}
    </div>
  );
}
