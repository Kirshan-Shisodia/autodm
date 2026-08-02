"use client";

// The /settings chrome: page header, the ten-section tab strip, and the
// two-column body every panel renders into.
//
// The active section is client state mirrored into `?section=` with
// `replaceState`. That gives deep links and a working back button without a
// server round-trip per tab — the data for all ten sections was already
// fetched once by the page, so re-rendering is free and a navigation would
// only add latency.

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CircleHelp, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SETTINGS_SECTIONS,
  isSectionId,
  type SectionId,
  type SettingsData,
} from "@/lib/settings/model";
import { GeneralSection } from "./sections/general";
import { ConnectedAccountsSection } from "./sections/connected-accounts";
import { TeamMembersSection } from "./sections/team-members";
import { NotificationsSection } from "./sections/notifications";
import { AutomationDefaultsSection } from "./sections/automation-defaults";
import { DmSettingsSection } from "./sections/dm-settings";
import { DataPrivacySection } from "./sections/data-privacy";
import { IntegrationsSection } from "./sections/integrations";
import { ApiWebhooksSection } from "./sections/api-webhooks";
import { DangerZoneSection } from "./sections/danger-zone";
import { SECTION_ICONS } from "./section-icons";

const PANELS: Record<
  SectionId,
  (props: { data: SettingsData }) => React.ReactElement
> = {
  general: GeneralSection,
  accounts: ConnectedAccountsSection,
  team: TeamMembersSection,
  notifications: NotificationsSection,
  automation: AutomationDefaultsSection,
  dm: DmSettingsSection,
  privacy: DataPrivacySection,
  integrations: IntegrationsSection,
  api: ApiWebhooksSection,
  danger: DangerZoneSection,
};

/** Per-tab counters shown as a small chip, e.g. "Team Members 6". */
function badges(data: SettingsData): Partial<Record<SectionId, number>> {
  return {
    accounts: data.accounts.filter((a) => a.status !== "not_connected").length,
    team: data.team.length,
    integrations: data.integrations.filter((i) => i.status === "connected")
      .length,
  };
}

export function SettingsShell({
  data,
  initialSection,
}: {
  data: SettingsData;
  initialSection: SectionId;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [section, setSection] = React.useState<SectionId>(initialSection);
  const [query, setQuery] = React.useState("");

  // Back/forward should move between tabs, so the URL wins whenever it changes.
  // Adjusted during render rather than in an effect: the browser never paints
  // the previous tab on the way to the one the URL asked for.
  const urlSection = params.get("section");
  const [lastUrlSection, setLastUrlSection] = React.useState(urlSection);

  if (urlSection !== lastUrlSection) {
    setLastUrlSection(urlSection);
    const next: SectionId = isSectionId(urlSection ?? undefined)
      ? (urlSection as SectionId)
      : "general";
    if (next !== section) setSection(next);
  }

  const go = (next: SectionId) => {
    setSection(next);
    router.replace(
      next === "general" ? pathname : `${pathname}?section=${next}`,
      {
        scroll: false,
      },
    );
  };

  const meta = SETTINGS_SECTIONS.find((s) => s.id === section)!;
  const counters = badges(data);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SETTINGS_SECTIONS;
    return SETTINGS_SECTIONS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) || s.blurb.toLowerCase().includes(q),
    );
  }, [query]);

  const Panel = PANELS[section];

  return (
    // Capped so an ultrawide monitor doesn't stretch a settings row into a
    // label at one edge and a toggle at the other.
    <div className="mx-auto max-w-[1800px] space-y-5">
      {/* ---------------- Page header ---------------- */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1
            className={cn(
              "text-[26px] leading-tight font-semibold tracking-[-0.4px] max-sm:text-[22px]",
              section === "danger" ? "text-danger" : "text-ink",
            )}
          >
            {meta.title}
          </h1>
          <p className="mt-1 text-[13px] text-ink-tertiary">{meta.blurb}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all settings…"
              aria-label="Search all settings"
              className="h-9 w-[240px] rounded-lg border border-border-default bg-surface-card pr-3 pl-9 text-[13px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>
          <Link
            href="/help"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-default bg-surface-card px-3 text-[13px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <CircleHelp className="size-4 text-ink-muted" aria-hidden />
            Help
          </Link>
        </div>
      </div>

      {/* ---------------- Section strip ---------------- */}
      <div className="rounded-xl border border-border-default bg-surface-card px-4 py-3">
        <p className="text-[10px] font-medium tracking-[0.6px] text-ink-muted uppercase">
          Settings sections
          <span className="ml-2 normal-case">
            {visible.length} section{visible.length === 1 ? "" : "s"}
          </span>
        </p>

        <div
          role="tablist"
          aria-label="Settings sections"
          className="mt-2.5 flex flex-wrap items-center gap-1"
        >
          {visible.map((item) => {
            const active = item.id === section;
            const danger = item.id === "danger";
            const Icon = SECTION_ICONS[item.id];
            const count = counters[item.id];

            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => go(item.id)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors duration-100 [transition-timing-function:var(--ease-standard)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
                  active
                    ? danger
                      ? "border-danger/25 bg-danger-bg text-danger"
                      : "border-border-default bg-surface-card text-ink shadow-floating"
                    : danger
                      ? "border-transparent text-danger/80 hover:bg-danger-bg"
                      : "border-transparent text-ink-secondary hover:bg-hover-bg hover:text-ink",
                )}
              >
                <Icon className="size-4 opacity-70" aria-hidden />
                {item.label}
                {count !== undefined && count > 0 && (
                  <span className="rounded-full bg-surface-muted px-1.5 py-px text-[10px] font-medium text-ink-tertiary">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------- Body: panel + summary rail ----------------
          Each panel renders its content and its rail as sibling grid children.
          Sections that opt into `footerStrip` add a third child which spans
          both columns, so the rail's prompt cards land on a full-width row
          underneath instead of extending the rail past the content. */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_292px]">
        <Panel data={data} />
      </div>
    </div>
  );
}
