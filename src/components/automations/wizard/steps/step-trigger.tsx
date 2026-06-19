"use client";

// Step 3 — Set trigger (spec §5). Segmented control: keywords vs all comments,
// chip input for keywords, and a live plain-language sentence preview.

import { KeywordInput } from "@/components/automations/wizard/keyword-input";
import type { TriggerType, WizardState } from "@/lib/automations/wizard";

function Segmented({
  value,
  onChange,
}: {
  value: TriggerType;
  onChange: (v: TriggerType) => void;
}) {
  const options: { value: TriggerType; label: string }[] = [
    { value: "keyword", label: "Specific keywords" },
    { value: "all", label: "All comments" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Trigger type"
      className="grid grid-cols-2 gap-1 rounded-[var(--wz-r-input)] bg-[var(--wz-surface)] p-1"
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(o.value)}
            className={[
              "min-h-[40px] rounded-[var(--wz-r-button)] px-3 text-sm font-medium transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wz-accent)]",
              active
                ? "bg-white text-[var(--wz-text)] ring-1 ring-[var(--wz-border)]"
                : "text-[var(--wz-text-muted)] hover:text-[var(--wz-text)]",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Sentence({ keywords }: { keywords: string[] }) {
  const shown = keywords.map((k) => k.toUpperCase());
  let list: React.ReactNode = (
    <span className="font-semibold text-[var(--wz-text)]">a keyword</span>
  );
  if (shown.length === 1) {
    list = <strong className="text-[var(--wz-text)]">{shown[0]}</strong>;
  } else if (shown.length > 1) {
    list = (
      <>
        {shown.slice(0, -1).map((k, i) => (
          <span key={k}>
            <strong className="text-[var(--wz-text)]">{k}</strong>
            {i < shown.length - 2 ? ", " : ""}
          </span>
        ))}
        {" or "}
        <strong className="text-[var(--wz-text)]">{shown[shown.length - 1]}</strong>
      </>
    );
  }
  return (
    <p className="text-sm text-[var(--wz-text-muted)]">
      When someone comments {list} on this post, send them a DM.
    </p>
  );
}

export function StepTrigger({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-5">
      <Segmented
        value={state.trigger_type}
        onChange={(trigger_type) => set({ trigger_type })}
      />

      {state.trigger_type === "keyword" ? (
        <div className="space-y-3">
          <KeywordInput
            keywords={state.trigger_keywords}
            onChange={(trigger_keywords) => set({ trigger_keywords })}
          />
          <Sentence keywords={state.trigger_keywords} />
        </div>
      ) : (
        <p className="text-sm text-[var(--wz-text-muted)]">
          When <strong className="text-[var(--wz-text)]">anyone</strong> comments
          on this post, send them a DM.
        </p>
      )}
    </div>
  );
}
