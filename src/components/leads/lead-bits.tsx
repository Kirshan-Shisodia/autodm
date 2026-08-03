// The small shared pieces the table and the card grid both render: the avatar,
// the source glyph, the status badge, tag chips, and the conversion readout.
// Keeping them here is what stops the two views from drifting apart.

import {
  AtSign,
  Clapperboard,
  Inbox,
  Megaphone,
  MessageCircle,
  MessageCircleReply,
  MessageSquare,
  Share2,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CONVERSION_DOT,
  CONVERSION_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
  type Conversion,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from "@/lib/leads/model";

export const SOURCE_ICON: Record<LeadSource, LucideIcon> = {
  post_comment: MessageCircle,
  reel_comment: Clapperboard,
  story_reply: MessageCircleReply,
  story_mention: AtSign,
  inbox_keyword: Inbox,
  ad: Megaphone,
  facebook_post: Share2,
  dm_conversation: MessageSquare,
  manual: UserRoundPlus,
};

/**
 * Initials on a warm tint. Instagram profile pictures are CDN URLs that expire
 * and would need a proxy plus a next/image domain allowlist; initials never
 * 404 and never leak a request to Meta from the user's browser.
 */
export function LeadAvatar({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-hover-bg text-[11px] font-semibold text-ink-secondary",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function SourceCell({
  source,
  label,
  automationName,
}: {
  source: LeadSource;
  label: string;
  automationName: string | null;
}) {
  const Icon = SOURCE_ICON[source];
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-muted text-ink-secondary"
        aria-hidden
      >
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-ink">
          {label}
        </span>
        <span className="block truncate text-[11px] text-ink-muted">
          {automationName ?? "No automation"}
        </span>
      </span>
    </div>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-md px-2 text-[11px] font-medium",
        STATUS_BADGE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ActivityCell({ lead }: { lead: Lead }) {
  return (
    <span className="flex items-center gap-2 text-[12px] text-ink-secondary">
      <span
        className={cn("size-1.5 shrink-0 rounded-full", lead.activityTone)}
        aria-hidden
      />
      <time dateTime={lead.lastActivity}>{lead.lastActivityLabel}</time>
    </span>
  );
}

export function TagChip({ tag }: { tag: string }) {
  return (
    <span className="inline-flex h-[22px] max-w-[104px] items-center truncate rounded-md bg-surface-muted px-2 text-[11px] text-ink-secondary">
      {tag}
    </span>
  );
}

/**
 * At most two chips inline plus an overflow count. Three tags on a lead is
 * common and would push the CONVERSION column off a laptop screen.
 */
export function TagList({ tags, max = 2 }: { tags: string[]; max?: number }) {
  if (tags.length === 0) {
    return <span className="text-[12px] text-ink-muted">—</span>;
  }

  const shown = tags.slice(0, max);
  const extra = tags.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((t) => (
        <TagChip key={t} tag={t} />
      ))}
      {extra > 0 && (
        <span
          className="text-[11px] text-ink-muted"
          title={tags.slice(max).join(", ")}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

export function ConversionCell({ conversion }: { conversion: Conversion }) {
  return (
    <span className="flex items-center gap-2 text-[12px] text-ink-secondary">
      <span
        className={cn("size-1.5 shrink-0 rounded-full", CONVERSION_DOT[conversion])}
        aria-hidden
      />
      {CONVERSION_LABEL[conversion]}
    </span>
  );
}
