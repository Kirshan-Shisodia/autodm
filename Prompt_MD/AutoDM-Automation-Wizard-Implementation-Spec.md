# AutoDM — New Automation Wizard · Implementation + Design Spec

**Route:** `/automations/new`
**Page reference:** PRD Section 9.6 (Page 6)
**Phase:** Frontend / Weeks 5–6 — *next task after Workflow 1 (core engine) shipped*
**Status:** Not started
**Owner instance handoff:** read this whole file before writing any code.

---

## 0. Why this screen, and how it connects to what already works

The n8n master workflow (Workflow 1: Post & Reels AutoDM) is **live and confirmed delivering real DMs**. That workflow reads its configuration from one place: the `automations` table in Supabase. Specifically:

- **Node 5** queries `automations WHERE media_id = {post_id} AND active = true`
- **Node 7** reads `trigger_type` and `trigger_keywords` off that row
- **Node 11** sends the DM using `dm_message` / `dm_link`

Until now those rows have been **inserted by hand** in Supabase. This wizard is the UI that writes those exact rows. Nothing about the engine changes — the wizard just replaces the manual `INSERT`. That is the architectural contract for the whole product:

> **Next.js writes configuration to Supabase. n8n reads configuration from Supabase and writes results back.** They never call each other except for two cases (see §6.3).

So: build the wizard, click Activate, comment the keyword on the post → the DM you already proved works fires. That is the definition of done.

---

## 1. Agent brief — UI/UX Design Lead (adopt this persona for all design decisions)

> You are the **design lead at a small studio** known for giving every product a visual identity that could not be mistaken for anyone else's. You make deliberate, opinionated choices about palette, type, and layout that are specific to *this* brief, and you spend boldness in exactly one place. You write copy from the user's side of the screen (a creator "manages an automation," never "configures a webhook"). You hold a quality floor without announcing it: responsive to mobile, visible keyboard focus, reduced-motion respected. You critique your own work and remove one accessory before shipping.

### 1.1 The brief, pinned

- **Subject:** an Instagram creator setting up "when someone comments X on my post, auto-DM them a link."
- **Audience:** non-technical creators and small businesses. They are not developers. The screen must feel like a confident product, not a settings form.
- **The page's single job:** turn a vague intent into one valid `automations` row, and make the creator *believe* the DM will look good before they activate.

### 1.2 The design system this agent chose, and why

The reference you were handed is **Stripe × A24** (`stripe-x-a24.md`). Its own arbitration rule is explicit:

> *"A24's iconic black background wins on hero plates. Stripe's white wins on app, pricing, docs."* and *"Don't drop the grid for full-bleed art on dashboard / data screens."*

This wizard **is an app/data surface.** So the faithful reading of the reference is: **the form body is pure Stripe** (white, navy, purple CTA, Söhne, gridded, flat). A24 is not ignored — it is given exactly **one cinematic moment**: a full-bleed **dark title plate** at the top of the wizard, with the display serif, that makes the screen feel like a film poster for half a second before the disciplined Stripe form takes over. A24 red appears **at most once per viewport** (the single "Pro" tag). That split is the remix, and it is mandated by the reference itself — not invented.

### 1.3 The signature element

One thing this screen will be remembered by: a **live Instagram-DM phone mockup** on the right that renders the creator's message exactly as the follower will receive it — link chip and all — updating as they type. It is grounded in the subject (the product literally sends IG DMs), and it turns abstract config into something real. Everything else stays quiet so this lands.

*Self-critique already applied:* considered using the display serif for the step titles inside the form — rejected, because the reference floors the serif at 56px and bars it from UI controls; keeping the serif on the dark plate only is the more disciplined call.

---

## 2. Design tokens (drop into `globals.css` / Tailwind theme)

These are the Stripe × A24 values, scoped for this app surface.

```css
:root {
  /* surfaces — Stripe light (form body) */
  --bg:           #ffffff;
  --bg-alt:       #f6f9fc;   /* page background behind cards */
  --surface:      #ebeef3;   /* input fills */
  --text:         #0a2540;   /* Stripe deep navy */
  --text-muted:   #425466;
  --border:       #e3e8ee;

  /* A24 — dark title plate only */
  --bg-dark:      #000000;
  --bg-dark-alt:  #0a0a0a;
  --text-dark:    #ffffff;
  --text-dark-muted: rgba(255,255,255,0.72);
  --accent-warm:  #f4ede4;   /* warm cream, eyebrow text on the plate */

  /* accents */
  --accent:       #635bff;   /* Stripe purple — the ONLY CTA color, both modes */
  --accent-hover: #5048e5;
  --accent-pop:   #d9351c;   /* A24 film red — ONE label per viewport (the Pro tag) */

  /* radii */
  --r-input:  6px;
  --r-button: 6px;
  --r-card:   12px;

  /* elevation — flat; shadow only for popovers/emoji picker */
  --shadow-pop: 0 4px 12px rgba(10,37,64,0.08);

  /* type */
  --font-ui:      "Inter", system-ui, sans-serif;        /* free Söhne stand-in */
  --font-display: "Fraunces", Georgia, serif;            /* A24-adjacent, free (Google Fonts) */
  --font-mono:    "IBM Plex Mono", ui-monospace, monospace; /* numerals: char counts, step numbers, limits */
}
```

**Font sourcing (you're bootstrapped):** Söhne is commercial — use **Inter** for all UI/body (closest free geometric grotesque). **Fraunces** (Google Fonts, free) for the display-serif plate title. A mono (**IBM Plex Mono** or **Geist Mono**) for every numeral so they read tabular.

**Type scale (px):** `12 / 14 / 16 / 18 / 22 / 28 / 36 / 56`. Display serif allowed **only at 56px+** (the plate title). Everything else is Inter.

**Spacing:** 4px base — `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`. Vertical rhythm always an 8px multiple.

**Layout shell:** app max-width **1440px**. The full-bleed dark plate breaks the grid horizontally; the form body below holds a 12-col grid, 24px gutter.

### 2.1 Component tokens

| Component | Spec |
|---|---|
| **Primary button (Continue / Activate)** | `--accent` fill, white text, radius 6, padding 10/16, weight 500. Hover `--accent-hover`. |
| **Secondary button (Back)** | `--text` color, 1px `--border`, white fill, radius 6. |
| **Input / textarea** | `--surface` fill, 1px `--border`, radius 6, padding 10/12. Focus: 2px `--accent` ring, 2px offset. |
| **Card (radio card, post thumb, summary)** | `--bg` fill, 1px `--border`, radius 12, **no shadow**. Selected: 2px `--accent` ring (inset), `--accent` text on label. |
| **Keyword chip** | `--surface` fill, `--text` label, radius 6, ✕ to remove. |
| **Segmented control (Step 3 tabs)** | `--surface` track, white active thumb with 1px `--border`, radius 6. |
| **Pro tag** | `--accent-pop` text on transparent, 1px `--accent-pop`, radius 4. **Render this at most once on screen** (A24 single-label rule). |
| **Dark title plate** | `--bg-dark` full-bleed, Fraunces 56px white title, `--accent-warm` mono eyebrow ("STEP 2 OF 6"). |

---

## 3. Screen layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ ████ DARK TITLE PLATE  (--bg-dark, full-bleed)                         │
│   STEP 2 OF 6                            (IBM Plex Mono, --accent-warm) │
│   Create an automation                   (Fraunces 56px, --text-dark)   │
└──────────────────────────────────────────────────────────────────────┘
┌───────────────┬──────────────────────────────────┬────────────────────┐
│ STEPPER RAIL  │  STEP CONTENT                     │  LIVE PREVIEW       │
│ (sticky left) │  (white, gridded, 1 card stack)   │  (sticky right)     │
│               │                                   │                     │
│ 01 Type    ✓  │   [ step-specific UI here ]       │   ┌──────────────┐  │
│ 02 Post    ●  │                                   │   │  iPhone frame │  │
│ 03 Trigger    │                                   │   │  @creator     │  │
│ 04 Message    │                                   │   │  ┌─────────┐  │  │
│ 05 Reply  Pro │                                   │   │  │ DM bubble│  │  │
│ 06 Review     │                                   │   │  │  + link  │  │  │
│               │                                   │   │  └─────────┘  │  │
│               │                                   │   └──────────────┘  │
├───────────────┴──────────────────────────────────┴────────────────────┤
│  ← Back                                       Continue →  (purple CTA)  │
└────────────────────────────────────────────────────────────────────────┘
```

- **Stepper rail** (left, ~220px): numbered 01–06 in mono. States: done (✓), current (● `--accent`), upcoming (muted). Clicking a *completed* step jumps back to it. Not clickable forward.
- **Step content** (center): one vertical stack of cards. Max readable width ~640px.
- **Live preview** (right, ~360px): the **signature IG-DM phone mockup**. Appears from **Step 4 onward**; Steps 2–3 may use this column for the selected post thumbnail / a contextual hint instead.
- **Footer bar** (sticky bottom): Back (secondary) left, Continue (primary purple) right. Continue is **disabled until the current step is valid**. On Step 6 the primary button becomes **Activate**.

### 3.1 Responsive behavior (build to all three)

Three breakpoints. The 3-column desktop layout degrades by **dropping the side rails inward**, never by squashing them. Test at 1440 / 1024 / 390 widths.

| Region | **Desktop ≥1024px** | **Tablet 768–1023px** | **Mobile <768px** |
|---|---|---|---|
| **Dark title plate** | Full-bleed. Fraunces title **56px**. | Full-bleed. Title **48px**. | Full-bleed (stays edge-to-edge). Title **40px** — the hero serif is exempt from the 56px floor and scales `56 → 48 → 40`; do **not** go below 40 (it reads decorative). If it would wrap past 2 lines, switch the title to Inter 28px. |
| **Stepper rail** | Sticky left column, ~220px, labels visible. | Collapses to a **slim horizontal progress strip** under the plate: `Step 2 of 6` + a 6-segment bar. Tapping a completed segment jumps back. | Same slim strip, full width, sticky under the plate. |
| **Step content** | Center column, max ~640px. Post grid (Step 2): **5 cols**. Type cards (Step 1): **3 cols**. | Full width minus 24px gutters. Post grid **3 cols**, type cards **2 cols**. | Single column, 16px gutters. Post grid **2 cols**, type cards **1 col** stacked. |
| **Live preview (phone mockup)** | Sticky right column, ~360px, always beside content from Step 4. | Moves **below** the content; revealed by a **"Preview message"** button (inline). | Opens as a **bottom sheet** via "Preview message"; full-width phone mockup, swipe/tap to dismiss. Never tries to sit beside content. |
| **Footer bar** | Back left / Continue right, auto-width buttons. | Same. | Sticky bottom, **full-width split** — Back (1/3) · Continue (2/3); Continue grows to 100% when Back is hidden (Step 1). |

**Mobile-specific rules**
- All interactive targets **≥44×44px** (cards, chips, ✕ on chips, emoji trigger, post tiles).
- Keyword chip input wraps chips to multiple lines; the segmented control (Step 3) stays full-width with two equal halves.
- Char counter and "Insert link" stay pinned to the textarea on scroll so they're reachable one-handed.
- The summary card (Step 6) stacks each field vertically; "Edit" links remain tap targets, right-aligned.
- Use `100dvh` + safe-area insets for the sticky footer so it clears the iOS home bar.

**Reduced motion:** at every breakpoint, `prefers-reduced-motion` removes the plate fade, step slide transitions, and the bottom-sheet spring (it snaps instead).

---

## 4. State management

One Client Component, internal state, **save to Supabase only on Step 6**. (PRD 9.6.1)

```ts
'use client';
import { useState } from 'react';

type WizardState = {
  step: 1|2|3|4|5|6;
  type: 'post'|'reel'|'story_reply'|'story_mention'|'inbox'|'facebook'|'ad';
  ig_account_id: string;
  media_id: string | null;        // null = apply to all posts
  trigger_type: 'keyword' | 'all';
  trigger_keywords: string[];
  dm_message: string;
  dm_link: string;
  comment_reply_text: string;     // Pro only
};
```

Use `react-hook-form` + `zod` for per-step validation; `shadcn/ui` for primitives (Button, Card, Input, Textarea, Tabs, Dialog, Badge). Keep all wizard state in the parent; steps are controlled children.

---

## 5. Step-by-step content

### Step 1 — Choose type  → sets `type`
Grid of 6 **radio cards**: Post, Reel, Story Reply, Story Mention, Facebook Comment, Inbox. Each card: icon, title, one-line description, and a **Free / Pro** badge.
- **MVP scope:** enable **Post** and **Reel** (both route through the working Workflow 1). The other four render with a single `--accent-pop` "Pro" tag / "Coming soon" and are not selectable.
- Selected card: 2px `--accent` ring.

### Step 2 — Select target media  → sets `media_id`
Fetch the creator's recent media from Meta, **cache 5 min**:
```
GET https://graph.facebook.com/v18.0/{ig_user_id}/media
    ?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp
    &limit=25
    &access_token={decrypted_token}
```
Render a grid of 25 thumbnails + an **"All posts"** card first (selecting it sets `media_id = null`). Show skeleton tiles while loading. Selected tile: purple ring + check. Put the **decrypt-token call server-side** (reuse the internal token endpoint you already built) — never expose the token to the client.

### Step 3 — Set trigger  → sets `trigger_type`, `trigger_keywords`
Segmented control: **Specific keywords** | **All comments**.
- Keywords: chip input — type a word, press Enter to add it as a chip (✕ to remove). Store lowercased.
- Live sentence preview in `--text-muted`: *"When someone comments **LINK**, **SEND**, or **YES** on this post, send them a DM."*

### Step 4 — Compose DM  → sets `dm_message`, `dm_link`  *(signature step)*
- Textarea with **character count in mono** (Meta limit **1000**). Turn the count `--accent-pop` only when over limit.
- Emoji picker (popover, uses `--shadow-pop`).
- **"Insert link"** button: inserts the `{LINK}` placeholder into the text — replaced at send time by the short URL. Capture the destination URL into `dm_link`.
- **Right column now shows the live IG-DM phone mockup**: render `dm_message` as an Instagram message bubble; render `{LINK}` as a tappable blue link chip. This is the moment that sells the screen.

### Step 5 — Comment reply (Pro)  → sets `comment_reply_text`
Optional. Free plan → show a single upgrade nudge (not a hard block). Pro → textarea, **280 char** limit, small preview. Skippable.

### Step 6 — Review & Activate  → writes to Supabase
- **Summary card** listing every field, each row with an **Edit** link that jumps back to that step.
- Phone mockup stays visible.
- Primary button reads **Activate**. On click → §6.

---

## 6. The Activate flow (the only place this screen leaves the browser)

### 6.1 `POST /api/automations/create` (server route)
**Validate first (server-side — never trust the client):**
- `dm_message` non-empty
- if `trigger_type === 'keyword'` → `trigger_keywords.length > 0`
- **`ig_account_id` belongs to `auth.uid()`** ← IDOR defense, mandatory (PRD §14)

Then, in order:
1. `INSERT` into `automations` with `active = true` (payload below).
2. If `dm_link` is set → `INSERT` into `short_links` (generate `short_code`).
3. Return `{ id }`. Client redirects to `/automations/[id]`.

**`automations` insert payload** (confirm exact column names against your migration in PRD §6 before coding):
```ts
{
  user_id:            auth.uid(),
  ig_account_id:      state.ig_account_id,
  type:               state.type,
  media_id:           state.media_id,            // null = all posts
  trigger_type:       state.trigger_type,
  trigger_keywords:   state.trigger_keywords,     // text[]
  dm_message:         state.dm_message,
  dm_link:            state.dm_link || null,
  comment_reply_text: state.comment_reply_text || null,
  active:             true,
  name:               autoName(state)             // e.g. "LINK → DM on <post caption>"
}
```

### 6.2 Register the post with Meta (second Next.js→n8n call)
After the row exists, the Activate flow POSTs to the **n8n subscribe webhook** to register this `media_id` with Meta's webhook subscription, so live comments on that post start firing into Workflow 1. This is fire-and-forget; surface a non-blocking toast if it fails ("Saved — finishing setup…").

### 6.3 The two — and only two — direct Next.js→n8n calls
1. **Activate** → n8n webhook to subscribe the media_id (above).
2. **Test DM** button (optional, Step 4/6) → n8n test webhook that sends a DM to the creator themselves; synchronous, returns success/error.
Everything else flows through the database.

---

## 7. Copy guidelines (user's side of the screen)

- Buttons say what happens: **Continue**, **Back**, **Activate** (not "Submit"). The action keeps its name through the flow — "Activate" → toast "Automation activated."
- Empty media grid: *"No posts found on this account yet. Post something on Instagram, then refresh."* — direction, not mood.
- Over-limit message count: *"1,040 / 1,000 — trim 40 characters."*
- Never say "webhook," "media_id," or "row." Say "post," "automation," "message."

---

## 8. Accessibility / quality floor (non-negotiable)

- Every step reachable and operable by keyboard; visible focus ring (the 2px purple ring is the focus state — reuse it).
- Stepper announces current step to screen readers (`aria-current="step"`).
- Continue disabled state communicated, not just greyed.
- `prefers-reduced-motion` → drop the plate fade and step transitions.
- Color is never the only signal (selected cards also show a check; over-limit also shows text).

---

## 9. Definition of done

1. A creator can walk Steps 1→6 and click **Activate** with no manual DB work.
2. A real `automations` row is written with `active = true` and correct `media_id` / `trigger_keywords` / `dm_message`.
3. Commenting the keyword on the selected post triggers the **existing Workflow 1** and delivers the DM (the path you already proved).
4. The phone preview matches what the follower receives, including the link chip.
5. Validations block: empty message, empty keyword list (when keyword mode), and any `ig_account` not owned by the user.
6. Responsive to mobile; keyboard-operable; reduced-motion respected.

---

## 10. Out of scope (later phases)

- **Edit Automation** (`/automations/[id]`) — same wizard starting at Step 6 with fields prefilled, saved via PATCH (PRD 9.7). Build after this.
- Story / Inbox / Facebook automation types (Week 7 workflows).
- Flows, Leads, Templates (Pro, Weeks 9–10).
- Analytics charts (PRD 9.8).

---

## 11. Pre-build checklist for the next instance

- [ ] Read PRD §6 and confirm the real `automations` column names match §6.1 payload.
- [ ] Confirm the internal decrypt-token endpoint can serve Step 2's media fetch server-side.
- [ ] Confirm the n8n "subscribe media_id" webhook URL exists (or note it as a dependency).
- [ ] Add Inter + Fraunces + IBM Plex Mono to the Next.js font setup.
- [ ] Drop §2 tokens into `globals.css` and map them into the Tailwind theme.
- [ ] Build the shell (plate + stepper + footer) first, then steps 1→6, then wire Activate last.
