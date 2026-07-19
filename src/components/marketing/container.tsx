import { cn } from "@/lib/utils";

/**
 * Full-bleed section band (spec §4/§16). The background stretches edge-to-edge
 * (w-full); width management happens on the inner <Container>, not here.
 */
export function Band({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      // Offset anchor scrolling so headings clear the 56px sticky nav (spec §6).
      className={cn("w-full", id && "scroll-mt-20", className)}
    >
      {children}
    </section>
  );
}

/**
 * Fluid content wrapper (spec §16/§17). Grows with the viewport via clamp()
 * padding so wide screens keep thin, intentional margins instead of a boxed
 * center column. `wide` widens hero/CTA bands for impact.
 */
export function Container({
  className,
  wide = false,
  children,
}: {
  className?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto px-[clamp(24px,6vw,96px)]",
        wide ? "w-[min(98vw,1720px)]" : "w-[min(96vw,1600px)]",
        className
      )}
    >
      {children}
    </div>
  );
}
