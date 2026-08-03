// Tests for the Leads model. Everything here is pure, and it's the layer where
// a wrong answer is invisible: a mis-bucketed percentage or an off-by-one page
// range still renders as a perfectly convincing screen.

import { describe, expect, it } from "vitest";

import {
  activityTone,
  conversionOf,
  displayName,
  formatDelta,
  initialsOf,
  isFlat,
  pageInfo,
  pageWindow,
  parseFilters,
  parsePerPage,
  parseRange,
  percentChange,
  pointChange,
  resolveRange,
  relativeTime,
  sourceBreakdown,
  statusBreakdown,
  topTags,
  type LeadStatus,
} from "./model";

const NOW = new Date("2026-08-02T12:00:00.000Z");

describe("conversionOf", () => {
  it("prefers the most committed tag", () => {
    expect(conversionOf(["interested", "customer"])).toBe("customer");
    expect(conversionOf(["support", "interested"])).toBe("support");
    expect(conversionOf(["interested", "fitness"])).toBe("interested");
  });

  it("falls back to new for an untagged lead", () => {
    expect(conversionOf([])).toBe("new");
    expect(conversionOf(["skincare"])).toBe("new");
  });
});

describe("displayName / initialsOf", () => {
  it("humanises a handle", () => {
    expect(displayName("priya.love", "p@example.com")).toBe("Priya Love");
    expect(displayName("aman_verma_07", "a@example.com")).toBe("Aman Verma 07");
  });

  it("falls back to the email local part", () => {
    expect(displayName(null, "neha.kapoor@example.com")).toBe("Neha Kapoor");
  });

  it("takes first and last initials, not the first two", () => {
    expect(initialsOf("Karan Malhotra")).toBe("KM");
    expect(initialsOf("Aman Kumar Verma")).toBe("AV");
    expect(initialsOf("Rahul")).toBe("RA");
  });
});

describe("relativeTime", () => {
  const at = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

  it("reads the way the design does", () => {
    expect(relativeTime(at(30_000), NOW)).toBe("just now");
    expect(relativeTime(at(2 * 60_000), NOW)).toBe("2 minutes ago");
    expect(relativeTime(at(60 * 60_000), NOW)).toBe("1 hour ago");
    expect(relativeTime(at(26 * 3_600_000), NOW)).toBe("1 day ago");
    expect(relativeTime(at(45 * 86_400_000), NOW)).toBe("1 month ago");
  });

  it("never reports the future as a negative age", () => {
    const soon = new Date(NOW.getTime() + 60_000).toISOString();
    expect(relativeTime(soon, NOW)).toBe("just now");
  });

  it("degrades to a dash on an unparseable timestamp", () => {
    expect(relativeTime("not-a-date", NOW)).toBe("—");
  });
});

describe("activityTone", () => {
  it("cools off as the lead goes stale", () => {
    const at = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
    expect(activityTone(at(3_600_000), NOW)).toBe("bg-success");
    expect(activityTone(at(3 * 86_400_000), NOW)).toBe("bg-brand");
    expect(activityTone(at(30 * 86_400_000), NOW)).toBe("bg-border-strong");
  });
});

describe("resolveRange", () => {
  it("aligns the window to whole days", () => {
    const r = resolveRange("30d", NOW);
    expect(r.comparisonLabel).toBe("vs last 30 days");
    // 30 whole buckets: start is 29 days before today's midnight.
    const days = Math.round(
      (new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()).getTime() -
        r.start.getTime()) /
        86_400_000,
    );
    expect(days).toBe(29);
  });

  it("compares like with like — prevEnd shifts `end`, not `start`", () => {
    const r = resolveRange("7d", NOW);
    expect(r.prevEnd).not.toBeNull();
    // The baseline window must be the same length as the current one.
    const current = r.end.getTime() - r.start.getTime();
    const previous = r.prevEnd!.getTime() - r.prevStart!.getTime();
    expect(Math.abs(current - previous)).toBeLessThan(1000);
  });

  it("has no baseline for all-time", () => {
    const r = resolveRange("all", NOW);
    expect(r.prevStart).toBeNull();
    expect(r.prevEnd).toBeNull();
  });

  it("falls back to the default for junk", () => {
    expect(parseRange("nonsense")).toBe("30d");
    expect(parseRange(null)).toBe("30d");
    expect(parseRange("90d")).toBe("90d");
  });
});

describe("deltas", () => {
  it("treats a zero baseline as new, not as infinite growth", () => {
    expect(percentChange(12, 0)).toEqual({ kind: "new" });
    expect(percentChange(0, 0)).toEqual({ kind: "none" });
  });

  it("reports no comparison when there is no prior window", () => {
    expect(percentChange(12, null)).toEqual({ kind: "none" });
  });

  it("moves rates in points, not percent", () => {
    const d = pointChange(24.6, 23.7);
    expect(d).toMatchObject({ kind: "change", unit: "points" });
    expect(formatDelta(d)).toBe("↑0.9pts");
  });

  it("does not put an arrow on a rounding artefact", () => {
    expect(isFlat(percentChange(1000, 1000.2))).toBe(true);
    expect(isFlat(percentChange(100, 90))).toBe(false);
  });
});

describe("breakdowns", () => {
  const counts: Record<LeadStatus, number> = {
    new: 328,
    engaged: 642,
    converted: 186,
    archived: 92,
  };

  it("splits status into shares of the total", () => {
    const slices = statusBreakdown(counts, 1248);
    expect(slices.map((s) => s.count)).toEqual([328, 642, 186, 92]);
    expect(Math.round(slices[1].pct)).toBe(51);
    // The four segments have to close the circle.
    expect(slices.reduce((sum, s) => sum + s.pct, 0)).toBeCloseTo(100, 5);
  });

  it("survives an empty period without dividing by zero", () => {
    const slices = statusBreakdown(
      { new: 0, engaged: 0, converted: 0, archived: 0 },
      0,
    );
    expect(slices.every((s) => s.pct === 0)).toBe(true);
  });

  it("ranks sources and rolls unknown ones into Other", () => {
    const rows = sourceBreakdown(
      { post_comment: 521, reel_comment: 312, manual: 4, dm_conversation: 2 },
      839,
    );
    expect(rows[0].label).toBe("Post Comments");
    expect(rows[1].label).toBe("Reel Comments");
    const other = rows.find((r) => r.key === "other");
    expect(other?.count).toBe(6);
  });

  it("scales tag bars against the leader, not the total", () => {
    const rows = topTags({ interested: 512, new: 428, customer: 186 });
    expect(rows[0].pct).toBe(100);
    expect(Math.round(rows[1].pct)).toBe(84);
  });

  it("breaks tag ties deterministically", () => {
    const rows = topTags({ zeta: 5, alpha: 5 });
    expect(rows.map((r) => r.key)).toEqual(["alpha", "zeta"]);
  });
});

describe("pagination", () => {
  it("counts the visible window from one", () => {
    const info = pageInfo(1, 10, 1248);
    expect(info).toMatchObject({ from: 1, to: 10, totalPages: 125 });
  });

  it("does not run past the end on the last page", () => {
    const info = pageInfo(125, 10, 1248);
    expect(info).toMatchObject({ from: 1241, to: 1248 });
  });

  it("clamps a page number past the end instead of rendering nothing", () => {
    expect(pageInfo(900, 10, 1248).page).toBe(125);
  });

  it("reads as zero of zero when there is nothing to show", () => {
    expect(pageInfo(1, 10, 0)).toMatchObject({
      from: 0,
      to: 0,
      totalPages: 1,
    });
  });

  it("keeps the page control a stable width", () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(1, 125)).toEqual([1, 2, null, 125]);
    expect(pageWindow(60, 125)).toEqual([1, null, 59, 60, 61, null, 125]);
    expect(pageWindow(125, 125)).toEqual([1, null, 124, 125]);
  });

  it("rejects a per-page value that isn't on the menu", () => {
    expect(parsePerPage("25")).toBe(25);
    expect(parsePerPage("9999")).toBe(10);
    expect(parsePerPage(null)).toBe(10);
  });
});

describe("parseFilters", () => {
  it("drops sources that aren't in the vocabulary", () => {
    const f = parseFilters({ sources: "post_comment,wat,reel_comment" });
    expect(f.sources).toEqual(["post_comment", "reel_comment"]);
  });

  it("lowercases tags so the URL and the column agree", () => {
    expect(parseFilters({ tags: "Interested, PRICE" }).tags).toEqual([
      "interested",
      "price",
    ]);
  });

  it("treats empty params as no filter at all", () => {
    const f = parseFilters({ accounts: "", automations: null });
    expect(f.accounts).toEqual([]);
    expect(f.automations).toEqual([]);
  });
});
