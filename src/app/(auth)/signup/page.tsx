import Link from "next/link";

import { signup } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { FormError } from "@/components/auth/form-error";
import { LegalMicrocopy } from "@/components/auth/legal-microcopy";

// Plans the landing/pricing pages can pre-select via /signup?plan=… (spec §20d).
const VALID_PLANS = ["free", "pro"] as const;
type Plan = (typeof VALID_PLANS)[number];

function normalizePlan(raw: string | undefined): Plan {
  return VALID_PLANS.includes(raw as Plan) ? (raw as Plan) : "free";
}

// Enumeration-safe (spec §10, §20b): no "account already exists" message.
const SIGNUP_ERRORS: Record<string, string> = {
  weak_password: "Password must be at least 8 characters.",
  signup_failed: "We couldn't create your account. Please try again.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; plan?: string; email?: string }>;
}) {
  const { error, plan: rawPlan, email } = await searchParams;
  const plan = normalizePlan(rawPlan);
  const errorMsg = error
    ? (SIGNUP_ERRORS[error] ?? "Something went wrong. Please try again.")
    : null;

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-[24px] leading-[32px] font-bold tracking-[-0.4px] text-ink sm:text-[32px]">
          Create your account
        </h1>
        <p className="text-[14px] leading-[24px] text-ink-secondary">
          {plan === "pro"
            ? "Start your Pro plan — automate DMs at scale."
            : "Start automating your DMs in minutes."}
        </p>
      </header>

      <form action={signup} className="mt-6 space-y-4">
        {/* Carry the chosen plan into the server action without exposing it as a
            visible control (spec §20d). */}
        {plan !== "free" && <input type="hidden" name="plan" value={plan} />}
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

        <PasswordField label="Password" autoComplete="new-password" />

        <div className="pt-2">
          <SubmitButton pendingLabel="Creating account…">
            Create account
          </SubmitButton>
        </div>
      </form>

      <p className="mt-6 text-[13px] leading-[18px] text-ink-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:text-ink">
          Log in
        </Link>
      </p>

      <div className="mt-6">
        <LegalMicrocopy verb="creating an account" />
      </div>
    </>
  );
}
