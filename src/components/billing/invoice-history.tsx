// Invoice history. A quiet HALO data table: white, gridded, flat. Status is
// never colour-only — every chip carries its word. Under md the grid collapses
// into one card per invoice; a data table is never scrolled sideways.

import Link from "next/link";
import { ArrowRight, Download, FileText, Receipt } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatDate,
  formatINR,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/billing";

const HEAD =
  "px-4 py-3 text-left text-[11px] font-semibold tracking-[0.06em] text-ink-muted uppercase";
const CELL = "px-4 py-3.5 align-middle";

const STATUS_META: Record<InvoiceStatus, { label: string; chip: string }> = {
  paid: { label: "Paid", chip: "bg-success-bg text-success" },
  due: { label: "Due", chip: "bg-warning-bg text-warning-text" },
  failed: { label: "Failed", chip: "bg-danger-bg text-danger" },
  refunded: { label: "Refunded", chip: "bg-surface-muted text-ink-tertiary" },
};

function StatusChip({ status }: { status: InvoiceStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        meta.chip,
      )}
    >
      {meta.label}
    </span>
  );
}

/** Download is a real link when we have a PDF, and inert-but-labelled when not. */
function DownloadAction({ invoice }: { invoice: Invoice }) {
  const base =
    "inline-flex size-8 items-center justify-center rounded-lg border border-border-default";

  if (!invoice.downloadUrl) {
    return (
      <span
        className={cn(base, "cursor-not-allowed bg-surface-muted text-ink-muted")}
        title="Invoice PDF is not available yet"
        aria-label={`Invoice ${invoice.id} PDF not available yet`}
      >
        <Download className="size-3.5" aria-hidden />
      </span>
    );
  }

  return (
    <a
      href={invoice.downloadUrl}
      className={cn(
        base,
        "bg-surface-card text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
      )}
      aria-label={`Download invoice ${invoice.id}`}
    >
      <Download className="size-3.5" aria-hidden />
    </a>
  );
}

export function InvoiceHistory({ invoices }: { invoices: Invoice[] }) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card">
      <h2 className="border-b border-border-default px-4 py-3.5 text-[13px] font-semibold text-ink">
        Invoice History
      </h2>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <span
            className="flex size-11 items-center justify-center rounded-full bg-surface-muted text-ink-tertiary"
            aria-hidden
          >
            <Receipt className="size-5" />
          </span>
          <h3 className="mt-4 text-[14px] font-semibold text-ink">
            No invoices yet
          </h3>
          <p className="mt-1 max-w-sm text-[13px] text-ink-tertiary">
            Your first invoice appears here once a paid billing cycle closes.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet — the full grid. */}
          <div className="hidden md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className={HEAD}>Invoice ID</th>
                  <th className={HEAD}>Date</th>
                  <th className={`${HEAD} text-right`}>Amount</th>
                  <th className={HEAD}>Status</th>
                  <th className={`${HEAD} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-border-subtle last:border-b-0"
                  >
                    <td className={CELL}>
                      <span className="flex items-center gap-2.5">
                        <FileText
                          className="size-4 shrink-0 text-ink-muted"
                          aria-hidden
                        />
                        <span className="wz-font-mono text-[13px] font-medium text-ink">
                          {invoice.id}
                        </span>
                      </span>
                    </td>
                    <td className={`${CELL} text-[13px] text-ink-secondary`}>
                      {formatDate(invoice.date)}
                    </td>
                    <td
                      className={`${CELL} wz-font-mono text-right text-[13px] font-medium text-ink`}
                    >
                      {formatINR(invoice.amountPaise)}
                    </td>
                    <td className={CELL}>
                      <StatusChip status={invoice.status} />
                    </td>
                    <td className={`${CELL} text-right`}>
                      <DownloadAction invoice={invoice} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile — one card per invoice. */}
          <ul className="divide-y divide-border-subtle md:hidden">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="wz-font-mono truncate text-[13px] font-medium text-ink">
                    {invoice.id}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-muted">
                    {formatDate(invoice.date)} ·{" "}
                    <span className="wz-font-mono">
                      {formatINR(invoice.amountPaise)}
                    </span>
                  </p>
                </div>
                <StatusChip status={invoice.status} />
                <DownloadAction invoice={invoice} />
              </li>
            ))}
          </ul>

          <div className="border-t border-border-default px-4 py-3.5 text-center">
            <Link
              href="/billing/invoices"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              View all invoices
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
