// A 100×32 inline trend line. Pure SVG rather than a chart library: it renders
// on the server, costs nothing, and can't drift from the HALO palette.

import { sparklinePath } from "@/lib/analytics/model";
import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  tone = "brand",
  filled = true,
  className,
}: {
  values: number[];
  /** brand = amber (volume metrics), success = green (rate metrics). */
  tone?: "brand" | "success" | "muted";
  filled?: boolean;
  className?: string;
}) {
  if (values.length === 0) {
    return (
      <div
        className={cn("h-8 w-full rounded bg-surface-muted", className)}
        aria-hidden
      />
    );
  }

  const { line, area } = sparklinePath(values);
  const stroke =
    tone === "success" ? "#3eaa83" : tone === "muted" ? "#9a948d" : "#a96b24";

  // A flat translucent fill rather than a <linearGradient>: the page renders a
  // dozen of these, and every gradient needs a document-unique id to reference.
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className={cn("h-8 w-full", className)}
      aria-hidden
      focusable="false"
    >
      {filled && <path d={area} fill={stroke} fillOpacity="0.1" />}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
