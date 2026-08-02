"use client";

// Shared furniture for the ten Settings panels.
//
// Every section is the same three shapes repeated — a flat card with a header
// and one primary action, a stack of labelled rows each holding exactly one
// control, and a summary rail of read-only chips. Building those once here is
// what keeps the panels themselves down to a list of rows.
//
// HALO rules this file encodes: data surfaces are flat (Rule 2), one dark-ink
// primary action per surface (Rule 4), hairline borders rather than shadows,
// and 100ms colour transitions on the standard easing.

import * as React from "react";
import { Select as SelectPrimitive, Switch as SwitchPrimitive } from "radix-ui";
import { Check, ChevronDown, Pencil, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Option } from "@/lib/settings/model";

// ------------------------------------------------------------------
// Card
// ------------------------------------------------------------------

export function SettingsCard({
  title,
  blurb,
  action,
  className,
  children,
}: {
  title: string;
  blurb?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // `flex flex-col` + `flex-1` on the body: grid items stretch to the tallest
    // card in their row, and this makes the card's own body absorb that extra
    // height so trailing links sit on the bottom edge instead of floating
    // mid-card with dead space beneath them.
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border-default bg-surface-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-1">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {blurb && (
            <p className="mt-1 text-[12px] leading-relaxed text-ink-tertiary">
              {blurb}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="flex flex-1 flex-col px-5 pt-3 pb-5">{children}</div>
    </section>
  );
}

/**
 * The content area's column system.
 *
 * Two or three *vertical flows* on a 12-column grid, rather than a grid of
 * equal-height cells. Cards stack inside a column and keep their natural
 * height, which is what removes the dead space a stretch grid creates when a
 * two-row card shares a row with a six-row one.
 *
 * Column heights are balanced by how cards are assigned, not by the browser,
 * so the result is deterministic and identical on server and client.
 *
 * Breakpoints:
 *   < 768   one flow, DOM order
 *   768+    6 / 6 — asymmetric splits are too narrow to be worth it here
 *   1024+   the page's own split (7/5, 8/4, 6/6)
 *   1728+   the page's wide split, with `split3xl` columns going two-up
 */
export function SettingsColumns({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-6 md:grid-cols-12", className)}>
      {children}
    </div>
  );
}

// Tailwind needs literal class names, so spans are looked up rather than
// interpolated.
const SPAN_LG: Record<number, string> = {
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
  7: "lg:col-span-7",
  8: "lg:col-span-8",
};

const SPAN_3XL: Record<number, string> = {
  4: "3xl:col-span-4",
  5: "3xl:col-span-5",
  6: "3xl:col-span-6",
  7: "3xl:col-span-7",
  8: "3xl:col-span-8",
};

export function SettingsColumn({
  span,
  /** Optional wider or narrower footprint from 1728px. Defaults to `span`. */
  span3xl,
  /**
   * At 1728px, lay this column's own cards out two-up instead of stacked.
   * That is how a page reaches a true three-column row on large screens
   * without duplicating markup for a second card-to-column mapping.
   */
  split3xl,
  className,
  children,
}: {
  span: number;
  span3xl?: number;
  split3xl?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:col-span-6",
        SPAN_LG[span],
        SPAN_3XL[span3xl ?? span],
        split3xl && "3xl:grid 3xl:grid-cols-2 3xl:items-start",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A labelled sub-section inside a card — an uppercase micro-label on the same
 * hairline already used between rows. This is what lets two short cards merge
 * into one without losing their hierarchy.
 */
export function CardGroup({
  label,
  action,
  className,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("[&+&]:mt-4", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-2">
        <span className="text-[10px] font-medium tracking-[0.6px] text-ink-muted uppercase">
          {label}
        </span>
        {action}
      </div>
      <div className="pt-1">{children}</div>
    </div>
  );
}

/** Underlined sub-tabs. Used by Notifications for its three channels. */
export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T;
  onChange: (value: T) => void;
  tabs: Array<{ value: T; label: string }>;
}) {
  return (
    <div
      role="tablist"
      className="flex items-center gap-6 border-b border-border-default"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-[13px] font-medium transition-colors duration-100 [transition-timing-function:var(--ease-standard)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
              active
                ? "border-brand text-brand"
                : "border-transparent text-ink-tertiary hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The section-level commit control.
 *
 * Sections whose cards all write one row (Automation Defaults, DM Settings)
 * can't hang "Save Changes" off a single card header any more — once cards
 * flow into rows, that button ends up nowhere near the field being edited.
 * This bar sticks to the bottom of the viewport while the section is dirty and
 * leaves entirely when it isn't, so the resting layout is unchanged.
 */
export function SaveBar({
  dirty,
  pending,
  onSave,
  onDiscard,
  label = "You have unsaved changes",
}: {
  dirty: boolean;
  pending: boolean;
  onSave: () => void;
  onDiscard: () => void;
  label?: string;
}) {
  if (!dirty) return null;

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-card px-4 py-3 shadow-floating">
      <p className="text-[13px] text-ink-secondary">{label}</p>
      <div className="flex items-center gap-2">
        <GhostButton onClick={onDiscard} disabled={pending}>
          Discard
        </GhostButton>
        <PrimaryButton onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save Changes"}
        </PrimaryButton>
      </div>
    </div>
  );
}

/** The one dark-ink button a card is allowed. */
export function PrimaryButton({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-action px-4 text-[13px] font-medium text-ink-inverse transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-action-hover active:bg-action-pressed focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<"button"> & { tone?: "neutral" | "danger" | "brand" }) {
  const tones = {
    neutral:
      "border-border-default bg-surface-card text-ink-secondary hover:bg-hover-bg hover:text-ink",
    brand: "border-border-default bg-surface-card text-brand hover:bg-hover-bg",
    danger: "border-danger/25 bg-danger-bg text-danger hover:bg-danger/10",
  }[tone];

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-colors duration-100 [transition-timing-function:var(--ease-standard)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        tones,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------------------
// Rows
// ------------------------------------------------------------------

const TILE_TONES = {
  neutral: "bg-surface-muted text-ink-secondary",
  brand: "bg-warning-bg text-warning-text",
  amber: "bg-selected-bg text-brand",
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  running: "bg-running-bg text-running",
} as const;

export type TileTone = keyof typeof TILE_TONES;

export function IconTile({
  icon: Icon,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  tone?: TileTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        TILE_TONES[tone],
        className,
      )}
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}

/**
 * A labelled setting. The control is a child rather than a prop so a row can
 * hold a toggle, a select, a stepper or a bespoke editor without this component
 * knowing about any of them.
 */
export function SettingRow({
  icon,
  tone,
  label,
  hint,
  control,
  danger,
  className,
}: {
  icon: LucideIcon;
  tone?: TileTone;
  label: string;
  hint?: string;
  control: React.ReactNode;
  danger?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border-subtle py-3 last:border-b-0",
        className,
      )}
    >
      <IconTile icon={icon} tone={tone ?? (danger ? "danger" : "neutral")} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[13px] font-medium",
            danger ? "text-danger" : "text-ink",
          )}
        >
          {label}
        </p>
        {hint && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink-tertiary">
            {hint}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">{control}</div>
    </div>
  );
}

// ------------------------------------------------------------------
// Controls
// ------------------------------------------------------------------

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-100 [transition-timing-function:var(--ease-standard)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-brand" : "bg-border-strong",
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-surface-canvas transition-transform duration-100 [transition-timing-function:var(--ease-standard)]",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export function SelectField({
  value,
  onChange,
  options,
  disabled,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  label: string;
  className?: string;
}) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        aria-label={label}
        className={cn(
          "inline-flex h-9 min-w-[150px] items-center justify-between gap-2 rounded-lg border border-border-default bg-surface-card px-3 text-[13px] text-ink transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-ink-muted",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder="Select…" />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-ink-muted" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-72 min-w-[--radix-select-trigger-width] overflow-hidden rounded-xl border border-border-default bg-surface-card shadow-floating"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-pointer items-center gap-2 rounded-lg py-2 pr-8 pl-3 text-[13px] text-ink outline-none select-none data-[highlighted]:bg-hover-bg data-[state=checked]:font-medium"
              >
                <SelectPrimitive.ItemText>
                  {option.label}
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5">
                  <Check className="size-3.5 text-brand" aria-hidden />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/** Number + unit, as one control: `[  3  ][ Seconds ]`. */
export function NumberField({
  value,
  onChange,
  unit,
  min = 0,
  max = 100000,
  label,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  unit: string;
  min?: number;
  max?: number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-9 items-stretch overflow-hidden rounded-lg border border-border-default bg-surface-card",
        className,
      )}
    >
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        onChange={(e) => {
          const next = Number(e.target.value);
          // An empty input parses to NaN; hold the previous value rather than
          // writing 0 and silently changing what the user meant.
          if (Number.isNaN(next)) return;
          onChange(Math.min(max, Math.max(min, next)));
        }}
        className="wz-font-mono w-16 bg-transparent px-2.5 text-[13px] text-ink tabular-nums outline-none [appearance:textfield] focus:bg-hover-bg [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="flex items-center border-l border-border-default bg-surface-muted px-2.5 text-[12px] whitespace-nowrap text-ink-tertiary">
        {unit}
      </span>
    </div>
  );
}

/**
 * A read-only-looking field that becomes an input on click. Used for the
 * workspace name, profile fields and the fallback messages — everywhere the
 * screenshot shows a value with a small pencil.
 */
export function InlineTextField({
  value,
  onChange,
  label,
  placeholder,
  maxLength = 200,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div
      className={cn(
        "inline-flex h-9 min-w-[200px] items-center gap-2 rounded-lg border border-border-default bg-surface-card pr-2 pl-3 transition-colors duration-100 [transition-timing-function:var(--ease-standard)] focus-within:ring-2 focus-within:ring-brand",
        className,
      )}
    >
      <input
        ref={inputRef}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        readOnly={!editing}
        onFocus={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 truncate bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Edit ${label}`}
        onClick={() => {
          setEditing(true);
          inputRef.current?.focus();
        }}
        className="shrink-0 rounded p-1 text-ink-muted transition-colors duration-100 hover:text-ink"
      >
        <Pencil className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

// ------------------------------------------------------------------
// Status chips
// ------------------------------------------------------------------

const CHIP_TONES = {
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  warning: "bg-warning-bg text-warning-text",
  neutral: "bg-surface-muted text-ink-tertiary",
  brand: "bg-selected-bg text-brand",
  running: "bg-running-bg text-running",
} as const;

export function Chip({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof CHIP_TONES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        CHIP_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Circular monogram used for members, accounts, keys and integrations. */
export function Monogram({
  text,
  tone = "neutral",
  className,
}: {
  text: string;
  tone?: TileTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
        TILE_TONES[tone],
        className,
      )}
      aria-hidden
    >
      {text}
    </span>
  );
}

/** Row wrapper for the list cards (members, keys, webhooks, accounts). */
export function ListRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border-subtle py-3 last:border-b-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border-default px-4 py-6 text-center text-[12px] text-ink-tertiary">
      {children}
    </p>
  );
}
