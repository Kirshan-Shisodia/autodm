// CSV export for the Leads screen.
//
// It re-runs the exact query the page ran, from the same search params, so the
// download can never disagree with what was on screen. Sectioned rather than
// one flat table — a spreadsheet reader wants the summary and the rows in one
// file, not two downloads.
//
// Deliberately exports the whole filtered set, not the visible page: the
// pagination is a reading convenience, not part of what the user asked for.

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  STATUS_LABEL,
  CONVERSION_LABEL,
  csvRows,
  formatDeltaSigned,
  parseFilters,
  parseRange,
  parseSearch,
  parseTab,
  rangeLabel,
  resolveRange,
} from "@/lib/leads/model";
import { loadLeads } from "@/lib/leads/query";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const rangeKey = parseRange(sp.get("range"));
  const range = resolveRange(rangeKey);
  const filters = parseFilters({
    accounts: sp.get("accounts"),
    automations: sp.get("automations"),
    sources: sp.get("sources"),
    tags: sp.get("tags"),
  });
  const tab = parseTab(sp.get("tab"));
  const search = parseSearch(sp.get("q"));

  let data;
  try {
    data = await loadLeads({
      supabase,
      userId: user.id,
      range,
      filters,
      tab,
      search,
      page: 1,
      // Page size is a screen concern. The file gets everything that matched.
      perPage: Number.MAX_SAFE_INTEGER,
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  const label = (ids: string[], options: { id: string; label: string }[]) =>
    ids.length
      ? ids.map((id) => options.find((o) => o.id === id)?.label ?? id).join(" | ")
      : "All";

  const sections: string[] = [];

  sections.push(
    csvRows([
      ["ChatPilott — Leads export"],
      ["Generated", new Date().toISOString()],
      ["Range", rangeLabel(rangeKey)],
      ["From", range.start.toISOString()],
      ["To", range.end.toISOString()],
      ["Tab", tab === "all" ? "All leads" : STATUS_LABEL[tab]],
      ["Search", search || "None"],
      ["Accounts", label(filters.accounts, data.options.accounts)],
      ["Automations", label(filters.automations, data.options.automations)],
      ["Sources", filters.sources.length ? filters.sources.join(" | ") : "All"],
      ["Tags", filters.tags.length ? filters.tags.join(" | ") : "All"],
      ...(data.truncated
        ? [["Note", "Row cap reached — totals are a lower bound."]]
        : []),
    ]),
  );

  sections.push(
    csvRows([
      [],
      ["Summary"],
      ["Metric", "Value", `Change (${data.comparisonLabel})`],
      ...data.metrics.map((m) => [m.label, m.display, formatDeltaSigned(m.delta)]),
    ]),
  );

  sections.push(
    csvRows([
      [],
      ["Leads by source"],
      ["Source", "Leads", "Share %"],
      ...data.sourceSlices.map((s) => [s.label, s.count, s.pct.toFixed(1)]),
    ]),
  );

  sections.push(
    csvRows([
      [],
      ["Leads"],
      [
        "Name",
        "Instagram handle",
        "Email",
        "Source",
        "Automation",
        "Status",
        "Conversion",
        "Tags",
        "Revenue (INR)",
        "Created at",
        "Last activity",
      ],
      ...data.allInScope.map((l) => [
        l.name,
        l.handle ? `@${l.handle}` : "",
        l.email,
        l.sourceLabel,
        l.automationName ?? "",
        STATUS_LABEL[l.status],
        CONVERSION_LABEL[l.conversion],
        l.tags.join(" | "),
        l.revenue.toFixed(2),
        l.createdAt,
        l.lastActivity,
      ]),
    ]),
  );

  // A leading BOM so Excel opens the file as UTF-8 rather than mangling any
  // non-ASCII name in the first column.
  const body = `﻿${sections.join("\r\n")}\r\n`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="chatpilott-leads-${rangeKey}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
