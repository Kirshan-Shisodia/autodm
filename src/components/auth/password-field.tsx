"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";

/**
 * Password strength feedback (spec §20e): validate as the user types instead of
 * failing only on submit. Not a security gate — the server action enforces the
 * real minimum; this is guidance. `StrengthMeter` is reused by the reset form
 * (which owns its own state for the confirm-match check); `PasswordField` is the
 * self-contained convenience used on signup.
 */
export const MIN_PASSWORD_LENGTH = 8;

type Strength = { level: 0 | 1 | 2 | 3; text: string; tone: string };

function assess(pw: string): Strength {
  if (pw.length === 0) {
    return {
      level: 0,
      text: `Use at least ${MIN_PASSWORD_LENGTH} characters`,
      tone: "text-ink-tertiary",
    };
  }
  if (pw.length < MIN_PASSWORD_LENGTH) {
    return {
      level: 1,
      text: `Too short — at least ${MIN_PASSWORD_LENGTH} characters`,
      tone: "text-danger",
    };
  }
  const variety =
    Number(/[a-z]/.test(pw)) +
    Number(/[A-Z]/.test(pw)) +
    Number(/[0-9]/.test(pw)) +
    Number(/[^A-Za-z0-9]/.test(pw));
  if (pw.length >= 12 && variety >= 3) {
    return { level: 3, text: "Strong password", tone: "text-success" };
  }
  return { level: 2, text: "Looks good", tone: "text-ink-secondary" };
}

const BAR_COLOR = ["bg-border-default", "bg-danger", "bg-brand", "bg-success"] as const;

export function StrengthMeter({ value, id }: { value: string; id?: string }) {
  const { level, text, tone } = assess(value);
  return (
    <div id={id}>
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3].map((seg) => (
          <span
            key={seg}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level >= seg ? BAR_COLOR[level] : "bg-border-default"
            }`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-[12px] leading-[18px] ${tone}`} aria-live="polite">
        {text}
      </p>
    </div>
  );
}

export function PasswordField({
  id = "password",
  name = "password",
  label = "Password",
  autoComplete = "new-password",
}: {
  id?: string;
  name?: string;
  label?: string;
  autoComplete?: string;
}) {
  const [value, setValue] = React.useState("");
  const hintId = `${id}-hint`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <PasswordInput
        id={id}
        name={name}
        autoComplete={autoComplete}
        minLength={MIN_PASSWORD_LENGTH}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-describedby={hintId}
      />
      <StrengthMeter value={value} id={hintId} />
    </div>
  );
}
