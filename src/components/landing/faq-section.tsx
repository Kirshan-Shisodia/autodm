"use client";

// FAQ (spec §6): shadcn Accordion, 8–10 questions phrased as real search
// queries (doubles as the page's SEO surface; JSON-LD is emitted in page.tsx).
// Content is passed in from the server so every question and answer renders in
// the initial HTML — the accordion only adds the collapse behaviour.

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Faq } from "./content";
import { Container, SectionHeading } from "./primitives";

export function FaqSection({ items }: { items: Faq[] }) {
  return (
    <section id="faq" className="py-20 max-lg:py-16">
      <Container>
        <div className="mx-auto max-w-[720px]">
          <SectionHeading
            eyebrow="Questions"
            title="Everything creators ask before they start."
          />

          <Accordion type="single" collapsible className="mt-12 w-full">
            {items.map((item, i) => (
              <AccordionItem
                key={item.question}
                value={`faq-${i}`}
                className="border-b border-border-default"
              >
                <AccordionTrigger className="text-left text-base font-medium tracking-[-0.16px] text-ink hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-ink-secondary">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}
