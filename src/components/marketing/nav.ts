/**
 * Landing nav links (spec §6). Anchor-scroll to in-page section bands.
 * Keep hrefs in sync with the section `id`s rendered on the landing page.
 */
export const NAV_LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

/** Single shared signup destination so funnel experiments stay centralized. */
export const SIGNUP_HREF = "/signup";
