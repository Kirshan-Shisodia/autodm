"use client";

// The Automations screen. One client component owns the view state — search,
// tab, filters, sort, selection, paging — and derives everything else in a
// single pass. The server hands it the full row set; nothing here refetches.
//
// HALO v4 throughout (halo-tokensv4.json): cream page, white flat surfaces,
// hairline #E7E2DA borders, amber brand for the one selected thing on screen.

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  countByStatus,
  countCreatedSince,
  EMPTY_FILTERS,
  filterAutomations,
  LIST_TABS,
  PAGE_SIZES,
  paginate,
  SORT_OPTIONS,
  sortAutomations,
  typeMeta,
  type AutomationListItem,
  type ListFilters,
  type ListTab,
  type SortKey,
} from "@/lib/automations/list";
import {
  bulkDeleteAutomations,
  bulkSetStatus,
  deleteAutomation,
} from "@/app/(app)/automations/actions";
import { AutomationsTable } from "./automations-table";
import { StatCards } from "./stat-cards";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DATE_FILTERS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
] as const;

export function AutomationsScreen({
  automations,
  newHref,
}: {
  automations: AutomationListItem[];
  newHref: string;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ListTab>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [filters, setFilters] = useState<ListFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<AutomationListItem | null>(
    null,
  );
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => countByStatus(automations), [automations]);
  const deltas = useMemo(() => countCreatedSince(automations), [automations]);

  const availableTypes = useMemo(
    () => Array.from(new Set(automations.map((a) => a.type))).sort(),
    [automations],
  );

  const visible = useMemo(
    () =>
      sortAutomations(
        filterAutomations(automations, { tab, query, filters }),
        sort,
      ),
    [automations, tab, query, filters, sort],
  );

  const { rows, info } = useMemo(
    () => paginate(visible, page, pageSize),
    [visible, page, pageSize],
  );

  const activeFilterCount =
    filters.types.length + (filters.createdWithinDays === null ? 0 : 1);
  const selectedIds = useMemo(() => [...selected], [selected]);

  // Any change to what's on screen resets the cursor — page 4 of a 1-page
  // result is a dead end.
  function resetPage() {
    setPage(1);
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function toggleRow(id: string, next: boolean) {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  function toggleAll(next: boolean) {
    setSelected((prev) => {
      const copy = new Set(prev);
      for (const row of rows) {
        if (next) copy.add(row.id);
        else copy.delete(row.id);
      }
      return copy;
    });
  }

  function runBulkStatus(status: string, verb: string) {
    startTransition(async () => {
      const res = await bulkSetStatus(selectedIds, status);
      if (!res.ok) {
        toast.error("Couldn't update the selected automations.");
        return;
      }
      toast.success(
        `${res.count} automation${res.count === 1 ? "" : "s"} ${verb}.`,
      );
      clearSelection();
    });
  }

  function runBulkDelete() {
    startTransition(async () => {
      const res = await bulkDeleteAutomations(selectedIds);
      if (!res.ok) {
        toast.error("Couldn't delete the selected automations.");
        return;
      }
      toast.success(
        `${res.count} automation${res.count === 1 ? "" : "s"} deleted.`,
      );
      clearSelection();
      setBulkDeleteOpen(false);
    });
  }

  const nothingAtAll = automations.length === 0;

  return (
    <div className="space-y-5">
      {/* ---------------- Page header ---------------- */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.4px] text-ink max-sm:text-[22px]">
            Automations
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">
            Manage and monitor your Instagram DM automations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
              placeholder="Search automations..."
              aria-label="Search automations"
              className="h-9 w-full rounded-lg border border-border-default bg-surface-card pl-9 pr-3 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-muted focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 sm:w-64"
            />
          </div>

          <FiltersMenu
            filters={filters}
            availableTypes={availableTypes}
            activeCount={activeFilterCount}
            onChange={(next) => {
              setFilters(next);
              resetPage();
            }}
          />

          <Button
            asChild
            className="h-9 rounded-lg bg-action px-3.5 text-[13px] text-white hover:bg-action-hover"
          >
            <Link href={newHref}>
              <Plus className="size-4" />
              New Automation
            </Link>
          </Button>
        </div>
      </div>

      {/* ---------------- Stats strip ---------------- */}
      <StatCards
        counts={counts}
        deltas={deltas}
        activeTab={tab}
        onSelect={(next) => {
          setTab(next);
          resetPage();
        }}
      />

      {/* ---------------- Table surface ---------------- */}
      <div className="rounded-xl border border-border-default bg-surface-card">
        <div className="flex flex-col gap-3 border-b border-border-default px-4 pt-1 lg:flex-row lg:items-center lg:justify-between">
          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Filter automations by status"
            className="-mb-px flex flex-wrap items-center gap-1 overflow-x-auto"
          >
            {LIST_TABS.map((t) => {
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => {
                    setTab(t.value);
                    resetPage();
                  }}
                  className={cn(
                    "relative whitespace-nowrap px-3 py-3 text-[13px] font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    active
                      ? "text-brand after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand"
                      : "text-ink-tertiary hover:text-ink",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Bulk actions + sort */}
          <div className="flex items-center gap-2 pb-3 lg:pb-0">
            {selectedIds.length > 0 && (
              <span className="wz-font-mono text-[12px] text-ink-tertiary">
                {selectedIds.length} selected
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={selectedIds.length === 0 || pending}
                  className="h-8 rounded-lg border-border-default bg-surface-card text-[13px] text-ink-secondary hover:bg-hover-bg"
                >
                  Bulk Actions
                  <ChevronDown className="size-3.5 text-ink-muted" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={() => runBulkStatus("active", "activated")}
                >
                  Activate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => runBulkStatus("paused", "paused")}
                >
                  Pause
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => runBulkStatus("completed", "marked complete")}
                >
                  Mark complete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setBulkDeleteOpen(true);
                  }}
                  className="text-danger focus:text-danger"
                >
                  Delete selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 rounded-lg border-border-default bg-surface-card text-[13px] text-ink-secondary hover:bg-hover-bg"
                >
                  <span className="text-ink-muted">Sort by:</span>
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  <ChevronDown className="size-3.5 text-ink-muted" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(v) => {
                    setSort(v as SortKey);
                    resetPage();
                  }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <DropdownMenuRadioItem key={o.value} value={o.value}>
                      {o.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {nothingAtAll ? (
          <EmptyState newHref={newHref} />
        ) : rows.length === 0 ? (
          <NoResults
            onClear={() => {
              setQuery("");
              setTab("all");
              setFilters(EMPTY_FILTERS);
              resetPage();
            }}
          />
        ) : (
          <>
            <AutomationsTable
              rows={rows}
              selected={selected}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
              onRequestDelete={setDeleteTarget}
            />
            <Pagination
              info={info}
              pageSize={pageSize}
              onPage={setPage}
              onPageSize={(size) => {
                setPageSize(size);
                resetPage();
              }}
            />
          </>
        )}
      </div>

      <DeleteDialog
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selectedIds.length} automation${selectedIds.length === 1 ? "" : "s"}?`}
        description="The selected automations and their delivery history will be permanently removed. This can't be undone."
        confirmLabel={pending ? "Deleting…" : "Delete"}
        pending={pending}
        onConfirm={runBulkDelete}
        onOpenChange={setBulkDeleteOpen}
      />
    </div>
  );
}

// ------------------------------------------------------------------
// Toolbar pieces
// ------------------------------------------------------------------

function FiltersMenu({
  filters,
  availableTypes,
  activeCount,
  onChange,
}: {
  filters: ListFilters;
  availableTypes: string[];
  activeCount: number;
  onChange: (next: ListFilters) => void;
}) {
  function toggleType(type: string, next: boolean) {
    const types = next
      ? [...filters.types, type]
      : filters.types.filter((t) => t !== type);
    onChange({ ...filters, types });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 rounded-lg border-border-default bg-surface-card text-[13px] text-ink-secondary hover:bg-hover-bg"
        >
          <SlidersHorizontal className="size-4 text-ink-muted" />
          Filters
          {activeCount > 0 && (
            <span className="wz-font-mono ml-0.5 rounded-full bg-selected-bg px-1.5 text-[11px] font-medium text-brand">
              {activeCount}
            </span>
          )}
          <ChevronDown className="size-3.5 text-ink-muted" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Type</DropdownMenuLabel>
        {availableTypes.length === 0 ? (
          <DropdownMenuItem disabled>No types yet</DropdownMenuItem>
        ) : (
          availableTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={filters.types.includes(type)}
              onCheckedChange={(v) => toggleType(type, v === true)}
              onSelect={(e) => e.preventDefault()}
            >
              {typeMeta(type).label}
            </DropdownMenuCheckboxItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Created</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(filters.createdWithinDays ?? "any")}
          onValueChange={(v) =>
            onChange({
              ...filters,
              createdWithinDays: v === "any" ? null : Number(v),
            })
          }
        >
          <DropdownMenuRadioItem value="any">Any time</DropdownMenuRadioItem>
          {DATE_FILTERS.map((d) => (
            <DropdownMenuRadioItem key={d.value} value={String(d.value)}>
              {d.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        {activeCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange(EMPTY_FILTERS)}>
              <X className="size-4" />
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Pagination({
  info,
  pageSize,
  onPage,
  onPageSize,
}: {
  info: { page: number; pageCount: number; from: number; to: number; total: number };
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const pages = Array.from({ length: info.pageCount }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-3 border-t border-border-default px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-ink-tertiary">
        Showing{" "}
        <span className="wz-font-mono text-ink-secondary">{info.from}</span> to{" "}
        <span className="wz-font-mono text-ink-secondary">{info.to}</span> of{" "}
        <span className="wz-font-mono text-ink-secondary">{info.total}</span>{" "}
        results
      </p>

      <div className="flex items-center gap-1.5">
        <PageButton
          disabled={info.page === 1}
          onClick={() => onPage(info.page - 1)}
          label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </PageButton>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === info.page ? "page" : undefined}
            className={cn(
              "wz-font-mono flex size-8 items-center justify-center rounded-lg text-[12px] font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              p === info.page
                ? "bg-selected-bg text-brand"
                : "text-ink-tertiary hover:bg-hover-bg hover:text-ink",
            )}
          >
            {p}
          </button>
        ))}

        <PageButton
          disabled={info.page === info.pageCount}
          onClick={() => onPage(info.page + 1)}
          label="Next page"
        >
          <ChevronRight className="size-4" />
        </PageButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="ml-1 h-8 rounded-lg border-border-default bg-surface-card text-[12px] text-ink-secondary hover:bg-hover-bg"
            >
              <span className="wz-font-mono">{pageSize}</span> per page
              <ChevronDown className="size-3.5 text-ink-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={String(pageSize)}
              onValueChange={(v) => onPageSize(Number(v))}
            >
              {PAGE_SIZES.map((size) => (
                <DropdownMenuRadioItem key={size} value={String(size)}>
                  {size} per page
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function PageButton({
  children,
  disabled,
  onClick,
  label,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-lg border border-border-default text-ink-tertiary transition-colors duration-100 hover:bg-hover-bg hover:text-ink disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------------
// Dialogs + empty states
// ------------------------------------------------------------------

function DeleteDialog({
  target,
  onOpenChange,
}: {
  target: AutomationListItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    if (!target) return;
    const id = target.id;
    startTransition(async () => {
      const res = await deleteAutomation(id);
      if (!res.ok) {
        toast.error("Couldn't delete the automation. Try again.");
        return;
      }
      toast.success("Automation deleted.");
      onOpenChange(false);
    });
  }

  return (
    <ConfirmDialog
      open={target !== null}
      title="Delete this automation?"
      description={`${target ? `"${target.name}" ` : ""}will be permanently removed. This can't be undone.`}
      confirmLabel={pending ? "Deleting…" : "Delete"}
      pending={pending}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
    />
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending}
            className="bg-[#e0413a] text-white hover:bg-[#c8352f]"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// An invitation with a CTA, not an apology.
function EmptyState({ newHref }: { newHref: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-brand">
        <Zap className="size-6" aria-hidden />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-ink">
        No automations yet
      </h2>
      <p className="mt-1 max-w-sm text-[13px] text-ink-tertiary">
        Create one to auto-DM a link when someone comments your keyword.
      </p>
      <Button
        asChild
        className="mt-6 h-9 rounded-lg bg-action px-3.5 text-[13px] text-white hover:bg-action-hover"
      >
        <Link href={newHref}>
          <Plus className="size-4" />
          Create your first automation
        </Link>
      </Button>
    </div>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
        <Search className="size-5" aria-hidden />
      </div>
      <h2 className="mt-3 text-[14px] font-semibold text-ink">
        Nothing matches those filters
      </h2>
      <p className="mt-1 text-[13px] text-ink-tertiary">
        Try a different search, or clear what&apos;s applied.
      </p>
      <Button
        variant="outline"
        onClick={onClear}
        className="mt-5 h-8 rounded-lg border-border-default text-[13px] text-ink-secondary hover:bg-hover-bg"
      >
        Clear filters
      </Button>
    </div>
  );
}
