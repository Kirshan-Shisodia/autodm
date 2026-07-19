// Top-performing automation (spec §5.6) — "what's working?". Reads the
// denormalised total_dms_sent / total_clicks counters on `automations` so it's
// a single indexed query, not an aggregation over dm_logs. These are all-time
// totals; range-bounding waits on the deferred date-range toggle (spec §5.6).

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { formatCount } from "@/lib/dashboard";

export type TopAutomation = {
  id: string;
  name: string;
  type: string;
  total_dms_sent: number;
  total_clicks: number;
};

// Human labels for automation.type (matches the wizard's trigger sources).
const TYPE_LABEL: Record<string, string> = {
  post: "Post",
  reel: "Reel",
  story_reply: "Story reply",
  story_mention: "Story mention",
  inbox: "Inbox",
  ad: "Ad",
  facebook_post: "Facebook post",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="wz-font-mono text-xl leading-none font-medium text-[var(--wz-text)]">
        {value}
      </div>
      <div className="mt-1 text-xs text-ink-tertiary">{label}</div>
    </div>
  );
}

export function TopAutomationCard({
  automation,
}: {
  automation: TopAutomation | null;
}) {
  return (
    <section className="rounded-[var(--wz-r-card)] border border-[var(--wz-border)] bg-[var(--wz-bg)] p-5 transition-colors duration-200 [transition-timing-function:var(--ease-standard)] hover:border-border-strong">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium tracking-[0.055em] text-ink-tertiary uppercase">
          Top automation
        </h2>
        {automation && (
          <Link
            href={`/automations/${automation.id}`}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-brand hover:underline"
          >
            View <ArrowUpRight className="size-3.5" />
          </Link>
        )}
      </div>

      {automation === null || automation.total_dms_sent === 0 ? (
        <div className="mt-6 mb-2 text-sm text-[var(--wz-text-muted)]">
          {automation === null ? (
            <>
              Create an automation to see your top performer.{" "}
              <Link
                href="/automations/new"
                className="font-medium text-brand hover:underline"
              >
                New automation
              </Link>
            </>
          ) : (
            "No DMs sent yet — your top performer will appear here."
          )}
        </div>
      ) : (
        <>
          <div className="mt-3">
            <div className="truncate text-base font-semibold text-[var(--wz-text)]">
              {automation.name}
            </div>
            <div className="mt-0.5 text-xs text-ink-tertiary">
              {TYPE_LABEL[automation.type] ?? automation.type}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4">
            <Stat label="DMs sent" value={formatCount(automation.total_dms_sent)} />
            <Stat label="Clicks" value={formatCount(automation.total_clicks)} />
            <Stat
              label="CTR"
              value={
                automation.total_dms_sent > 0
                  ? `${Math.round(
                      (automation.total_clicks / automation.total_dms_sent) * 100,
                    )}%`
                  : "0%"
              }
            />
          </div>
        </>
      )}
    </section>
  );
}
