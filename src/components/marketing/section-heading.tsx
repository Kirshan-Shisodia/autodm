import { cn } from "@/lib/utils";

/**
 * Section opener (spec §7): brand eyebrow → benefit-led h2 → optional subhead.
 * Each downstream band leads with one of these. h2 uses the HALO display scale
 * with -0.4px display tracking (spec §19).
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col",
        centered ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <>
          <p className="text-xs font-semibold tracking-[0.55px] text-brand uppercase">
            {eyebrow}
          </p>
          {/* Amber underline reads left→right, so only under left-aligned heads. */}
          {!centered && <div className="eyebrow-line mt-2 w-16" />}
        </>
      )}
      <h2 className="mt-4 text-[clamp(28px,4vw,36px)] leading-[1.1] font-bold tracking-[-0.4px] text-ink text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-secondary text-pretty">
          {subtitle}
        </p>
      )}
    </div>
  );
}
