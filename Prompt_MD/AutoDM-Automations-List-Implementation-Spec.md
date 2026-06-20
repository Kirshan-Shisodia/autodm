# AutoDM — Automations List · Implementation + Design Spec

**Route:** `/automations`
**Page reference:** PRD Section 9.5 (list) + 9.7 (edit)
**Phase:** Frontend / Weeks 5–6 — *the management counterpart to the wizard*
**Status:** Not started
**Companion docs:** `AutoDM-Automation-Wizard-Implementation-Spec.md` (reused for Edit), `AutoDM-Dashboard-Implementation-Spec.md` (defines the app shell this page lives in).

---

## 0. What this screen is, and how it connects

The wizard *creates* automations. This page *manages* them — it's the other half of the loop and where a creator spends day-to-day time: see everything they've set up, flip them on/off, edit, duplicate, delete.

- It **reads** the `automations` table and a per-automation count from `dm_logs`.
- Its only **write** is the on/off toggle (`automations.active`) via a Server Action.
- **Edit reuses the wizard you already built** (opens it prefilled at Step 6) — so most of this is the list + actions, not new form UI.
- It lives inside the **app shell** (sidebar + topbar) defined in the dashboard spec.
- Like the dashboard, it's **fully seed-data testable** — no live webhook needed.

---

## 1. Agent brief — UI/UX Design Lead

Same **UI/UX Design Lead** persona as the other two specs. Decisions for this surface:

- **Pure Stripe data surface — no A24 dark plate.** This is a management table, the quietest surface in the app. White, gridded, flat, calm. A24 stays on marketing pages.
- **Signature element:** the **instant on/off toggle.** Flipping an automation feels immediate — optimistic update, the row state changes the moment you tap, a toast confirms. The product is fundamentally "automations that are on or off," so making that switch feel alive and reliable is the one memorable interaction. Everything else stays utilitarian.
- **Type detail:** "DMs today" counts and dates render in **IBM Plex Mono, tabular** (consistent with the dashboard).

---

## 2. Design tokens

Reuse the shared token set (wizard spec §2). Stripe light half only — **no dark plate** on this screen. Numerals in mono. The one `--accent-pop` red is reserved for the **Delete** confirmation's destructive button, nowhere else.

---

## 3. Layout

```
┌──────────┬──────────────────────────────────────────────────────────┐
│ SIDEBAR  │ TOPBAR                                                     │
│ (shell)  ├──────────────────────────────────────────────────────────┤
│ Dashboard│  Automations                         [ + New automation ] │
│ ▸Automat.│                                                            │
│ Analytics│  ┌────────────────────────────────────────────────────┐   │
│ Accounts │  │ NAME              TYPE   STATUS  DMs today  CREATED ⋯│   │
│ …        │  ├────────────────────────────────────────────────────┤   │
│          │  │ LINK → DM on Reel  Reel   [●ON ]    42     Jun 17  ⋯ │   │
│          │  │ SAVE → guide       Post   [ OFF]     0     Jun 12  ⋯ │   │
│          │  │ YES → waitlist     Post   [●ON ]    7      Jun 09  ⋯ │   │
│          │  └────────────────────────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────────────────────┘
```

Header row: page title left, **New automation** button (purple primary) right. Below it, the table.

---

## 4. The table

One row per automation. Columns:

| Column | Content | Source |
|---|---|---|
| **Name** | `automations.name` (e.g. "LINK → DM on Reel"). Clicking the name opens Edit. | automations |
| **Type** | Friendly label + small icon — Post / Reel / Story reply / etc. | `automations.type` |
| **Status** | The **on/off toggle** (§5). | `automations.active` |
| **DMs today** | Count of `dm_logs` for this automation since start of today. Mono, tabular. | dm_logs (see §8) |
| **Created** | `automations.created_at`, formatted (e.g. "Jun 17"). Mono. | automations |
| **⋯ actions** | Dropdown: Edit · Duplicate · Delete (§6). | — |

Use the **shadcn Table** + **DropdownMenu** components. Sort newest-created first by default.

---

## 5. Status toggle (the signature interaction)

A Server Action — no API route boilerplate (PRD 9.5.1):

```ts
// app/(app)/automations/actions.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleAutomation(id: string, active: boolean) {
  const supabase = createClient();
  await supabase.from('automations').update({ active }).eq('id', id);
  revalidatePath('/automations');
}
```

- **Optimistic UI:** flip the visual state immediately on tap (`useOptimistic` or local state), then call the action; if it errors, revert and show an error toast.
- **Confirm with a toast** on success: "Automation paused." / "Automation activated." (Action keeps its name through to the toast.)
- **Ownership** is enforced by RLS (the `automations` update policy is `user_id = auth.uid()`), so the action is safe even though it takes an id — but never trust a client-passed `user_id`; rely on RLS + the session.

Toggling off means n8n's Node 5 lookup (`active = true`) simply stops matching it — no other cleanup needed.

---

## 6. Row actions (the ⋯ menu)

- **Edit** → navigate to `/automations/[id]`, which is **the wizard reused**, opened at Step 6 (review) with all fields prefilled; the user taps Edit on any step to jump there; saves via **PATCH** (PRD 9.7). This is mostly wiring the existing wizard to load + update instead of insert.
- **Duplicate** → insert a copy of the row with **`active = false`** and name `Copy of <name>`, then route to its Edit view. Defaulting to off prevents an accidental second automation firing on the same post.
- **Delete** → open a **confirm dialog** (shadcn Dialog) — "Delete this automation? This can't be undone." — destructive button uses `--accent-pop`. On confirm, delete the row; `ON DELETE CASCADE` cleans up dependent `short_links`. Toast: "Automation deleted."

---

## 7. New automation button + free-plan gating

- **New automation** (top-right) routes to `/automations/new` (the wizard).
- **Free plan allows 1 automation** (PRD 10.5.2). If a free user already has one, the button instead routes to `/billing?upgrade=pro&feature=automations` (or shows an inline upgrade nudge). Enforce the same check server-side on create — the UI gate is convenience, not security.

---

## 8. Data fetching

Server Component. Avoid an N+1 on "DMs today" — fetch the list, then one grouped count:

```ts
// 1) the automations
const { data: automations } = await supabase
  .from('automations')
  .select('*')
  .order('created_at', { ascending: false });

// 2) DMs today, grouped by automation in a single pass
//    (use an RPC / Postgres function, or a view, returning { automation_id, count })
//    e.g. SELECT automation_id, count(*) FROM dm_logs
//         WHERE sent_at >= date_trunc('day', now()) GROUP BY automation_id;
```

Map the grouped counts onto the rows client-side. RLS scopes both tables to the user. Confirm `dm_logs.automation_id` exists and `sent_at` is the timestamp column before wiring the count.

---

## 9. Empty state

No automations yet → a centered card: "No automations yet. Create one to auto-DM a link when someone comments your keyword." + **Create your first automation** button. (You already have this from the prototype — reuse it.)

---

## 10. Seed-data testing

1. Have 2–3 `automations` rows with mixed `active` true/false and different `type`/`name`.
2. Insert some `dm_logs` rows for one of them dated **today** so "DMs today" shows a non-zero count, and some dated earlier so they don't.
3. Load `/automations`: confirm rows, counts, dates render. Toggle one off → confirm the toast and that the row reflects it (and the DB `active` flips). Duplicate one → confirm a `Copy of …` appears, inactive. Delete one → confirm the dialog and removal.

No live webhook required for any of this.

---

## 11. Responsive

| Region | Desktop ≥1024px | Tablet 768–1023px | Mobile <768px |
|---|---|---|---|
| **Shell** | Sidebar visible. | Sidebar → drawer (from dashboard shell). | Drawer. |
| **Header** | Title + button inline. | Same. | Title on one line, full-width button below. |
| **Table** | Full table, all columns. | Hide "Created"; keep name/type/status/DMs. | **Table collapses to cards** — one card per automation: name + type, the toggle, "DMs today," and a ⋯ menu. Don't horizontally scroll a table on mobile. |

Tap targets ≥44px (the toggle especially). `prefers-reduced-motion` removes toggle/row transitions.

---

## 12. Copy

- Toggle toasts match the action: "Automation activated." / "Automation paused."
- Delete dialog is direct, not vague: says what's deleted and that it's permanent.
- Column header is "DMs today," not "dm_logs count." Names are user-facing strings, never table/column names.
- Empty state is an invitation with a CTA, not an apology.

---

## 13. Accessibility / quality floor

- The toggle is a real, labeled control (`role="switch"`, `aria-checked`), keyboard-operable, visible focus ring.
- The ⋯ menu and delete dialog are keyboard-navigable; dialog traps focus and closes on Esc.
- Status is not color-only — the toggle shows ON/OFF text, not just a color.
- Tabular figures so counts don't jitter.
- Unauthenticated → redirect to `/login`.

---

## 14. Definition of done

1. `/automations` lists all of the user's automations in the app shell with name, type, status, DMs today, created date.
2. The on/off toggle flips `automations.active` via the Server Action, optimistically, with a confirming toast.
3. Edit opens the wizard prefilled (PATCH on save); Duplicate creates an inactive copy; Delete confirms then removes.
4. New automation routes to the wizard, gated to upgrade for free users at their limit.
5. Empty state shows the CTA.
6. Fully functional on seed data.
7. Responsive — collapses to cards at mobile width; keyboard-operable; reduced-motion respected.

---

## 15. Out of scope (related, separate)

- The **Edit page internals** (`/automations/[id]`) beyond "reuse the wizard at Step 6, save via PATCH" — if it needs more than wiring, it gets its own short spec.
- **Analytics** (`/analytics`) — charts, next screen.
- Bulk actions (select multiple) — not in v1; over-engineering.

---

## 16. Pre-build checklist

- [ ] Confirm `dm_logs.automation_id` and `sent_at` exist (for "DMs today").
- [ ] Add the grouped "DMs today" query (RPC or view) to avoid N+1.
- [ ] Confirm the RLS update policy on `automations` is `user_id = auth.uid()` (it is, per PRD §6).
- [ ] Reuse the app shell from the dashboard and the wizard for Edit — don't rebuild either.
- [ ] Seed mixed automations + today/earlier `dm_logs` per §10.
- [ ] No dark plate on this surface; mono numerals; `--accent-pop` only on the delete button.
