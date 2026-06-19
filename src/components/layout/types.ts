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
