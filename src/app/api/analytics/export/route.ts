// CSV export for the Analytics screen.
//
// It re-runs the exact query the page ran, from the same search params, so the
// download can never disagree with what was on screen. Sectioned rather than
// one flat table — a spreadsheet reader wants the summary and the daily series
// in one file, not two downloads.

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  csvRows,
  formatDeltaSigned,
  formatPercent,
  parseFilters,
  parseRange,
  rangeLabel,
  resolveRange,
} from "@/lib/analytics/model";
import { loadAnalytics } from "@/lib/analytics/query";

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
    statuses: sp.get("statuses"),
  });

  let data;
  try {
    data = await loadAnalytics({ supabase, userId: user.id, range, filters });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  const accountLabels = filters.accounts.length
    ? filters.accounts
        .map((id) => data.options.accounts.find((a) => a.id === id)?.label ?? id)
        .join(" | ")
    : "All";
  const automationLabels = filters.automations.length
    ? filters.automations
        .map((id) => data.options.automations.find((a) => a.id === id)?.label ?? id)
        .join(" | ")
    : "All";

  const sections: string[] = [];

  sections.push(
    csvRows([
      ["ChatPilott — Analytics export"],
      ["Generated", new Date().toISOString()],
      ["Range", rangeLabel(rangeKey)],
      ["From", range.start.toISOString()],
      ["To", range.end.toISOString()],
      ["Accounts", accountLabels],
      ["Automations", automationLabels],
      ["DM statuses", filters.statuses.length ? filters.statuses.join(" | ") : "All"],
      ...(data.truncated
        ? [["Note", "Row cap reached — totals are a lower bound."]]
        : []),
      ...(data.statusScoped
        ? [
            [
              "Note",
              "DM-status filter applies to DMs and link clicks. Leads carry no status, so lead counts are unfiltered.",
            ],
          ]
        : []),
    ]),
  );

  sections.push(
    csvRows([
      [],
      ["Metrics overview"],
      ["Metric", "This period", "Previous period", "Change"],
      ...data.metricsTable.map((r) => [
        r.label,
        r.stub ? "not tracked" : r.current,
        r.stub ? "not tracked" : r.previous,
        r.stub ? "" : formatDeltaSigned(r.delta),
      ]),
    ]),
  );

  sections.push(
    csvRows([
      [],
      ["Conversion funnel"],
      ["Stage", "Count", "Share of triggers"],
      ...data.funnel.map((s) => [
        s.label,
        s.stub ? "not tracked" : s.value,
        s.stub ? "" : formatPercent(s.pct),
      ]),
    ]),
  );

  sections.push(
    csvRows([
      [],
      ["Top automations"],
      ["Automation", "Type", "DMs sent", "Link clicks", "Conversion rate"],
      ...data.topAutomations.map((a) => [
        a.name,
        a.type,
        a.dmsSent,
        a.linkClicks,
        a.conversionRate === null ? "" : formatPercent(a.conversionRate),
      ]),
    ]),
  );

  sections.push(
    csvRows([
      [],
      [range.unit === "week" ? "Weekly series" : "Daily series"],
      ["Bucket start", "DMs sent", "Link clicks"],
      // `point.date` is the local calendar day. Slicing `point.t` would print
      // the UTC day, which is off by one east of Greenwich and would disagree
      // with the axis label the user was looking at.
      ...data.chart.dmsSent.map((point, i) => [
        point.date,
        point.value,
        data.chart.linkClicks[i]?.value ?? 0,
      ]),
    ]),
  );

  // BOM so Excel opens UTF-8 (the ₹ and en-dashes) without mangling it.
  const body = `﻿${sections.join("\r\n")}\r\n`;
  const filename = `chatpilott-analytics-${rangeKey}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
