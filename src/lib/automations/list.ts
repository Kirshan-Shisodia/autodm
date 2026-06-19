// Helpers for the Automations List screen (list spec §4, §8). Pure functions +
// presentational metadata shared by the server page and the client table, so no
// table/column names leak into user-facing copy.

import {
  Image as ImageIcon,
  Film,
  MessageCircle,
  AtSign,
  Inbox,
  Megaphone,
  Square,
  type LucideIcon,
} from "lucide-react";

// One automation as the list renders it — the server page shapes rows into this.
export type AutomationListItem = {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  created_at: string;
  dms_today: number;
};

// Friendly label + icon per automation type (DB check constraint values).
// Names are user-facing strings, never `automations.type` raw (spec §12).
const TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  post: { label: "Post", icon: ImageIcon },
  reel: { label: "Reel", icon: Film },
  story_reply: { label: "Story reply", icon: MessageCircle },
  story_mention: { label: "Story mention", icon: AtSign },
  inbox: { label: "Inbox", icon: Inbox },
  ad: { label: "Ad", icon: Megaphone },
  facebook_post: { label: "Facebook post", icon: Square },
};

export function typeMeta(type: string): { label: string; icon: LucideIcon } {
  return TYPE_META[type] ?? { label: type, icon: Square };
}

/** ISO timestamp for 00:00 today, local time — the "DMs today" window (§8). */
export function startOfToday(now: Date = new Date()): string {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

/** Short created-date for the table, e.g. "Jun 17". Rendered in mono (§4). */
export function formatCreated(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
