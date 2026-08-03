// The card view behind the grid toggle. Same facts as a table row, laid out
// for scanning people rather than comparing columns — which is what the view
// is for: it wins when you're looking for someone, the table wins when you're
// working the funnel.

import type { Lead } from "@/lib/leads/model";
import { LeadRowActions } from "./lead-row-menu";
import {
  ActivityCell,
  ConversionCell,
  LeadAvatar,
  SourceCell,
  StatusBadge,
  TagList,
} from "./lead-bits";

export function LeadsGrid({ rows }: { rows: Lead[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 2xl:grid-cols-3">
      {rows.map((lead) => (
        <li
          key={lead.id}
          className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-card p-4 transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-surface-app"
        >
          <div className="flex items-start gap-2.5">
            <LeadAvatar initials={lead.initials} className="size-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">
                {lead.name}
              </p>
              <p className="truncate text-[11px] text-ink-muted">
                {lead.handle ? `@${lead.handle}` : lead.email}
              </p>
            </div>
            <StatusBadge status={lead.status} />
          </div>

          <SourceCell
            source={lead.source}
            label={lead.sourceLabel}
            automationName={lead.automationName}
          />

          <TagList tags={lead.tags} max={3} />

          <div className="flex items-center justify-between gap-2 border-t border-border-subtle pt-2.5">
            <div className="flex min-w-0 flex-col gap-1">
              <ActivityCell lead={lead} />
              <ConversionCell conversion={lead.conversion} />
            </div>
            <LeadRowActions lead={lead} />
          </div>
        </li>
      ))}
    </ul>
  );
}
