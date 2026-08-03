"use client";

// The leads table. A real <table>: the header cells associate with the rows for
// a screen reader, and column widths stay honest as names get longer.
//
// Selection is client state — it's ephemeral by nature, and putting forty ids
// in the query string would make every link unshareable.

import { useMemo, useState, useTransition } from "react";
import { Archive, CircleCheck, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCount, type Lead } from "@/lib/leads/model";
import { bulkSetLeadStatus } from "@/app/(app)/leads/actions";
import { LeadCheckbox, LeadRowActions } from "./lead-row-menu";
import {
  ActivityCell,
  ConversionCell,
  LeadAvatar,
  SourceCell,
  StatusBadge,
  TagList,
} from "./lead-bits";

const TH =
  "px-3 py-2.5 text-left text-[11px] font-semibold tracking-[0.055em] text-ink-tertiary uppercase";

export function LeadsTable({ rows }: { rows: Lead[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const pageIds = useMemo(() => rows.map((r) => r.id), [rows]);
  // Only ids still on screen count as selected. Paging away and back should
  // not silently keep forty rows armed for a bulk archive.
  const visibleSelected = useMemo(
    () => pageIds.filter((id) => selected.has(id)),
    [pageIds, selected],
  );

  const allChecked = pageIds.length > 0 && visibleSelected.length === pageIds.length;
  const someChecked = visibleSelected.length > 0 && !allChecked;

  const toggleAll = (next: boolean) => {
    setSelected(next ? new Set(pageIds) : new Set());
  };

  const toggleOne = (id: string, next: boolean) => {
    setSelected((prev) => {
      const out = new Set(prev);
      if (next) out.add(id);
      else out.delete(id);
      return out;
    });
  };

  const runBulk = (status: "converted" | "archived") => {
    startTransition(async () => {
      await bulkSetLeadStatus(visibleSelected, status);
      setSelected(new Set());
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      {visibleSelected.length > 0 && (
        <BulkBar
          count={visibleSelected.length}
          pending={isPending}
          onConvert={() => runBulk("converted")}
          onArchive={() => runBulk("archived")}
          onClear={() => setSelected(new Set())}
        />
      )}

      {/* `h-full` on the table is doing real work: when the rail is the taller
          column, the leftover height is shared out across the rows instead of
          pooling as dead white space above the pagination footer. A table with
          height:100% treats it as a floor, so rows only ever grow. */}
      <div className="flex-1 overflow-x-auto">
        <table className="h-full w-full min-w-[860px] border-collapse">
          <thead>
            <tr className="border-b border-border-default">
              <th scope="col" className="w-10 px-3 py-2.5">
                <LeadCheckbox
                  checked={allChecked}
                  indeterminate={someChecked}
                  onChange={toggleAll}
                  label="Select all leads on this page"
                />
              </th>
              <th scope="col" className={TH}>
                Lead
              </th>
              <th scope="col" className={TH}>
                Source
              </th>
              <th scope="col" className={TH}>
                Status
              </th>
              <th scope="col" className={TH}>
                Last activity
              </th>
              <th scope="col" className={TH}>
                Tags
              </th>
              <th scope="col" className={TH}>
                Conversion
              </th>
              <th scope="col" className={cn(TH, "text-right")}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((lead) => {
              const checked = selected.has(lead.id);
              return (
                <tr
                  key={lead.id}
                  data-selected={checked || undefined}
                  className={cn(
                    "border-b border-border-subtle last:border-b-0",
                    "transition-colors duration-100 [transition-timing-function:var(--ease-standard)]",
                    checked ? "bg-hover-bg" : "hover:bg-surface-app",
                  )}
                >
                  <td className="px-3 py-2.5 align-middle">
                    <LeadCheckbox
                      checked={checked}
                      onChange={(next) => toggleOne(lead.id, next)}
                      label={`Select ${lead.name}`}
                    />
                  </td>

                  <td className="px-3 py-2.5 align-middle">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <LeadAvatar initials={lead.initials} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {lead.name}
                        </span>
                        <span className="block truncate text-[11px] text-ink-muted">
                          {lead.handle ? `@${lead.handle}` : lead.email}
                        </span>
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2.5 align-middle">
                    <SourceCell
                      source={lead.source}
                      label={lead.sourceLabel}
                      automationName={lead.automationName}
                    />
                  </td>

                  <td className="px-3 py-2.5 align-middle">
                    <StatusBadge status={lead.status} />
                  </td>

                  <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                    <ActivityCell lead={lead} />
                  </td>

                  <td className="px-3 py-2.5 align-middle">
                    <TagList tags={lead.tags} />
                  </td>

                  <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                    <ConversionCell conversion={lead.conversion} />
                  </td>

                  <td className="px-3 py-2.5 align-middle">
                    <LeadRowActions lead={lead} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BulkBar({
  count,
  pending,
  onConvert,
  onArchive,
  onClear,
}: {
  count: number;
  pending: boolean;
  onConvert: () => void;
  onArchive: () => void;
  onClear: () => void;
}) {
  const BTN =
    "inline-flex h-7 items-center gap-1.5 rounded-md border border-border-default bg-surface-card px-2.5 text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border-default bg-selected-bg/60 px-3 py-2">
      <span className="wz-font-mono text-[12px] font-medium text-ink tabular-nums">
        {formatCount(count)} selected
      </span>
      <span className="flex-1" />
      {pending && <Loader2 className="size-3.5 animate-spin text-ink-tertiary" aria-hidden />}
      <button type="button" onClick={onConvert} disabled={pending} className={BTN}>
        <CircleCheck className="size-3.5" aria-hidden />
        Mark converted
      </button>
      <button type="button" onClick={onArchive} disabled={pending} className={BTN}>
        <Archive className="size-3.5" aria-hidden />
        Archive
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={pending}
        className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] text-ink-tertiary hover:text-ink"
      >
        <X className="size-3.5" aria-hidden />
        Clear
      </button>
    </div>
  );
}
