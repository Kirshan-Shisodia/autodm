import type { Plan } from "@/lib/dashboard";

export type ShellUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  plan: Plan;
};

export type ShellAccount = {
  id: string;
  ig_username: string;
};

/**
 * Monthly DM allowance, rendered as a meter in the sidebar. It lives in the
 * shell rather than on the Dashboard because it's the one number that governs
 * every screen — hitting the cap stops automations everywhere, so it should be
 * visible from everywhere.
 */
export type ShellUsage = {
  used: number;
  limit: number;
  /** 0–100, pre-clamped. */
  pct: number;
};
