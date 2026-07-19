import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Band, Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is ChatPilott allowed by Instagram?",
    a: "Yes. ChatPilott runs on Meta’s official Instagram Graph API and only messages people who have already commented on your content — never cold or unsolicited DMs.",
  },
  {
    q: "Do I need a specific type of account?",
    a: "You’ll need an Instagram Business or Creator account connected to a Facebook Page. Personal accounts aren’t supported by Meta’s API.",
  },
  {
    q: "What triggers a DM?",
    a: "Any keyword or phrase you choose. When someone comments it on a post or reel you’ve automated, they get your message.",
  },
  {
    q: "Will it message people who didn’t comment?",
    a: "No. DMs only go to people who comment your keyword first — that’s what keeps you safely within Instagram’s rules.",
  },
  {
    q: "Can I customize the message?",
    a: "Yes — write your own text and include a link to whatever you’re sharing, from a lead magnet to a checkout page.",
  },
  {
    q: "How fast are the DMs sent?",
    a: "Usually within a few seconds of the comment being posted, so you reach people while their interest is fresh.",
  },
  {
    q: "Is there really a free plan?",
    a: "Yes. The Free plan lets you run one automation with a monthly DM allowance, no card required.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel whenever you like — Pro stays active until the end of your current billing period.",
  },
  {
    q: "What data do you store?",
    a: (
      <>
        Only what’s needed to run your automations. See our{" "}
        <Link href="/privacy" className="text-brand">
          Privacy Policy
        </Link>{" "}
        for the full detail.
      </>
    ),
  },
];

export function FaqSection() {
  return (
    <Band id="faq" className="bg-surface-app">
      <Container>
        <div className="py-16 lg:py-20">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />

          <Accordion
            type="single"
            collapsible
            className="mx-auto mt-10 max-w-3xl"
          >
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border-default">
                <AccordionTrigger className="py-5 text-lg font-medium text-ink hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-ink-secondary">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </Band>
  );
}
