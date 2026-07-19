"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

// Plans the landing/pricing pages can pre-select via /signup?plan=… (spec §20d).
// Anything else collapses to "free" so a junk query param can't seed metadata.
const VALID_PLANS = ["free", "pro"] as const;
type Plan = (typeof VALID_PLANS)[number];

// Kept in sync with the client hint (password-field.tsx). The server is the
// real gate; the client meter is only guidance (spec §20e).
const MIN_PASSWORD_LENGTH = 8;

function normalizePlan(raw: string): Plan {
  return (VALID_PLANS as readonly string[]).includes(raw) ? (raw as Plan) : "free";
}

// Absolute origin of the current request — used to build the password-reset
// redirect. Prefers forwarded headers so it's correct behind a proxy in prod
// and still resolves to http://localhost:3000 in dev.
async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Generic on purpose — never reveal whether the email exists (spec §10,
    // §20b). Rate limiting gets its own hint; everything else is "invalid".
    // Preserve the typed email so the user doesn't retype (spec §12).
    const code = error.status === 429 ? "rate" : "invalid";
    const params = new URLSearchParams({ error: code, email });
    redirect(`/login?${params.toString()}`);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const plan = normalizePlan(String(formData.get("plan") ?? ""));

  const fail = (code: string) => {
    const params = new URLSearchParams({ error: code, email });
    if (plan !== "free") params.set("plan", plan);
    redirect(`/signup?${params.toString()}`);
  };

  // Server-side guard, not solely reliant on the client meter.
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail("weak_password");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { plan } },
  });

  if (error) {
    // Enumeration-safe: don't surface "an account already exists" (spec §10,
    // §20b). Everything maps to one generic failure message.
    fail("signup_failed");
  }

  // Fresh account with email confirmation off → active session → into the app.
  if (data?.session) {
    redirect("/dashboard");
  }

  // No session means either confirmation is ON, or the email already exists
  // (Supabase returns an obfuscated user to prevent enumeration). A neutral
  // "check your inbox" is correct for both and reveals nothing (spec §22).
  redirect("/login?message=check_email");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const origin = await getOrigin();

  const supabase = await createClient();
  // The recovery link lands on our callback, which exchanges the PKCE code for a
  // session and forwards to /auth/reset. Any error is intentionally swallowed so
  // we never reveal whether the email exists (spec §10, §20b).
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/auth/reset`,
  });

  // Always the same neutral confirmation, regardless of outcome.
  redirect("/forgot-password?sent=1");
}

export type ResetState = { status: "idle" | "error" | "success"; message?: string };

export async function updatePassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      status: "error",
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (password !== confirm) {
    return { status: "error", message: "Passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The recovery session is established by the callback before this page loads.
  // If it's gone, the link was invalid or expired (spec §9, §10).
  if (!user) {
    return {
      status: "error",
      message: "Your reset link has expired. Please request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { status: "error", message: "Couldn't update your password. Please try again." };
  }

  return { status: "success" };
}
