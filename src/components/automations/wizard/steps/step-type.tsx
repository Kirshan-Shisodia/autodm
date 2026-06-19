"use client";

// Step 1 — Choose type (spec §5). Grid of 6 radio cards; only Post and Reel
// are selectable in the MVP. The single A24-red "Pro" tag appears once.

import {
  Image as ImageIcon,
  Film,
  MessageCircle,
  AtSign,
  Megaphone,
  Inbox,
  Check,
} from "lucide-react";

import {
  TYPE_CARDS,
  type AutomationType,
  type WizardState,
} from "@/lib/automations/wizard";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  post: ImageIcon,
  reel: Film,
  story_reply: MessageCircle,
  story_mention: AtSign,
  facebook_post: Megaphone,
  inbox: Inbox,
};

export function StepType({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  // The "Pro" tag is rendered at most once per viewport (A24 single-label rule):
  // on the first disabled card only.
  const firstDisabledType = TYPE_CARDS.find((c) => !c.enabled)?.type;

  return (
    <fieldset>
      <legend className="sr-only">Choose an automation type</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TYPE_CARDS.map((card) => {
          const Icon = ICONS[card.type] ?? ImageIcon;
          const selected = card.enabled && state.type === card.type;
          const showPro = card.type === firstDisabledType;
          return (
            <button
              key={card.type}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={!card.enabled}
              disabled={!card.enabled}
              onClick={() =>
                card.enabled && set({ type: card.type as AutomationType })
              }
              className={[
                "relative flex min-h-[44px] flex-col items-start gap-2 rounded-[var(--wz-r-card)] border bg-white p-4 text-left transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wz-accent)]",
                card.enabled
                  ? "cursor-pointer hover:border-[var(--wz-accent)]/40"
                  : "cursor-not-allowed opacity-60",
                selected
                  ? "border-transparent ring-2 ring-inset ring-[var(--wz-accent)]"
                  : "border-[var(--wz-border)]",
              ].join(" ")}
            >
              <span className="flex w-full items-center justify-between">
                <Icon
                  className={`size-5 ${selected ? "text-[var(--wz-accent)]" : "text-[var(--wz-text-muted)]"}`}
                />
                {selected && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-[var(--wz-accent)] text-white">
                    <Check className="size-3.5" />
                  </span>
                )}
                {showPro && (
                  <span className="wz-font-mono rounded-[4px] border border-[var(--wz-accent-pop)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--wz-accent-pop)]">
                    Pro · Soon
                  </span>
                )}
              </span>
              <span
                className={`text-sm font-semibold ${selected ? "text-[var(--wz-accent)]" : "text-[var(--wz-text)]"}`}
              >
                {card.title}
              </span>
              <span className="text-[13px] leading-snug text-[var(--wz-text-muted)]">
                {card.description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
