"use client";

// The Automations list (list spec §4–§6). A quiet HALO data surface: white,
// gridded, calm. The one alive interaction is the on/off toggle — optimistic,
// with a confirming toast. Collapses from a table to cards under md (§11).

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, MoreHorizontal, Pencil, Plus, Trash2, Zap } from "lucide-react";

import {
  formatCreated,
  typeMeta,
  type AutomationListItem,
} from "@/lib/automations/list";
import {
  deleteAutomation,
  duplicateAutomation,
  toggleAutomation,
} from "@/app/(app)/automations/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export function AutomationsTable({
  automations,
}: {
  automations: AutomationListItem[];
}) {
  // The delete confirm is shared (one dialog), opened by any row's menu (§6).
  const [deleteTarget, setDeleteTarget] = useState<AutomationListItem | null>(
    null,
  );

  if (automations.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {/* Desktop / tablet: the full table. */}
      <div className="hidden rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--wz-border)] hover:bg-transparent">
              <TableHead className="text-[var(--wz-text-muted)]">Name</TableHead>
              <TableHead className="text-[var(--wz-text-muted)]">Type</TableHead>
              <TableHead className="text-[var(--wz-text-muted)]">Status</TableHead>
              <TableHead className="text-right text-[var(--wz-text-muted)]">
                DMs today
              </TableHead>
              <TableHead className="hidden text-[var(--wz-text-muted)] lg:table-cell">
                Created
              </TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {automations.map((a) => {
              const { label, icon: Icon } = typeMeta(a.type);
              return (
                <TableRow
                  key={a.id}
                  className="border-[var(--wz-border)] hover:bg-[var(--wz-bg-alt)]"
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/automations/${a.id}`}
                      className="text-[var(--wz-text)] hover:underline"
                    >
                      {a.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 text-[var(--wz-text-muted)]">
                      <Icon className="size-4" aria-hidden />
                      {label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusToggle automation={a} />
                  </TableCell>
                  <TableCell className="wz-font-mono text-right tabular-nums text-[var(--wz-text)]">
                    {a.dms_today}
                  </TableCell>
                  <TableCell className="wz-font-mono hidden tabular-nums text-[var(--wz-text-muted)] lg:table-cell">
                    {formatCreated(a.created_at)}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      automation={a}
                      onDelete={() => setDeleteTarget(a)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: one card per automation — never scroll a table sideways (§11). */}
      <div className="space-y-3 md:hidden">
        {automations.map((a) => {
          const { label, icon: Icon } = typeMeta(a.type);
          return (
            <div
              key={a.id}
              className="rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/automations/${a.id}`}
                    className="block truncate font-medium text-[var(--wz-text)]"
                  >
                    {a.name}
                  </Link>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-[var(--wz-text-muted)]">
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </span>
                </div>
                <RowActions automation={a} onDelete={() => setDeleteTarget(a)} />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <StatusToggle automation={a} />
                <span className="text-sm text-[var(--wz-text-muted)]">
                  <span className="wz-font-mono tabular-nums text-[var(--wz-text)]">
                    {a.dms_today}
                  </span>{" "}
                  DMs today
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteDialog
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </>
  );
}

// The signature interaction (§5): flip immediately, confirm with a toast, and
// revert on error. The radix Switch gives role="switch" + keyboard for free.
function StatusToggle({ automation }: { automation: AutomationListItem }) {
  const [active, setActive] = useState(automation.is_active);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setActive(next); // optimistic
    startTransition(async () => {
      const res = await toggleAutomation(automation.id, next);
      if (!res.ok) {
        setActive(!next); // revert
        toast.error("Couldn't update the automation. Try again.");
      } else {
        toast.success(next ? "Automation activated." : "Automation paused.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={active}
        onCheckedChange={onChange}
        disabled={pending}
        aria-label={`Turn ${automation.name} ${active ? "off" : "on"}`}
      />
      <span
        className="wz-font-mono w-7 text-xs font-medium tabular-nums text-[var(--wz-text-muted)]"
        aria-hidden
      >
        {active ? "ON" : "OFF"}
      </span>
    </div>
  );
}

function RowActions({
  automation,
  onDelete,
}: {
  automation: AutomationListItem;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDuplicate() {
    startTransition(async () => {
      const res = await duplicateAutomation(automation.id);
      if (!res.ok) {
        toast.error(
          res.error === "free_limit"
            ? "You're at your plan's automation limit."
            : "Couldn't duplicate the automation.",
        );
        return;
      }
      toast.success("Automation duplicated.");
      if (res.id) router.push(`/automations/${res.id}`);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-[var(--wz-text-muted)]"
          aria-label={`Actions for ${automation.name}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <Link href={`/automations/${automation.id}`}>
            <Pencil className="size-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDuplicate} disabled={pending}>
          <Copy className="size-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onDelete();
          }}
          className="text-[var(--wz-accent-pop)] focus:text-[var(--wz-accent-pop)]"
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this automation?</DialogTitle>
          <DialogDescription>
            {target ? `"${target.name}" ` : ""}will be permanently removed. This
            can&apos;t be undone.
          </DialogDescription>
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
            className="bg-[var(--wz-accent-pop)] text-white hover:bg-[var(--wz-accent-pop)]/90"
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Spec §9 — an invitation with a CTA, not an apology.
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--wz-r-card)] border border-dashed border-[var(--wz-border)] bg-white px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--wz-bg-alt)] text-[var(--wz-accent)]">
        <Zap className="size-6" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[var(--wz-text)]">
        No automations yet
      </h2>
      <p className="mt-1 max-w-sm text-sm text-[var(--wz-text-muted)]">
        Create one to auto-DM a link when someone comments your keyword.
      </p>
      <Button
        asChild
        className="mt-6 bg-[var(--wz-accent)] text-white hover:bg-[var(--wz-accent-hover)]"
      >
        <Link href="/automations/new">
          <Plus className="size-4" />
          Create your first automation
        </Link>
      </Button>
    </div>
  );
}
