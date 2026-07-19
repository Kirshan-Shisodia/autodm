"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { updatePassword, type ResetState } from "@/app/(auth)/actions";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";
import { StrengthMeter, MIN_PASSWORD_LENGTH } from "./password-field";
import { SubmitButton } from "./submit-button";
import { FormError } from "./form-error";
import { FieldError } from "./field-error";

const INITIAL: ResetState = { status: "idle" };

/**
 * New-password form for /auth/reset (spec §6, §9, §10). Rendered only once the
 * recovery session exists (the page guards that). Owns password + confirm state
 * so it can validate the match live before submit; the server action
 * (`updatePassword`) re-validates length + match and is the real gate. On
 * success it swaps to the confirmation state (spec §6 SuccessState) rather than
 * redirecting, so the checkmark moment is preserved.
 */
export function ResetPasswordForm() {
  const [state, formAction] = React.useActionState(updatePassword, INITIAL);
  const [pw, setPw] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const mismatch = touched && confirm.length > 0 && pw !== confirm;

  if (state.status === "success") {
    return (
      <div className="space-y-5">
        <div className="flex size-12 items-center justify-center rounded-full bg-success-bg text-success">
          <CheckCircle2 className="size-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-[24px] leading-[32px] font-bold tracking-[-0.4px] text-ink sm:text-[32px]">
            Password updated
          </h1>
          <p className="text-[14px] leading-[24px] text-ink-secondary">
            Your password has been changed. You can now log in with your new
            password.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-12 w-full items-center justify-center rounded-md bg-action px-4 text-[14px] font-semibold text-ink-inverse transition-colors hover:bg-action-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas focus-visible:outline-none"
        >
          Continue to log in
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-[24px] leading-[32px] font-bold tracking-[-0.4px] text-ink sm:text-[32px]">
          Set a new password
        </h1>
        <p className="text-[14px] leading-[24px] text-ink-secondary">
          Choose a new password for your account.
        </p>
      </header>

      <form action={formAction} className="mt-6 space-y-4">
        {state.status === "error" && state.message && (
          <FormError>{state.message}</FormError>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            aria-describedby="password-hint"
          />
          <StrengthMeter value={pw} id="password-hint" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={mismatch ? true : undefined}
            aria-describedby={mismatch ? "confirm-error" : undefined}
          />
          {mismatch && (
            <FieldError id="confirm-error">Passwords don&rsquo;t match.</FieldError>
          )}
        </div>

        <div className="pt-2">
          <SubmitButton pendingLabel="Updating…">Set new password</SubmitButton>
        </div>
      </form>
    </>
  );
}
