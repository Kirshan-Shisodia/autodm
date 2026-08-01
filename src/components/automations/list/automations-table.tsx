"use client";

// The Automations data table. A quiet HALO data surface: white, gridded, flat.
// Numbers are mono and tabular so columns align down the page; the only colour
// in the body is the status chip and the conversion pill.
//
// Under md the table collapses into one card per automation — a data table is
// never scrolled sideways.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  CheckCircle2,
  Copy,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  conversionRate,
  conversionTone,
  formatCount,
  formatCreatedDate,
  formatCreatedTime,
  formatPercent,
  STATUS_META,
  typeMeta,
  type AutomationListItem,
  type AutomationStatus,
} from "@/lib/automations/list";
import {
  duplicateAutomation,
  setAutomationStatus,
} from "@/app/(app)/automations/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const HEAD =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted";
const HEAD_NUM = `${HEAD} text-right`;
const CELL = "px-4 py-3 align-middle";

export function AutomationsTable({
  rows,
  selected,
  onToggleRow,
  onToggleAll,
  onRequestDelete,
}: {
  rows: AutomationListItem[];
  selected: Set<string>;
  onToggleRow: (id: string, next: boolean) => void;
  onToggleAll: (next: boolean) => void;
  onRequestDelete: (item: AutomationListItem) => void;
}) {
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someChecked = rows.some((r) => selected.has(r.id));
  const headState: boolean | "indeterminate" = allChecked
    ? true
    : someChecked
      ? "indeterminate"
      : false;

  return (
    <>
      {/* Desktop / tablet — the full grid. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-default">
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={headState}
                  onCheckedChange={(v) => onToggleAll(v === true)}
                  aria-label="Select all automations on this page"
                />
              </th>
              <th className={HEAD}>Automation</th>
              <th className={HEAD}>Status</th>
              <th className={HEAD_NUM}>Triggers</th>
              <th className={HEAD_NUM}>DMs sent</th>
              <th className={`${HEAD_NUM} hidden lg:table-cell`}>
                Link clicks
              </th>
              <th className={`${HEAD_NUM} hidden lg:table-cell`}>Conversion</th>
              <th className={`${HEAD} hidden xl:table-cell`}>Created</th>
              <th className={`${HEAD} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const { label, icon: Icon } = typeMeta(item.type);
              const rate = conversionRate(item);
              const isSelected = selected.has(item.id);

              return (
                <tr
                  key={item.id}
                  data-selected={isSelected || undefined}
                  className="border-b border-border-subtle transition-colors duration-100 last:border-0 hover:bg-hover-bg data-selected:bg-hover-bg"
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(v) => onToggleRow(item.id, v === true)}
                      aria-label={`Select ${item.name}`}
                    />
                  </td>

                  <td className={CELL}>
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-secondary"
                        aria-hidden
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <Link
                          href={`/automations/${item.id}`}
                          className="block truncate text-[13px] font-medium text-ink hover:text-brand"
                        >
                          {item.name}
                        </Link>
                        <span className="block truncate text-[12px] text-ink-muted">
                          {item.description ?? label}
                        </span>
                      </span>
                    </div>
                  </td>

                  <td className={CELL}>
                    <StatusChip status={item.status} />
                  </td>

                  <td
                    className={`${CELL} wz-font-mono text-right text-[13px] text-ink-secondary`}
                  >
                    {formatCount(item.triggers)}
                  </td>
                  <td
                    className={`${CELL} wz-font-mono text-right text-[13px] text-ink-secondary`}
                  >
                    {formatCount(item.dms_sent)}
                  </td>
                  <td
                    className={`${CELL} wz-font-mono hidden text-right text-[13px] text-ink-secondary lg:table-cell`}
                  >
                    {formatCount(item.link_clicks)}
                  </td>
                  <td className={`${CELL} hidden text-right lg:table-cell`}>
                    <ConversionPill rate={rate} />
                  </td>

                  <td className={`${CELL} hidden xl:table-cell`}>
                    <span className="wz-font-mono block text-[12px] text-ink-secondary">
                      {formatCreatedDate(item.created_at)}
                    </span>
                    <span className="wz-font-mono block text-[11px] text-ink-muted">
                      {formatCreatedTime(item.created_at)}
                    </span>
                  </td>

                  <td className={`${CELL} text-right`}>
                    <RowActions
                      item={item}
                      onRequestDelete={() => onRequestDelete(item)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile — one card per automation. */}
      <div className="divide-y divide-border-subtle md:hidden">
        {rows.map((item) => {
          const { label, icon: Icon } = typeMeta(item.type);
          const rate = conversionRate(item);

          return (
            <div key={item.id} className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={(v) => onToggleRow(item.id, v === true)}
                  aria-label={`Select ${item.name}`}
                  className="mt-1"
                />
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-secondary"
                  aria-hidden
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/automations/${item.id}`}
                    className="block truncate text-[13px] font-medium text-ink"
                  >
                    {item.name}
                  </Link>
                  <span className="block truncate text-[12px] text-ink-muted">
                    {item.description ?? label}
                  </span>
                </div>
                <RowActions
                  item={item}
                  onRequestDelete={() => onRequestDelete(item)}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 pl-[3.25rem]">
                <StatusChip status={item.status} />
                <Metric label="Triggers" value={formatCount(item.triggers)} />
                <Metric label="DMs" value={formatCount(item.dms_sent)} />
                <Metric label="Clicks" value={formatCount(item.link_clicks)} />
                <ConversionPill rate={rate} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[11px] text-ink-muted">
      <span className="wz-font-mono text-[12px] font-medium text-ink-secondary">
        {value}
      </span>{" "}
      {label}
    </span>
  );
}

function StatusChip({ status }: { status: AutomationStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        meta.chip,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}

function ConversionPill({ rate }: { rate: number }) {
  return (
    <span
      className={cn(
        "wz-font-mono inline-flex rounded-md px-1.5 py-0.5 text-[12px] font-medium",
        conversionTone(rate),
      )}
    >
      {formatPercent(rate)}
    </span>
  );
}

// Analytics / edit are direct links; everything destructive or state-changing
// hides one click deep in the kebab.
function RowActions({
  item,
  onRequestDelete,
}: {
  item: AutomationListItem;
  onRequestDelete: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(status: AutomationStatus, message: string) {
    startTransition(async () => {
      const res = await setAutomationStatus(item.id, status);
      if (!res.ok) {
        toast.error("Couldn't update the automation. Try again.");
        return;
      }
      toast.success(message);
    });
  }

  function onDuplicate() {
    startTransition(async () => {
      const res = await duplicateAutomation(item.id);
      if (!res.ok) {
        toast.error(
          res.error === "free_limit"
            ? "You're at your plan's automation limit."
            : "Couldn't duplicate the automation.",
        );
        return;
      }
      toast.success("Automation duplicated as a draft.");
      if (res.id) router.push(`/automations/${res.id}`);
    });
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        className="text-ink-muted hover:bg-surface-muted hover:text-ink"
      >
        <Link
          href={`/automations/${item.id}?tab=analytics`}
          aria-label={`Analytics for ${item.name}`}
        >
          <BarChart3 className="size-4" />
        </Link>
      </Button>

      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        className="text-ink-muted hover:bg-surface-muted hover:text-ink"
      >
        <Link
          href={`/automations/${item.id}`}
          aria-label={`Edit ${item.name}`}
        >
          <Pencil className="size-4" />
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            className="text-ink-muted hover:bg-surface-muted hover:text-ink"
            aria-label={`More actions for ${item.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {item.status === "active" ? (
            <DropdownMenuItem
              onSelect={() => move("paused", "Automation paused.")}
            >
              <Pause className="size-4" />
              Pause
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => move("active", "Automation activated.")}
            >
              <Play className="size-4" />
              Activate
            </DropdownMenuItem>
          )}
          {item.status !== "completed" && (
            <DropdownMenuItem
              onSelect={() => move("completed", "Automation marked complete.")}
            >
              <CheckCircle2 className="size-4" />
              Mark complete
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={onDuplicate}>
            <Copy className="size-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onRequestDelete();
            }}
            className="text-danger focus:text-danger"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
