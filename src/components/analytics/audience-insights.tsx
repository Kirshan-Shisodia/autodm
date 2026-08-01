// Audience Insights — reserved surface. Geography needs an IP→country lookup
// over link_clicks.ip_address, which nothing writes or resolves today, so the
// card states the gap and what would unlock it rather than showing a mock.

import { Globe2 } from "lucide-react";

import { AnalyticsCard, NotTracked } from "./card";

export function AudienceInsights() {
  return (
    <AnalyticsCard title="Audience Insights">
      <div className="flex flex-col items-center gap-3 py-3 text-center">
        <span
          className="flex size-9 items-center justify-center rounded-lg bg-surface-muted text-ink-muted"
          aria-hidden
        >
          <Globe2 className="size-4.5" />
        </span>
        <p className="max-w-[240px] text-[12px] leading-[18px] text-ink-tertiary">
          Country and device breakdowns need geo-resolution on link clicks. The
          raw IPs are captured — the lookup isn&rsquo;t wired up yet.
        </p>
      </div>

      <NotTracked
        label="Coming in a later phase"
        detail="Top countries, devices, and referrers, derived from link_clicks."
        className="mt-1"
      />
    </AnalyticsCard>
  );
}
