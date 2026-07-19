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

// Step headings (spec §6). Shown at the top of the form column, per step.
export const STEP_TITLES: Record<StepNum, string> = {
  1: "What should trigger the DM?",
  2: "Which content should this watch?",
  3: "Set the trigger",
  4: "Write your DM",
  5: "Public comment reply",
  6: "Review & activate",
};

// Step subtitles (spec §6). Secondary line under each heading.
export const STEP_SUBTITLES: Record<StepNum, string> = {
  1: "Pick one — you can create more automations later.",
  2: "Watch every post, or scope this to a single post or reel.",
  3: "Decide which comments fire the DM.",
  4: "Write the DM your follower receives. The preview updates as you type.",
  5: "Optionally reply under the comment so it looks active to everyone.",
  6: "One last look. Activate when it's ready.",
};

// The six type cards (copy verbatim, spec §6 Step 1). Only `enabled` ones are
// selectable in the MVP; `pro` cards render a PRO badge and, when disabled,
// open an upgrade nudge instead of selecting.
export const TYPE_CARDS: {
  type: AutomationType | string;
  title: string;
  description: string;
  enabled: boolean;
  pro?: boolean;
}[] = [
  {
    type: "post",
    title: "Post comments",
    description: "DM anyone who comments a trigger word on a post",
    enabled: true,
  },
  {
    type: "reel",
    title: "Reel comments",
    description: "Same, for reels — where comment volume peaks",
    enabled: true,
  },
  {
    type: "story_reply",
    title: "Story replies",
    description: "Answer story replies instantly — warmest leads",
    enabled: false,
    pro: true,
  },
  {
    type: "story_mention",
    title: "Story mentions",
    description: "Auto-thank anyone who mentions you (max 1/person/week)",
    enabled: false,
    pro: true,
  },
  {
    type: "facebook_post",
    title: "Facebook Page comments",
    description: "Same engine on your Facebook Page posts",
    enabled: false,
    pro: true,
  },
  {
    type: "inbox",
    title: "Inbox keywords",
    description: "'PRICE' DMs at 2 AM get instant answers",
    enabled: false,
    pro: true,
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
