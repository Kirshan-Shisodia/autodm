"use client";

// The per-row controls: a "message" shortcut that opens the DM thread on
// Instagram, and the kebab menu that moves the lead through the funnel and
// edits its tags.
//
// Every mutation is a Server Action wrapped in a transition, so the row stays
// interactive and the page revalidates itself rather than being refetched by
// hand.

import { useTransition } from "react";
import {
  Archive,
  Check,
  CircleCheck,
  EllipsisVertical,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  RotateCcw,
  Tag,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SUGGESTED_TAGS, type Lead } from "@/lib/leads/model";
import {
  addLeadTag,
  removeLeadTag,
  setLeadStatus,
} from "@/app/(app)/leads/actions";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ICON_BUTTON =
  "flex size-7 items-center justify-center rounded-md text-ink-tertiary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:opacity-50";

export function LeadRowActions({ lead }: { lead: Lead }) {
  const [isPending, startTransition] = useTransition();

  const run = (fn: () => Promise<unknown>) => {
    startTransition(() => {
      void fn();
    });
  };

  return (
    <div className="flex items-center justify-end gap-0.5">
      {/* Instagram has no deep link to a DM thread by username, so this opens
          the profile — the closest thing to "message them" that reliably
          works, and it opens in a new tab rather than losing the list. */}
      {lead.handle ? (
        <a
          href={`https://instagram.com/${lead.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className={ICON_BUTTON}
          title={`Open @${lead.handle} on Instagram`}
        >
          <MessageCircle className="size-4" aria-hidden />
          <span className="sr-only">Message {lead.name}</span>
        </a>
      ) : (
        <a href={`mailto:${lead.email}`} className={ICON_BUTTON} title="Send email">
          <Mail className="size-4" aria-hidden />
          <span className="sr-only">Email {lead.name}</span>
        </a>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger className={ICON_BUTTON} disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <EllipsisVertical className="size-4" aria-hidden />
          )}
          <span className="sr-only">Actions for {lead.name}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="truncate">{lead.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {lead.status !== "engaged" && (
            <DropdownMenuItem
              onSelect={() => run(() => setLeadStatus(lead.id, "engaged"))}
            >
              <MessageSquare className="size-4" aria-hidden />
              Mark as engaged
            </DropdownMenuItem>
          )}
          {lead.status !== "converted" && (
            <DropdownMenuItem
              onSelect={() => run(() => setLeadStatus(lead.id, "converted"))}
            >
              <CircleCheck className="size-4" aria-hidden />
              Mark as converted
            </DropdownMenuItem>
          )}
          {lead.status !== "new" && (
            <DropdownMenuItem
              onSelect={() => run(() => setLeadStatus(lead.id, "new"))}
            >
              <UserPlus className="size-4" aria-hidden />
              Move back to new
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-1.5">
            <Tag className="size-3.5" aria-hidden />
            Tags
          </DropdownMenuLabel>

          {/* Suggested tags plus anything already on the lead, so an existing
              free-form tag can be removed from the same menu that adds one. */}
          {[...new Set([...SUGGESTED_TAGS, ...lead.tags])].map((tag) => {
            const on = lead.tags.includes(tag);
            return (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={on}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() =>
                  run(() =>
                    on ? removeLeadTag(lead.id, tag) : addLeadTag(lead.id, tag),
                  )
                }
              >
                {tag}
              </DropdownMenuCheckboxItem>
            );
          })}

          <DropdownMenuSeparator />
          {lead.status === "archived" ? (
            <DropdownMenuItem
              onSelect={() => run(() => setLeadStatus(lead.id, "new"))}
            >
              <RotateCcw className="size-4" aria-hidden />
              Restore lead
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => run(() => setLeadStatus(lead.id, "archived"))}
            >
              <Archive className="size-4" aria-hidden />
              Archive lead
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * A checkbox that matches the rest of the chrome. Built on a real input rather
 * than a div with a role, so it keeps native keyboard behaviour, form
 * semantics, and the indeterminate state the header row needs.
 */
export function LeadCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="relative flex size-4 cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        aria-label={label}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate && !checked;
        }}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "flex size-4 items-center justify-center rounded-[4px] border transition-colors duration-100 [transition-timing-function:var(--ease-standard)]",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-1",
          checked || indeterminate
            ? "border-action bg-action text-ink-inverse"
            : "border-border-strong bg-surface-card",
        )}
      >
        {checked ? (
          <Check className="size-3" strokeWidth={3} />
        ) : indeterminate ? (
          <span className="h-0.5 w-2 rounded-full bg-ink-inverse" />
        ) : null}
      </span>
    </label>
  );
}
