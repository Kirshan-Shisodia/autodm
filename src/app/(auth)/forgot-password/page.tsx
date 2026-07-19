import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { requestPasswordReset } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/auth/submit-button";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  // Enumeration-safe confirmation (spec §10): identical response whether or not
  // an account exists for the address.
  if (sent) {
    return (
      <div className="space-y-5">
        <div className="flex size-12 items-center justify-center rounded-full bg-hover-bg text-brand">
          <Mail className="size-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-[24px] leading-[32px] font-bold tracking-[-0.4px] text-ink sm:text-[32px]">
            Check your inbox
          </h1>
          <p className="text-[14px] leading-[24px] text-ink-secondary">
            If an account exists for that email, we&rsquo;ve sent a link to reset
            your password. The link expires in one hour.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to log in
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-[24px] leading-[32px] font-bold tracking-[-0.4px] text-ink sm:text-[32px]">
          Reset your password
        </h1>
        <p className="text-[14px] leading-[24px] text-ink-secondary">
          Enter your email and we&rsquo;ll send you a link to set a new password.
        </p>
      </header>

      <form action={requestPasswordReset} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            required
          />
        </div>
        <div className="pt-2">
          <SubmitButton pendingLabel="Sending link…">Send reset link</SubmitButton>
        </div>
      </form>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-ink-secondary hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to log in
      </Link>
    </>
  );
}
