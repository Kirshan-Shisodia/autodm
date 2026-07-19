import { Band, Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";

export type Testimonial = {
  quote: string;
  name: string;
  handle: string;
};

/**
 * Deferred by design (spec §9): until real quotes exist, the section does not
 * render at all — no placeholder card, no "coming soon". Instagram creators are
 * sensitive to inflated social proof, so we omit rather than fake. Pass real
 * `testimonials` to light it up; an empty array unmounts the whole band.
 */
export function TestimonialsSection({
  testimonials = [],
}: {
  testimonials?: Testimonial[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <Band className="bg-surface-app">
      <Container>
        <div className="py-16 lg:py-20">
          <SectionHeading eyebrow="Loved by creators" title="Don’t take our word for it" />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.handle}
                className="flex flex-col rounded-2xl border border-border-default bg-surface-card p-6"
              >
                <blockquote className="text-[15px] leading-relaxed text-ink">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-ink">{t.name}</span>{" "}
                  <span className="font-geist-mono text-ink-tertiary">
                    {t.handle}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Container>
    </Band>
  );
}
