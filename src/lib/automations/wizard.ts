// Shared types, constants, validation, and helpers for the Automation Wizard
// (spec §4–§7). Imported by both the client wizard and the create API route so
// the validation contract lives in exactly one place.

import { z } from "zod";

export const DM_MAX = 1000; // Meta DM character limit (spec §5 Step 4)
export const REPLY_MAX = 280; // Comment-reply limit (spec §5 Step 5)
export const LINK_PLACEHOLDER = "{LINK}";

export const TOTAL_STEPS = 6;
export type StepNum = 1 | 2 | 3 | 4 | 5 | 6;
export type Plan = "free" | "pro" | "platinum";

// Only Post and Reel route through the live Workflow 1 (spec §5 Step 1).
export type AutomationType = "post" | "reel";
export type TriggerType = "keyword" | "all";

export type WizardState = {
  step: StepNum;
  type: AutomationType;
  ig_account_id: string;
  media_id: string | null; // null = apply to all posts
  media_url: string | null; // thumbnail for the summary/preview only
  trigger_type: TriggerType;
  trigger_keywords: string[];
  dm_message: string;
  dm_link: string;
  comment_reply_text: string; // Pro only
};

export const STEPS: { n: StepNum; key: string; label: string; pro?: boolean }[] =
  [
    { n: 1, key: "type", label: "Type" },
    { n: 2, key: "post", label: "Post" },
    { n: 3, key: "trigger", label: "Trigger" },
    { n: 4, key: "message", label: "Message" },
    { n: 5, key: "reply", label: "Reply", pro: true },
    { n: 6, key: "review", label: "Review" },
  ];

export const STEP_TITLES: Record<StepNum, string> = {
  1: "Pick an automation",
  2: "Choose a post",
  3: "Set the trigger",
  4: "Write the message",
  5: "Comment reply",
  6: "Review & activate",
};

// The six type cards. Only `enabled` ones are selectable in the MVP (spec §5).
export const TYPE_CARDS: {
  type: AutomationType | string;
  title: string;
  description: string;
  enabled: boolean;
}[] = [
  {
    type: "post",
    title: "Post",
    description: "Reply when someone comments on a feed post.",
    enabled: true,
  },
  {
    type: "reel",
    title: "Reel",
    description: "Reply when someone comments on a reel.",
    enabled: true,
  },
  {
    type: "story_reply",
    title: "Story Reply",
    description: "Reply when someone responds to your story.",
    enabled: false,
  },
  {
    type: "story_mention",
    title: "Story Mention",
    description: "Reply when someone mentions you in their story.",
    enabled: false,
  },
  {
    type: "facebook_post",
    title: "Facebook Comment",
    description: "Reply to comments on your Facebook posts.",
    enabled: false,
  },
  {
    type: "inbox",
    title: "Inbox",
    description: "Reply to incoming direct messages.",
    enabled: false,
  },
];

export function initialState(ig_account_id: string): WizardState {
  return {
    step: 1,
    type: "post",
    ig_account_id,
    media_id: null,
    media_url: null,
    trigger_type: "keyword",
    trigger_keywords: [],
    dm_message: "",
    dm_link: "",
    comment_reply_text: "",
  };
}

/** Per-step validity — drives the Continue button's disabled state (spec §3). */
export function isStepValid(s: WizardState, step: StepNum): boolean {
  switch (step) {
    case 1:
      return s.type === "post" || s.type === "reel";
    case 2:
      // "All posts" (null) is a valid choice, so step 2 is always satisfiable.
      return true;
    case 3:
      return s.trigger_type === "all" || s.trigger_keywords.length > 0;
    case 4:
      return s.dm_message.trim().length > 0 && s.dm_message.length <= DM_MAX;
    case 5:
      return s.comment_reply_text.length <= REPLY_MAX; // optional
    case 6:
      return true;
    default:
      return false;
  }
}

/** Auto-generate a human name for the automation row (spec §6.1). */
export function autoName(s: {
  trigger_type: TriggerType;
  trigger_keywords: string[];
  media_id: string | null;
  type: AutomationType;
}): string {
  const target = s.media_id ? "a post" : "all posts";
  if (s.trigger_type === "all") {
    return `Auto-DM on any comment · ${target}`;
  }
  const kw = s.trigger_keywords[0]?.toUpperCase() ?? "KEYWORD";
  const more =
    s.trigger_keywords.length > 1 ? ` +${s.trigger_keywords.length - 1}` : "";
  return `${kw}${more} → DM on ${target}`;
}

// ---- Server-side validation (spec §6.1) ----------------------------------

export const createAutomationSchema = z
  .object({
    ig_account_id: z.string().uuid(),
    type: z.enum(["post", "reel"]),
    media_id: z.string().min(1).nullable(),
    media_url: z.string().url().nullable().optional(),
    trigger_type: z.enum(["keyword", "all"]),
    trigger_keywords: z.array(z.string().min(1)).default([]),
    dm_message: z.string().trim().min(1).max(DM_MAX),
    dm_link: z
      .string()
      .url()
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),
    comment_reply_text: z.string().max(REPLY_MAX).optional().default(""),
  })
  .refine(
    (v) => v.trigger_type !== "keyword" || v.trigger_keywords.length > 0,
    { path: ["trigger_keywords"], message: "Add at least one keyword." },
  );

export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;

/** URL-safe short code for the short_links row (spec §6.1 step 2). */
export function generateShortCode(len = 7): string {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
