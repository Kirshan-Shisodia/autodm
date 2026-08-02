# Settings — Layout Strategy

**Status:** proposal, awaiting approval. No code written.
**Scope:** layout and information architecture only. No changes to theme, colours, typography, icons, components' visual style, sidebar, header, tab strip, or the rail widgets themselves.

---

## 1. Diagnosis — where the whitespace actually comes from

I measured the current pages rather than eyeballing them. Four distinct causes, in order of how much space each wastes.

### Measurements

Row and card heights, from the current components:

| Element | Height |
|---|---|
| `SettingRow` / `ListRow` | ~60px |
| `SettingsCard` chrome (header + padding) | ~96px |
| Card total | `96 + 60 × rows` |
| `SummaryRail` summary card (4 tiles + reset) | ~348px |
| `SummaryRail` summary card (5 tiles + reset) | ~454px |
| `PromptCard` / `NeedHelpCard` | ~150px each |
| **Rail total** (summary + 2 prompts + gaps) | **~680–815px** |

Content column width, derived from the shell (`240px` sidebar + `32px` page padding + `292px` rail + `16px` gap):

| Viewport | Content column | 3 cards each | 2 cards each |
|---|---|---|---|
| 1280 | 668px | **197px** ✗ | 322px |
| 1440 | 828px | **260px** ✗ | 402px |
| 1728 | 1116px | 356px ✓ | 546px |
| 1920 | 1308px | 420px ✓ | 642px |
| 2560 | 1948px | 633px ✗ (too airy) | 962px ✗ |

### Cause 1 — the rail is the tallest object on 8 of 10 pages

This is the big one. Current void between the bottom of the content column and the bottom of the rail:

| Section | Content height | Rail height | **Void** |
|---|---|---|---|
| Danger Zone | 216px | 814px | **598px** |
| API & Webhooks | 268px | 680px | **412px** |
| Automation Defaults | 336px | 786px | **450px** |
| DM Settings | 336px | 786px | **450px** |
| Integrations | 396px | 680px | 284px |
| Connected Accounts | 450px | 680px | 230px |
| Data & Privacy | 456px | 680px | 224px |
| General | 456px | 680px | 224px |
| Team Members | 510px | 680px | 170px |
| Notifications | 620px | 680px | 60px ✓ |

The L-shaped void to the left of the rail's lower half is what reads as "empty and unbalanced". No amount of column tuning inside the content area fixes it, because the content simply has less material than the rail.

### Cause 2 — `2xl:grid-cols-3` fires at 1440px, where three columns don't fit

At 1440px each of three cards is 260px wide. A `SettingRow` needs `32px` icon + `12px` gap + label + control (selects are `min-w-[140–210px]`), so the control either collides with the label or wraps. The current layout is technically 3-up at 1440 but visually cramped, which pushes cards taller and makes the void in Cause 1 worse.

### Cause 3 — forced equal height creates dead space *inside* cards

`SettingsGrid` stretches every card in a row to the tallest one. On Data & Privacy that means a 2-row card (216px) is stretched to 456px — 240px of empty card interior. Equal height only looks intentional when the cards are naturally close in height.

### Cause 4 — no max-width, so ultrawide screens stretch rows

`main` is `w-full`. At 2560px each card is 633px wide, and a `SettingRow` becomes a label on the far left and a toggle on the far right with ~400px of nothing between them.

---

## 2. The layout system

Five additions, all layout-only. Every one reuses existing components and adds no new visual language.

### 2.1 `SettingsColumns` / `SettingsColumn` — balanced 12-column flows

Replaces `SettingsGrid` as the primary container. Instead of a stretch-grid of equal-height cells, the content area becomes 2 (or 3) **vertical flows**, each a `flex flex-col gap-6`, with explicit 12-column spans.

```
<SettingsColumns>
  <SettingsColumn span={7}> …cards… </SettingsColumn>
  <SettingsColumn span={5}> …cards… </SettingsColumn>
</SettingsColumns>
```

Why this over the current grid:

- Cards stack inside a column and keep their natural height — **Cause 3 disappears entirely**.
- Column heights are balanced by how cards are assigned, not by the browser, so the result is deterministic and identical on the server and client.
- Asymmetric splits (8/4, 7/5, 6/6, 5/4/3) come for free.
- Below the 2-column breakpoint every column collapses into one flow in DOM order, so mobile is a single stack with no reordering.

`SettingsGrid` stays exported for the two sections that genuinely want a uniform grid (Integrations tiles), so nothing has to be rewritten twice.

### 2.2 `CardGroup` — sub-sections inside a card

An 11px uppercase label on a hairline divider, using existing `text-ink-muted` and `border-border-subtle`. Nothing new visually — it is the same divider treatment already used between rows.

This is the tool that lets short cards be **merged** without losing hierarchy. It is the pattern Stripe and Clerk use: one card, several labelled groups, one save action.

### 2.3 ~~`RowGrid` — internal 2-up rows~~ — not needed

**Dropped during implementation.** The intent was to halve the height of toggle-heavy cards by laying simple rows two per line. Rebalancing the cards across columns turned out to close the height gap on its own, so this would have made cards *too* short and reopened the void from the other direction. Not built.

The same applies to `SettingsGrid`: with all ten sections on `SettingsColumns` it had no callers left, so it was removed rather than kept as dead code.

### 2.4 `SectionFooterStrip` — the fix for Cause 1

**This is the one item that needs your explicit sign-off**, because it *moves* rail children (it does not change them).

On sections where the content column is naturally shorter than the rail, `SummaryRail`'s `PromptCard` and `NeedHelpCard` children render **below the content area as a full-width 2-up strip** instead of stacked in the 292px rail. Same components, same copy, same styling, same props — repositioned only.

Effect: the rail drops from ~680–815px to ~296–454px (the summary card alone), the strip adds ~150px of full-width content, and the void closes almost completely:

| Section | Void now | Void after |
|---|---|---|
| Danger Zone | 598px | ~0px |
| API & Webhooks | 412px | ~90px |
| Automation Defaults | 450px | ~60px |
| DM Settings | 450px | ~0px |
| Integrations | 284px | ~70px |

If you'd rather not move them, the fallback is 2.5 alone, which fixes roughly half the void.

### 2.5 Sticky rail + max-width cap

- Rail gets `sticky top-6` so it stays in view on the long sections (Notifications, Team) instead of scrolling away.
- The settings page gets `max-w-[1800px]` — fixes Cause 4 without affecting anything below 1800px.

---

## 3. Page-by-page blueprints

Notation: `A(7)` = left column spanning 7 of 12; card names in **bold**; `(n)` = number of rows.

### 3.1 General — 7 / 5

| | |
|---|---|
| **A (7)** | **Workspace Information** (3) · **Profile Information** (4) |
| **B (5)** | **Preferences** (6) |

- **Grouped:** the two "who and where you are" cards sit together in the wide column; preferences — a different kind of decision — get their own column.
- **Split/merged:** none. General is already well-proportioned; it needs the least change.
- Column A ≈ 636px, Column B ≈ 456px, rail ≈ 348px. Content is now the tallest object, which is the right way round.
- Footer strip: **not needed** (content exceeds rail).

### 3.2 Connected Accounts — 7 / 5

| | |
|---|---|
| **A (7)** | **Connected Social Accounts** (5) |
| **B (5)** | **Account Permissions** (4) |

- **Merged:** the `Social Accounts` / `Integrations` sub-tabs collapse. The second tab is a stub that points at the Integrations section — a dead tab is worse than no tab. Removing it also recovers 40px and one click.
- **Density:** account rows go to a two-line list row (name + handle on line 1, status detail on line 2) so the 5 rows read at 76px each. This uses detail already in the data and removes the awkward mid-row `detail` column that currently truncates.
- A ≈ 476px, B ≈ 400px, rail ≈ 296px.
- Footer strip: not needed.

### 3.3 Team Members — 8 / 4

| | |
|---|---|
| **A (8)** | **Team Members** (n members) |
| **B (4)** | **Invite a teammate** (form) · **Pending Invitations** (n) |

- **Split:** the invite form comes out of the members card and becomes a permanent card in column B. Today it is a toggle that pushes the roster down when opened; as its own card it is always available and never shifts the list.
- 8/4 rather than 7/5 because the roster row carries five pieces of information (avatar, name, email, scopes, role, actions) and wants the width; the invite form is three fields.
- A ≈ 456px, B ≈ 470px — naturally balanced.
- Footer strip: not needed.

### 3.4 Notifications — 7 / 5

| | |
|---|---|
| **A (7)** | **Channel Settings** (6–8 topics, per the active tab) |
| **B (5)** | **Quiet Hours** (4) · **Channel Overview** (read-only 3-row recap of the two inactive channels) |

- **Added (from data that already exists):** the small overview card in B shows "Push 5/6 · In-App 6/7" so switching tabs is informed rather than exploratory. It reuses `channelCount`, already in the model.
- The channel tabs stay exactly as they are.
- A ≈ 576px, B ≈ 388 + 250 = 638px.
- Footer strip: not needed (this page already balances).

### 3.5 Automation Defaults — 6 / 6 (merged from 3 cards to 2)

| | |
|---|---|
| **A (6)** | **Trigger & Reply** — trigger type, reply type, label, fallback message, approval (5) |
| **B (6)** | **Timing & Limits** — time delay, working hours, timezone, DM limit, retry attempts (5) |

- **Merged:** today's three cards (3/3/4 rows) produce a 336px content column against a 786px rail. Two cards of 5 rows each land at 396px per column and read as a cleaner split: *what it does* vs *when and how much*.
- Save bar stays as-is (one row, one write).
- Content ≈ 396px, rail ≈ 454px, footer strip closes the rest.
- Footer strip: **yes**.

### 3.6 DM Settings — 6 / 6 (merged from 3 cards to 2)

| | |
|---|---|
| **A (6)** | **Message Content** — auto DM, message type, template, fallback, link preview, humanize (6) |
| **B (6)** | **Delivery & Limits** — typing delay, media support, max file size, stop on unsubscribe, block non-followers, daily DM limit (6) |

- **Merged:** 4/4/4 → 6/6. Perfectly balanced columns at 456px each, against a 454px rail. This is the best-balanced page in the plan.
- Every row and control is preserved; only the grouping changes.
- Footer strip: optional (void ≈ 0 without it).

### 3.7 Data & Privacy — 7 / 5

| | |
|---|---|
| **A (7)** | **Privacy Settings** (6) |
| **B (5)** | **Your Data** (3) · **Privacy & Compliance** (2) |

- **Grouped:** the one long form card gets the wide column; the two short action cards stack in the narrow one. This is the clearest example of why balanced columns beat a stretch grid — today the 2-row card is inflated to 456px.
- A ≈ 456px, B ≈ 516px.
- Footer strip: not needed.

### 3.8 Integrations — 6 / 6 (merged from 5 cards to 2)

| | |
|---|---|
| **A (6)** | **Automation & Data** — Zapier, Make, Google Sheets (3) |
| **B (6)** | **Communication & Commerce** — Slack, HubSpot, Shopify (3) |

- **Merged:** five category cards holding one or two tools each is the worst density on the module — four of them are single-row cards inside a 96px chrome. Two cards of three tools each is 276px per column.
- The category filter chips stay. They now filter *rows*; a card with no matching rows hides itself.
- Rail ≈ 348px.
- Footer strip: **yes**.

### 3.9 API & Webhooks — 7 / 5 (merged from 3 cards to 2)

| | |
|---|---|
| **A (7)** | **API Access & Keys** — `CardGroup` "Access" (security banner + 2 rows), `CardGroup` "Keys" (key list + docs link) |
| **B (5)** | **Webhooks** (endpoint list + logs link) |

- **Merged:** the access toggles and the key list are one subject and were split only because they were two cards. `CardGroup` keeps the hierarchy inside one card — the Stripe pattern.
- The minted-key banner and both creation forms keep their current behaviour and placement within their group.
- A ≈ 440px, B ≈ 268px, rail ≈ 348px.
- Footer strip: **yes**.

### 3.10 Danger Zone — 7 / 5 (merged from 3 cards to 2, plus one rail card moved)

| | |
|---|---|
| **A (7)** | **Workspace Actions** — pause all, reset workspace, transfer ownership (3) |
| **B (5)** | **Delete Account** (1) · **Before you delete** (the export prompt, moved down from the rail) |

- **Merged:** today's Pause / Workspace / Delete split produces three cards of 1, 2 and 1 rows — 598px of void, the worst page in the module.
- **Moved:** the rail's "Before you delete" card belongs beside the delete action, not above two prompt cards. Same component, same copy.
- The danger border stays on the delete card only, so the reversible pause action doesn't read as fatal.
- A ≈ 276px, B ≈ 326px, rail ≈ 296px — void ≈ 0.
- Footer strip: **yes**.

### Summary table

| Section | Split | Cards now → after | Void now → after |
|---|---|---|---|
| General | 7/5 | 3 → 3 | 224 → ~0 |
| Connected Accounts | 7/5 | 2 (+1 stub) → 2 | 230 → ~0 |
| Team Members | 8/4 | 2 → 3 | 170 → ~0 |
| Notifications | 7/5 | 2 → 3 | 60 → ~0 |
| Automation Defaults | 6/6 | 3 → 2 | 450 → ~60 |
| DM Settings | 6/6 | 3 → 2 | 450 → ~0 |
| Data & Privacy | 7/5 | 3 → 3 | 224 → ~0 |
| Integrations | 6/6 | 5 → 2 | 284 → ~70 |
| API & Webhooks | 7/5 | 3 → 2 | 412 → ~90 |
| Danger Zone | 7/5 | 3 → 2 | 598 → ~0 |

---

## 4. Responsive breakpoints

| Band | Width | Content columns | Rail | Notes |
|---|---|---|---|---|
| Mobile | < 640 | 1 (single flow, DOM order) | below content | Cards full width, `RowGrid` off |
| Tablet | 640 – 1023 | 2 (6/6 for every page) | below content, full width | Asymmetric spans normalise to 6/6 — a 4-col card is too narrow here |
| Laptop | 1024 – 1279 | 2 (page's own split) | below content, full width | Rail is wide here, so its tiles sit 4-up naturally |
| Desktop | 1280 – 1727 | 2 (page's own split) | 292px, sticky | The primary target. **Never 3 columns** — see Cause 2 |
| Large desktop | ≥ 1728 | 3 where the page has ≥3 natural cards (General, Data & Privacy, Notifications); otherwise stays 2 | 292px, sticky | 356px+ per card, the first width where 3-up is honest |
| Ultrawide | ≥ 1800 | capped by `max-w-[1800px]` | — | Prevents row stretching |

`1728px` needs a named breakpoint (their `2xl` token is 1440). Proposal: add `--breakpoint-3xl: 1728px` alongside the existing `--breakpoint-2xl` override — a token addition, not a change to an existing value.

---

## 5. Information hierarchy

1. **One primary action per card, in the header.** Already true; merging cards must not produce two. Where a merge would (API Access & Keys), the secondary action becomes a `GhostButton` inside its `CardGroup`.
2. **Wide column = the thing you came for.** Every page puts its main subject in the 6–8 span column and supporting actions in the 4–5 span one. Scanning left to right always goes primary → secondary.
3. **Read-only recaps stay in the rail; editable things stay in the content.** The one exception is Danger Zone's "Before you delete", which is an action prompt, not a recap.
4. **Card titles become nouns, blurbs become constraints.** "Timing & Limits" / "When automations run, and how many DMs they may send." Current copy is already close.
5. **Destructive styling is reserved for terminal actions.** Only Delete Account and Reset Workspace carry the danger border after this change.

## 6. Reducing scroll

- Balanced columns cut page height by roughly 35–45% on the merged pages (DM Settings: 336px content + 786px rail = 786px tall → 456px content + 454px rail = 456px tall).
- Sticky rail means the summary and reset are reachable without scrolling back up.
- The sticky `SaveBar` already prevents scroll-to-save on Automation Defaults and DM Settings.
- Removing the dead Connected Accounts sub-tab removes a click and 40px.
- Target: **every settings page fits in one viewport at 1440×900 without scrolling**, except Notifications and Team Members, which are genuinely list-driven.

## 7. What premium products actually do, and what we borrow

| Product | Pattern | Where we apply it |
|---|---|---|
| **Stripe Dashboard** | One card, several labelled groups, one save | `CardGroup` → API Access & Keys |
| **Linear** | Narrow, dense rows; setting label and control on one line; no icons competing with labels | Keep current `SettingRow`; add `RowGrid` for toggle-only rows |
| **Vercel** | Asymmetric two-column with the form left and metadata right; sticky save bar | The 7/5 and 8/4 splits; `SaveBar` already matches |
| **Clerk** | Grouped cards by subject, never one row per card | The Danger Zone and Integrations merges |
| **GitHub** | Danger zone as a single bordered block, not scattered | Danger Zone → 2 cards, border on the terminal one |
| **Notion** | Wide left column, narrow right column of contextual help | Existing rail — keep, but let its prompts drop into the footer strip on short pages |
| **Framer** | Hard max-width so ultrawide doesn't stretch | `max-w-[1800px]` |

The common thread: none of these stretch cards to equal height, and none run three equal columns under ~1700px.

## 8. Component inventory

**Reused unchanged (14):** `SettingsCard`, `SettingRow`, `ListRow`, `Chip`, `Monogram`, `IconTile`, `Toggle`, `SelectField`, `NumberField`, `InlineTextField`, `PrimaryButton`, `GhostButton`, `EmptyState`, `SaveBar`.

**Reused unchanged (rail):** `SummaryRail`, `PromptCard`, `NeedHelpCard`, `Tabs`.

**Reused unchanged (logic):** `useSectionForm`, `useAction`, every server action, every Zod schema, `loadSettings`, the whole model layer.

**New — layout only, no new visual style (2, as built):**

| Component | Purpose |
|---|---|
| `SettingsColumns` + `SettingsColumn` | 12-column balanced flows, with `span`, `span3xl` and `split3xl` |
| `CardGroup` | Labelled sub-section inside a card |

**Modified (2):** `SummaryRail` gained a `footerStrip` boolean that decides where its children render and is now sticky at `xl`; `SettingsCard` became a flex column so a stretched card's body absorbs the extra height.

**Removed (2):** `SettingsGrid` and the planned `RowGrid` — see §2.3.

## 9. Risk and effort

| Page | Effort | Risk |
|---|---|---|
| General, Data & Privacy | Low — reassign cards to columns | None |
| Connected Accounts, Notifications, Team | Medium — one card added or a sub-tab removed | Low |
| Automation Defaults, DM Settings, Integrations, API, Danger Zone | Medium — cards merged, rows regrouped | Low; every row keeps its handler, forms keep one dirty state |

No server action, schema, query or piece of state management changes. The work is entirely in the ten section components plus four small layout primitives.

## 10. Decisions I need from you

1. **`SectionFooterStrip`** — may the rail's `PromptCard` / `NeedHelpCard` move below the content on the five short pages? This is the single biggest whitespace fix. Components and copy are untouched; only their position changes.
2. **Connected Accounts sub-tabs** — may the dead "Integrations" sub-tab be removed?
3. **Two new cards** (Team's permanent invite form, Notifications' channel overview) — both are built from data and actions that already exist, but they are additions rather than rearrangements.
4. **`3xl: 1728px` breakpoint token** — an addition alongside the existing `2xl: 1440px` override, not a change to it.
