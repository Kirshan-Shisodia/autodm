"use client";

// Chip input (spec §5 Step 3): type a word, Enter to add it as a chip, × to
// remove. Keywords are stored lowercased. Targets are ≥44px on mobile.

import { useState } from "react";
import { X } from "lucide-react";

export function KeywordInput({
  keywords,
  onChange,
}: {
  keywords: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const word = raw.trim().toLowerCase();
    if (!word) return;
    if (keywords.includes(word)) {
      setDraft("");
      return;
    }
    onChange([...keywords, word]);
    setDraft("");
  }

  function remove(word: string) {
    onChange(keywords.filter((k) => k !== word));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && draft === "" && keywords.length) {
      remove(keywords[keywords.length - 1]);
    }
  }

  return (
    <div
      className="flex flex-wrap gap-2 rounded-[var(--wz-r-input)] border border-[var(--wz-border)] bg-[var(--wz-surface)] p-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--wz-accent)]"
      onClick={(e) => {
        (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus();
      }}
    >
      {keywords.map((k) => (
        <span
          key={k}
          className="inline-flex min-h-[28px] items-center gap-1 rounded-[var(--wz-r-button)] bg-white px-2.5 py-1 text-sm text-[var(--wz-text)] ring-1 ring-[var(--wz-border)]"
        >
          {k}
          <button
            type="button"
            aria-label={`Remove ${k}`}
            onClick={(e) => {
              e.stopPropagation();
              remove(k);
            }}
            className="flex size-5 items-center justify-center rounded-full text-[var(--wz-text-muted)] hover:bg-[var(--wz-surface)] hover:text-[var(--wz-text)]"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        placeholder={keywords.length ? "Add another…" : "Type a keyword, press Enter"}
        aria-label="Add a trigger keyword"
        className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-sm text-[var(--wz-text)] placeholder:text-[var(--wz-text-muted)] focus:outline-none"
      />
    </div>
  );
}
