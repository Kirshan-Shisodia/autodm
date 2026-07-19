import Link from "next/link";

import { login } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/password-input";
import { SubmitButton } from "@/components/auth/submit-button";
import { FormError } from "@/components/auth/form-error";
import { LegalMicrocopy } from "@/components/auth/legal-microcopy";

// Generic, enumeration-safe copy (spec §10, §20b): never reveal which of the
// email/password was wrong, or whether the account exists.
const LOGIN_ERRORS: Record<string, string> = {
  invalid: "Incorrect email or password.",
  rate: "Too many attempts. Please try again in a moment.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string; message?: string }>;
}) {
  const { error, email, message } = await searchParams;
  const errorMsg = error
    ? (LOGIN_ERRORS[error] ?? "Something went wrong. Please try again.")
    : null;

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-[24px] leading-[32px] font-bold tracking-[-0.4px] text-ink sm:text-[32px]">
          Welcome back
        </h1>
        <p className="text-[14px] leading-[24px] text-ink-secondary">
          Log in to your dashboard.
        </p>
      </header>

      <form action={login} className="mt-6 space-y-4">
        {message === "check_email" && (
          <div className="rounded-md bg-warning-bg px-4 py-3 text-[13px] leading-[18px] text-warning-text">
            Check your inbox to confirm your account, then log in.
          </div>
        )}
        {errorMsg && <FormError>{errorMsg}</FormError>}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            defaultValue={email ?? ""}
            required
            aria-invalid={errorMsg ? true : undefined}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium text-brand hover:text-ink"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            aria-invalid={errorMsg ? true : undefined}
          />
        </div>

        <div className="pt-2">
          <SubmitButton pendingLabel="Logging in…">Log in</SubmitButton>
        </div>
      </form>

      <p className="mt-6 text-[13px] leading-[18px] text-ink-secondary">
        New to ChatPilott?{" "}
        <Link href="/signup" className="font-medium text-brand hover:text-ink">
          Create an account
        </Link>
      </p>

      <div className="mt-6">
        <LegalMicrocopy verb="logging in" />
      </div>
    </>
  );
}
