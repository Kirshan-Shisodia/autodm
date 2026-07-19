"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
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

  // Plan pre-selected on the landing page (spec §20c). Validate against the
  // known set so the query string can't write arbitrary account metadata.
  const rawPlan = String(formData.get("plan") ?? "");
  const plan = ["free", "pro"].includes(rawPlan) ? rawPlan : "free";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { plan } },
  });

  if (error) {
    // Preserve the chosen plan so the signup form keeps its Pro context.
    const params = new URLSearchParams({ error: error.message });
    if (plan !== "free") params.set("plan", plan);
    redirect(`/signup?${params.toString()}`);
  }

  // If email confirmation is disabled (recommended for dev), signUp returns an
  // active session and we can go straight to the app. Otherwise, prompt the
  // user to confirm their email first.
  if (!data.session) {
    redirect("/login?message=check_email");
  }

  redirect("/dashboard");
}
