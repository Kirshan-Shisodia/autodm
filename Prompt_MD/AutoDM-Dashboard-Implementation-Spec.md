# AutoDM — Dashboard · Implementation + Design Spec

**Route:** `/dashboard`
**Page reference:** PRD Section 9.4 (Page 4)
**Phase:** Frontend / Weeks 5–6 — *next screen after the Automation Wizard*
**Status:** Not started
**Companion docs:** `AutoDM-Automation-Wizard-Implementation-Spec.md` (shares the same design system and app shell).

---

## 0. What this screen is, and how it connects

The Dashboard is the screen a creator lands on after login, and it's the **first page that establishes the app shell** (sidebar + topbar) every other page lives inside.

It is **read-only**. It does nothing but render data that already exists in Supabase:
- rows the **Automation Wizard** wrote (`automations`)
- rows **Workflow 1 (n8n)** logged after each send (`dm_logs`)
- the connected account (`instagram_accounts`) and the user's plan (`users`)

That matters for two reasons. First, it fits the architecture contract: *Next.js reads config and results from Supabase; it never calls n8n or Meta directly here.* Second — and this is the practical win — **it does not depend on the live-webhook gate at all.** You can build and fully test it with **seed data** (a handful of dummy `dm_logs` / `automations` rows). See §9.

---

## 1. Agent brief — UI/UX Design Lead

Adopt the same **UI/UX Design Lead** persona defined in the wizard spec (§1 there): opinionated, anti-templated, copy written from the user's side of the screen, quality floor held without announcing it. The brief is the same product; this is just a different surface of it.

### Decisions this agent made for the Dashboard

- **This is the most app-like HALO surface in the app.** The HALO reference is explicit: *"Don't drop the grid for full-bleed art on dashboard / data screens,"* and *"The light surface wins on app, pricing, docs."* So the Dashboard gets **no inverse dark plate** — unlike the wizard, which earned one cinematic title moment. The Dashboard is quiet, dense, gridded, white. The theatrical dark plate lives on the marketing/landing pages, not here.
- **Signature element:** the **live recent-activity feed** — real DMs streaming in (`@username got your LINK DM · 2s ago`) via Supabase realtime. It's grounded in the subject (the product's whole point is sending DMs; watching them go out live is the proof it works) and it's the one thing this screen is remembered by. Everything else stays calm so it lands.
- **Type detail that carries the brand:** every metric renders in **mono, tabular figures** (the reference's "Söhne Mono numerals" rule). That's the characterful touch — no display serif anywhere on this surface.

---

## 2. Design tokens

Use the shared token set from the wizard spec §2 (same `:root` variables, fonts, radii, spacing). For the Dashboard, only the **HALO light** half is in play — there is **no `--bg-dark` plate** on this screen.

Quick reference of what's used here:

```
--bg #ffffff · --bg-alt #f6f9fc · --surface #ebeef3
--text #0a2540 · --text-muted #425466 · --border #e3e8ee
--accent #635bff (purple) · --accent-pop #d9351c (used ONCE: the past-due banner)
--r-card 12px · flat, border depth, --shadow-pop only for dropdowns
fonts: Inter (UI) · IBM Plex Mono (all numerals) · (no Fraunces here)
spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 · app max-width 1440
```

The single allowed `--accent-pop` red on this screen is the **past-due banner** (§6) — that's the one-label-per-viewport rule spent deliberately.

---

## 3. Layout

```
┌──────────┬──────────────────────────────────────────────────────────┐
│ SIDEBAR  │ TOPBAR:  [account switcher ▾]              [user menu ▾]   │
│          ├──────────────────────────────────────────────────────────┤
│ ◇ Dash   │  ‹ past-due banner — only if subscription_status=past_due › │
│ �misc     │                                                            │
│ Automat. │  Good morning, Shiv                                        │
│ Analytics│                                                            │
│ Accounts │  ┌────────────┐┌────────────┐┌────────────┐┌────────────┐ │
│ ───      │  │ DMs / month ││ Active     ││ Link clicks││ Open rate  │ │
│ Flows pro│  │  842        ││ automations││  1,204     ││   N/A      │ │
│ Leads pro│  │ ▓▓▓▓░░ /1000 ││    3       ││ this month ││            │ │
│ Templ pro│  └────────────┘└────────────┘└────────────┘└────────────┘ │
│ ───      │                                                            │
│ Billing  │  ┌─ Account health ──────────────┐ ┌─ Recent activity ──┐ │
│ Settings │  │ @yourbrand · Healthy          │ │ @ana · LINK · 2s   │ │
│ Help     │  │ token ok · 0 warnings         │ │ @raj · LINK · 1m   │ │
│          │  └───────────────────────────────┘ │ @mia · SAVE · 4m   │ │
│ [profile]│                                     │ … (last 10, live)  │ │
└──────────┴─────────────────────────────────────└────────────────────┘
```

- **Sidebar** (left, ~240px, sticky): primary nav + a profile chip at the bottom. Defined in §4 — this is the shell for every app page.
- **Topbar** (sticky): account switcher (left) for users with multiple connected IG accounts; user menu (right).
- **Main**: optional past-due banner → a greeting → a 4-card KPI row → a two-column row (Account health | Recent activity).

---

## 4. The app shell (define once, reused everywhere)

Use the **shadcn/ui Sidebar** component.

**Sidebar nav** (icon + label). Group it:
- **Main:** Dashboard, Automations, Analytics, Accounts
- **Pro** (show a single muted `PRO` tag on the group, not per item): Flows, Leads, Templates
- **Account:** Billing, Settings, Help

Current route is highlighted with the `--accent` left border + `--text` weight 600. Pro items for free users route to `/billing?upgrade=pro` instead of the feature.

**Topbar:**
- **Account switcher** (left): a dropdown of the user's `instagram_accounts` by `@ig_username` + avatar. If only one, render it static (no dropdown).
- **User menu** (right): avatar → Settings, Billing, Sign out.

**Profile chip** (sidebar bottom): avatar + `full_name` + plan badge (`free` / `pro` / `platinum`).

Responsive: see §10 — the sidebar becomes a drawer below 1024px.

---

## 5. KPI cards (the metric row)

Four cards, `--bg` fill, 1px `--border`, radius 12, no shadow. **All numbers in IBM Plex Mono, tabular.**

| Card | Value | Source | Notes |
|---|---|---|---|
| **DMs this month** | `users.dm_count_month` | the user row | Show as `842 / 1,000` with a progress bar. Limit comes from the plan map below. Bar turns `--accent-pop` at ≥90%. |
| **Active automations** | count of `automations WHERE active = true` | count query | Plain number. |
| **Link clicks (this month)** | count of `link_clicks` joined to this user's `short_links`, `clicked_at` ≥ start of month | join query | Plain number. |
| **Open rate** | `N/A` | — | Meta doesn't expose DM open rate. Render a quiet `N/A` with a tooltip: "Instagram doesn't report DM opens." Don't fake it. |

**Plan limits map** (from PRD §10.5.3):
```ts
const DM_LIMIT = { free: 1000, pro: 25000, platinum: 300000 };
// also: free plan allows max 1 automation (enforced on create, surfaced here as context)
```

Use `users.dm_count_month` for the count (not a fresh `dm_logs` count) — it's the same counter n8n increments and enforces against, so the dashboard and the engine never disagree.

---

## 6. Account health widget

A card listing each connected account with a status, plus one top-level banner. Conditions and the **exact columns**:

- **Past-due banner** (full-width, top of main, `--accent-pop`): if `users.subscription_status = 'past_due'` → "Your last payment failed. Update billing to keep automations running." This is the one red element on the screen.
- **Token expiring** (per account, orange): if `instagram_accounts.token_expires_at` is within 7 days → "Reconnect @username" with a link to `/accounts`.
- **Rate limit** (per account, red text, not a banner): if this hour's sends are >80% of the hourly cap → "Approaching the hourly limit." (Hourly count comes from `dm_logs` for the account in the last hour — same data your n8n Node 9 uses.)
- **Healthy** (green dot): token valid, no warnings.

> **Schema flag for the builder:** the PRD's code samples reference `plan_status` in a couple of places (9.4.4, the Stripe webhook), but the actual `users` column is **`subscription_status`** (values `active / trialing / past_due / canceled / incomplete`). Use `subscription_status`. There is no `plan_status` column — don't query one.

---

## 7. Recent activity feed (the signature)

The last 10 sends, newest first, updating live.

- Query: `dm_logs` joined to `automations(name)`, `order by sent_at desc limit 10`, filtered to this user.
- Each row: commenter `@username` (or recipient id), the automation/keyword, relative time ("2s ago"), and a status dot (sent = green, failed = red).
- **Live:** subscribe to Supabase realtime `INSERT` on `dm_logs` for this user; prepend new rows with a subtle highlight that fades (respect `prefers-reduced-motion` — no fade, just appear).
- **Empty state:** no DMs yet → "No DMs sent yet. When someone comments your keyword, it'll show up here." with a link to `/automations/new` if they also have no automations.

This feed is the proof-of-life of the whole product — give it room and keep it legible.

---

## 8. Data fetching

Server Component, parallel reads (PRD 9.4.2), then hand to a client component for the realtime feed.

```ts
// app/(app)/dashboard/page.tsx  (Server Component)
const [{ data: userRow }, { count: activeAutomations }, { data: recentDms }, { data: accounts }, { count: linkClicks }] =
  await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('automations').select('id', { count:'exact', head:true }).eq('active', true),
    supabase.from('dm_logs').select('*, automation:automations(name)').order('sent_at',{ascending:false}).limit(10),
    supabase.from('instagram_accounts').select('*'),
    // link clicks this month — via the user's short_links
    supabase.from('link_clicks').select('id, short_links!inner(user_id)', { count:'exact', head:true })
      .eq('short_links.user_id', user.id).gte('clicked_at', startOfMonth()),
  ]);
```

Notes:
- RLS already scopes most tables to `auth.uid()`, but still pass explicit `user.id` filters where shown — defense in depth.
- `dm_count_month` for the DMs card comes straight off `userRow` (no separate count needed).
- Confirm `dm_logs` timestamp column is `sent_at` and status value is `'sent'` against your migration before wiring counts.

---

## 9. Testing without the live webhook (important)

Because the live comment path is still gated, seed the data so the dashboard renders a realistic state:

1. Insert ~20 rows into `dm_logs` for your user with varied `sent_at` (some this month, a few in the last few minutes for the feed), `status='sent'`, real-ish recipient usernames, linked to your existing automation.
2. Set `users.dm_count_month` to a number (e.g. 842) so the progress bar shows something.
3. Make sure you have 1–3 `automations` with `active=true`.
4. (Optional) insert a couple of `link_clicks` tied to a `short_link` you own, dated this month.

Then: load `/dashboard`, confirm every card, the health widget, and the feed populate. To test realtime, `INSERT` one more `dm_logs` row from the Supabase SQL editor and watch it appear at the top of the feed without a refresh.

---

## 10. Responsive behavior

| Region | Desktop ≥1024px | Tablet 768–1023px | Mobile <768px |
|---|---|---|---|
| **Sidebar** | Sticky, ~240px, always visible. | Collapses to an **overlay drawer** opened by a hamburger in the topbar. | Same drawer; full-height sheet. |
| **Topbar** | Account switcher + user menu inline. | Same. | Hamburger + logo + user avatar; account switcher moves into the drawer. |
| **KPI cards** | 4 across. | 2 across. | 1 per row, stacked. |
| **Health / Activity row** | Two columns side by side. | Stacked: health, then activity. | Stacked, full width. |
| **Greeting** | 28px. | 28px. | 22px. |

Mobile floor: the dashboard must not break at 375px (PRD 9.20). Tap targets ≥44px. `prefers-reduced-motion` disables the feed highlight and drawer spring.

---

## 11. Copy (user's side of the screen)

- Greeting by name and time of day: "Good morning, Shiv." Warm, not corporate.
- Empty/zero states are invitations, not apologies: "No DMs sent yet…" → CTA.
- Never surface DB words. It's "DMs this month," not "dm_logs count." It's "Reconnect," not "token_expires_at."
- The N/A open-rate tooltip explains *why* in plain terms, so it doesn't read as broken.

---

## 12. Accessibility / quality floor

- Every nav item and control is a real `<button>`/`<a>`, keyboard-focusable, visible focus ring (the 2px purple ring).
- The drawer traps focus when open and closes on Esc.
- Status is never color-only: the health dots and feed statuses carry text/labels too.
- Numbers use tabular figures so they don't jitter as the feed updates.
- Unauthenticated users hitting `/dashboard` redirect to `/login` (PRD 9.20).

---

## 13. Definition of done

1. `/dashboard` renders inside the sidebar+topbar shell; the shell is reusable for other app pages.
2. All four KPI cards show correct values from Supabase (DMs vs the right plan limit, active automations, link clicks this month, N/A open rate).
3. Account health surfaces the past-due banner, token-expiring, and rate-limit states from the correct columns.
4. The recent-activity feed lists the last 10 sends and updates live on a new `dm_logs` insert.
5. Empty states show helpful CTAs.
6. Fully functional on seed data with no live webhook.
7. Responsive to 375px; keyboard-operable; reduced-motion respected.

---

## 14. Out of scope (separate specs/phases)

- **Analytics page** (`/analytics`) — the Recharts charts and funnels (PRD 9.8).
- **Accounts**, **Settings**, **Billing** pages — their own screens.
- The Pro pages (Flows, Leads, Templates).
- Building the actual realtime n8n pipeline beyond what already exists.

---

## 15. Pre-build checklist

- [ ] Confirm `dm_logs` has `sent_at` + `status='sent'` (used by counts and the feed).
- [ ] Confirm you use `users.subscription_status` (not `plan_status`) and `users.dm_count_month`.
- [ ] Wire the plan-limit map (`free 1000 / pro 25000 / platinum 300000`).
- [ ] Build the app shell (sidebar + topbar) first — it's reused by every later page.
- [ ] Seed `dm_logs` / `automations` / `link_clicks` per §9 so you can see the screen.
- [ ] Reuse the wizard's tokens; do **not** add a dark plate on this surface.
