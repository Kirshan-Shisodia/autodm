"use client";

// Settings › Integrations — third-party tools this workspace can push events
// into. The catalog is static; what varies per user is the `integrations` row
// that records whether a provider is connected.
//
// Layout: 6/6, two cards of three tools. One card per fine-grained category
// produced four single-row cards inside 96px of chrome each — the worst
// density in the module. Grouping into two families keeps the meaning and
// halves the height. The filter chips now filter rows; a card with nothing
// left to show hides itself.
//
// No third-party logos are bundled — each tile is a monogram on a HALO tint,
// which keeps the design system closed and avoids shipping trademarked marks.

import * as React from "react";
import { Blocks, Link2, PlugZap, RefreshCw, Zap } from "lucide-react";

import {
  INTEGRATION_CATALOG,
  formatDate,
  type IntegrationCatalogEntry,
  type SettingsData,
} from "@/lib/settings/model";
import { setIntegration } from "@/app/(app)/settings/actions";
import {
  Chip,
  EmptyState,
  GhostButton,
  ListRow,
  Monogram,
  SettingsCard,
  SettingsColumn,
  SettingsColumns,
} from "../primitives";
import { NeedHelpCard, PromptCard, SummaryRail } from "../summary-rail";
import { useAction } from "../use-section-form";

const CATEGORIES = [
  "All",
  "Automation",
  "Communication",
  "CRM",
  "Analytics",
  "Commerce",
] as const;

/** The two families the catalog's five categories collapse into. */
const FAMILIES = [
  {
    title: "Automation & Data",
    blurb:
      "Fan events out to the rest of your stack, or park them somewhere you can slice them.",
    categories: ["Automation", "Analytics"],
  },
  {
    title: "Communication & Commerce",
    blurb:
      "Tell your team what happened, and tie conversations back to customers.",
    categories: ["Communication", "CRM", "Commerce"],
  },
] as const;

export function IntegrationsSection({ data }: { data: SettingsData }) {
  const [category, setCategory] =
    React.useState<(typeof CATEGORIES)[number]>("All");

  const byProvider = new Map(data.integrations.map((i) => [i.provider, i]));

  const entriesFor = (family: (typeof FAMILIES)[number]) =>
    INTEGRATION_CATALOG.filter(
      (e) =>
        (family.categories as readonly string[]).includes(e.category) &&
        (category === "All" || e.category === category),
    );

  const connected = INTEGRATION_CATALOG.filter(
    (e) => byProvider.get(e.provider)?.status === "connected",
  ).length;

  const visible = FAMILIES.map((family) => ({
    family,
    entries: entriesFor(family),
  })).filter((group) => group.entries.length > 0);

  return (
    <>
      <div className="space-y-6">
        <FilterChips value={category} onChange={setCategory} />

        <SettingsColumns>
          {visible.length === 0 ? (
            <SettingsColumn span={6} span3xl={6}>
              <SettingsCard
                title="Integrations"
                blurb="Connect ChatPilott to the tools your team already runs on."
              >
                <EmptyState>Nothing in this category yet.</EmptyState>
              </SettingsCard>
            </SettingsColumn>
          ) : (
            visible.map(({ family, entries }) => (
              <SettingsColumn key={family.title} span={6}>
                <SettingsCard title={family.title} blurb={family.blurb}>
                  {entries.map((entry) => (
                    <IntegrationRow
                      key={entry.provider}
                      entry={entry}
                      status={
                        byProvider.get(entry.provider)?.status ?? "disconnected"
                      }
                      connectedAt={
                        byProvider.get(entry.provider)?.connected_at ?? null
                      }
                    />
                  ))}
                </SettingsCard>
              </SettingsColumn>
            ))
          )}
        </SettingsColumns>
      </div>

      <SummaryRail
        title="Integrations Summary"
        blurb={`${connected} / ${INTEGRATION_CATALOG.length} integrations connected`}
        footerStrip
        items={[
          {
            icon: PlugZap,
            label: "Connected",
            value: `${connected} tool${connected === 1 ? "" : "s"}`,
            tone: "success",
          },
          {
            icon: Blocks,
            label: "Available",
            value: `${INTEGRATION_CATALOG.length - connected} to explore`,
          },
          {
            icon: Zap,
            label: "Events",
            value: "Leads, DMs, failures",
            tone: "brand",
          },
          { icon: RefreshCw, label: "Sync", value: "Real time" },
        ]}
      >
        <PromptCard
          title="Don't see your tool?"
          body="Anything not listed here can be wired up with a webhook endpoint or the REST API."
          cta="Open API & Webhooks"
          href="/settings?section=api"
        />
        <NeedHelpCard topic="connecting third-party integrations" />
      </SummaryRail>
    </>
  );
}

/** Category filter above the cards. Filters rows, then hides empty cards. */
function FilterChips({
  value,
  onChange,
}: {
  value: (typeof CATEGORIES)[number];
  onChange: (value: (typeof CATEGORIES)[number]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className={`inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-medium transition-colors duration-100 [transition-timing-function:var(--ease-standard)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${
            value === c
              ? "border-brand/30 bg-selected-bg text-brand"
              : "border-border-default bg-surface-card text-ink-tertiary hover:bg-hover-bg hover:text-ink"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function IntegrationRow({
  entry,
  status,
  connectedAt,
}: {
  entry: IntegrationCatalogEntry;
  status: "connected" | "disconnected" | "error";
  connectedAt: string | null;
}) {
  const { pending, run } = useAction();
  const connected = status === "connected";

  return (
    <ListRow>
      <Monogram text={entry.monogram} className={entry.tile} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">
          {entry.name}
        </p>
        <p className="truncate text-[11px] text-ink-tertiary">
          {connected ? `Connected on ${formatDate(connectedAt)}` : entry.blurb}
        </p>
      </div>

      <Chip
        tone={status === "error" ? "danger" : connected ? "success" : "neutral"}
      >
        {status === "error"
          ? "Needs attention"
          : connected
            ? "Connected"
            : "Not Connected"}
      </Chip>

      <GhostButton
        tone={connected ? "neutral" : "brand"}
        className="h-8 px-3 text-[12px]"
        disabled={pending}
        onClick={() =>
          run(
            () =>
              setIntegration({ provider: entry.provider, connect: !connected }),
            {
              success: connected
                ? `${entry.name} disconnected.`
                : `${entry.name} connected.`,
            },
          )
        }
      >
        <Link2 className="size-3.5" aria-hidden />
        {connected ? "Disconnect" : "Connect"}
      </GhostButton>
    </ListRow>
  );
}
