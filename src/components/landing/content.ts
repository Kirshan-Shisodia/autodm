// Landing page copy as data (spec §15, §22). All strings live here so copy
// edits never touch layout, and this file is the seam for a future CMS / i18n
// (Hindi/Hinglish is a plausible ask) and for lifting pricing into a shared
// src/lib/plans.ts once /pricing + billing land.
//
// Canonical pricing (PRD + memory): Free ₹0 · 1,000 DMs/mo · Pro ₹799 ·
// 25,000 DMs/mo · Platinum ₹2,499 · 300,000 DMs/mo. All ₹, all per month.

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Clapperboard,
  CircleDashed,
  Inbox,
  Lock,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  Zap,
} from "lucide-react";

// Feature flags — honest empty slots (spec §9). Layout reserves the bands;
// flip to true (or an env var / remote flag) when real data exists.
export const SHOW_SOCIAL_PROOF = false;
export const SHOW_TESTIMONIALS = false;

export const hero = {
  eyebrow: "For Instagram creators",
  headline: "Turn every comment into a customer.",
  sub: "Auto-DM anyone who comments your keyword — while you sleep. Set it once and AutoDM replies to every commenter, 24/7.",
  primaryCta: { label: "Start free", href: "/signup" },
  secondaryCta: { label: "See how it works", href: "#how-it-works" },
  microcopy: "Free forever plan · 1,000 DMs a month · no credit card.",
} as const;

export const trustStrip: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "Official Meta Graph API" },
  { icon: Lock, label: "Tokens encrypted · AES-256-GCM" },
  { icon: Zap, label: "Rate-limit safe" },
];

export type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
};

export const features: Feature[] = [
  {
    icon: MessageSquare,
    title: "Post comments",
    body: "Reply to comments on any feed post with a keyword-triggered DM in seconds.",
  },
  {
    icon: Clapperboard,
    title: "Reels",
    body: "Same automation on Reels — catch the comment wave the moment a clip takes off.",
  },
  {
    icon: CircleDashed,
    title: "Story replies",
    body: "Turn Story mentions and replies into a DM conversation automatically.",
  },
  {
    icon: Inbox,
    title: "Unified inbox",
    body: "Every triggered conversation in one place, so nothing slips through the cracks.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "See DMs sent, keywords that convert, and where your leads come from.",
  },
  {
    icon: UserPlus,
    title: "Lead capture",
    body: "Collect emails and details inside the DM flow and export your list anytime.",
  },
];

export type Step = {
  number: string;
  title: string;
  body: string;
};

export const steps: Step[] = [
  {
    number: "01",
    title: "Connect your account",
    body: "Link your Instagram Business account through Meta's official login. No password sharing, ever.",
  },
  {
    number: "02",
    title: "Set your keyword",
    body: 'Pick a word — like "LINK" — and write the DM that goes out when someone comments it.',
  },
  {
    number: "03",
    title: "DMs send themselves",
    body: "AutoDM watches your comments and replies instantly, around the clock, while you focus on content.",
  },
];

export type RoiStat = {
  value: string;
  caption: string;
};

export const roiStats: RoiStat[] = [
  { value: "8h+", caption: "saved every month vs. replying by hand" },
  { value: "24/7", caption: "reply time — even at 3am, even on holiday" },
  { value: "< 5 min", caption: "to set up your first automation" },
];

export type Plan = {
  name: string;
  price: string; // rendered mono
  period: string;
  limit: string;
  blurb: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
  badge?: string;
  priceNote?: string;
};

export const pricing: Plan[] = [
  {
    name: "Free",
    price: "₹0",
    period: "/mo",
    limit: "1,000 DMs / month",
    blurb: "Everything you need to start turning comments into conversations.",
    features: [
      "1,000 automated DMs a month",
      "Comment, Reel & Story triggers",
      "1 connected Instagram account",
      "Unified inbox & basic analytics",
    ],
    cta: { label: "Start free", href: "/signup" },
  },
  {
    name: "Pro",
    price: "₹799",
    period: "/mo",
    limit: "25,000 DMs / month",
    blurb: "For creators and coaches scaling past their first thousand leads.",
    priceNote: "≈ ₹0.03 per DM",
    features: [
      "25,000 automated DMs a month",
      "Everything in Free",
      "Lead capture & CSV export",
      "Advanced analytics",
      "Priority support",
    ],
    cta: { label: "Start with Pro", href: "/signup?plan=pro" },
    highlighted: true,
    badge: "Most popular",
  },
];

export const platinumLink = {
  label: "Need 300,000 DMs/mo? See Platinum →",
  href: "/pricing",
};

export type Faq = {
  question: string;
  answer: string;
};

export const faq: Faq[] = [
  {
    question: "Is this against Instagram's rules?",
    answer:
      "No. AutoDM runs entirely on Meta's official Instagram Graph API — the same messaging platform Meta provides to approved partners. You connect through Instagram's own login, and nothing about your account is automated in a way that breaks the rules.",
  },
  {
    question: "Do I need an Instagram Business account?",
    answer:
      "Yes. Meta's messaging API is only available for Business and Creator accounts connected to a Facebook Page. It's free to switch in your Instagram settings, and our setup walks you through it in a couple of minutes.",
  },
  {
    question: "What counts as a DM?",
    answer:
      "Each automated message AutoDM sends in response to a comment, Story reply, or mention counts as one DM toward your monthly limit. Replies you send manually from the inbox don't count.",
  },
  {
    question: "What happens when I hit my limit?",
    answer:
      "Your automations pause for the rest of the billing cycle and we let you know well before you get there. You can upgrade anytime to lift the limit immediately — no lost leads while you decide.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. There are no contracts. Cancel or downgrade from your billing settings whenever you like, and the Free plan is always there to fall back on.",
  },
  {
    question: "Does it work on Reels and Stories?",
    answer:
      "It does. AutoDM triggers on comments on feed posts and Reels, plus Story mentions and replies — so wherever the conversation starts, the DM goes out.",
  },
  {
    question: "Is my account data safe?",
    answer:
      "Your Instagram access tokens are encrypted at rest with AES-256-GCM, and we never see or store your password. We only request the permissions the messaging features actually need.",
  },
  {
    question: "How fast are DMs sent?",
    answer:
      "Almost instantly. AutoDM listens for new comments in real time and typically sends the DM within seconds, staying inside Meta's rate limits so your account stays healthy.",
  },
];

export type FooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

export const footerColumns: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Data Deletion", href: "/data-deletion" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help", href: "/help" },
      { label: "Contact", href: "mailto:support@autodm.app" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Start free", href: "/signup" },
    ],
  },
];
