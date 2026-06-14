# AutoDM — Phase A: Instagram OAuth Connection Flow

## Implementation Specification for Claude

> **Purpose of this document:** This is a complete, self-contained build spec for implementing the Instagram OAuth connection flow ("Connect Instagram" button → store encrypted token). Hand this to Claude and it should be able to implement every file, handle every edge case, and produce production-grade code without further clarification.

---

## 0. Context & Stack

**Project:** AutoDM — an Instagram DM automation SaaS. When someone comments a keyword on a connected Instagram account's post, an automated DM is sent.

**This phase builds:** The OAuth "dance" that lets a user connect their Instagram Business account. The end result: a row in `instagram_accounts` containing the **encrypted** Page Access Token, ready for the n8n workflow to use when sending DMs.

**Stack (already set up — do not re-scaffold):**
- Next.js 14 (App Router, TypeScript, `src/` directory)
- Tailwind CSS + shadcn/ui (style: New York, Slate, CSS vars enabled)
- Supabase (Postgres + Auth + SSR) — project ID `hgyxichoaoxkjvkzonme`
- Packages already installed: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `clsx`, `tailwind-merge`, `react-hook-form`, `zod`, `@hookform/resolvers`

**Database is ready:** The `instagram_accounts` table already exists with this exact shape (do not create it):
```
id                       uuid (PK, gen_random_uuid())
user_id                  uuid (FK -> users.id, on delete cascade)
ig_user_id               text NOT NULL
ig_username              text NOT NULL
fb_page_id               text NOT NULL
fb_page_name             text
access_token_encrypted   text NOT NULL    -- AES-256-GCM ciphertext (base64)
access_token_iv          text NOT NULL    -- AES-256-GCM IV (base64)
token_expires_at         timestamptz
scopes                   text[] NOT NULL DEFAULT '{}'
is_active                boolean NOT NULL DEFAULT true
webhook_subscribed       boolean NOT NULL DEFAULT false
last_webhook_at          timestamptz
disconnected_at          timestamptz
disconnect_reason        text
created_at               timestamptz NOT NULL DEFAULT now()
updated_at               timestamptz NOT NULL DEFAULT now()
UNIQUE(user_id, ig_user_id)
```

RLS is enabled. Policies allow a user to select/insert/update/delete only rows where `auth.uid() = user_id`. **Important:** the OAuth callback runs server-side and must use the **service-role** client (which bypasses RLS) to insert, because the insert happens in an API route where we set `user_id` explicitly — see §6.

---

## 1. Prerequisites — Meta Console (must be done before code works)

These are manual steps in the Meta Developer Console. The code will not function until these exist. Claude should NOT attempt to do these (they are console clicks), but should remind the user to complete them and should read the resulting values from env vars.

1. **Add product "Facebook Login for Business"** to the app (App ID `1701580027698004`).
2. **Settings → Valid OAuth Redirect URIs** — add both:
   - `https://<CURRENT_NGROK_SUBDOMAIN>.ngrok-free.dev/api/auth/callback/facebook` (dev)
   - `https://<PROD_DOMAIN>/api/auth/callback/facebook` (production, later)
3. Set **Enforce HTTPS: ON** and **Use Strict Mode for redirect URIs: ON**.
4. **Create a Configuration** (Facebook Login for Business → Configurations → Create):
   - Name: `AutoDM Standard`
   - Login variant: `Business Login`
   - Permissions to toggle ON: `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`, `pages_show_list`, `pages_read_engagement`, `pages_messaging`, `business_management`
   - **Copy the Configuration ID** → this becomes env var `FB_LOGIN_CONFIG_ID`.

> ⚠️ **ngrok caveat:** The free ngrok URL changes on every restart. Each new session the user MUST update the Valid OAuth Redirect URI in Meta Console AND the `NEXT_PUBLIC_APP_URL` env var to match. Build the code to read the redirect URI from `NEXT_PUBLIC_APP_URL` so only one value needs changing.

---

## 2. Environment Variables

All of these must exist in `.env.local`. Claude should assume they exist; if referencing them, use the exact names below. Add any missing ones to `.env.example` (blanked).

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hgyxichoaoxkjvkzonme.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # real anon JWT
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # real service-role JWT (server only)

# Meta / Facebook
NEXT_PUBLIC_FB_APP_ID=1701580027698004
FB_APP_SECRET=...                             # server only
FB_LOGIN_CONFIG_ID=...                        # from Meta Console step 1.4
FB_GRAPH_API_VERSION=v18.0

# Encryption — CRITICAL, never rotate in production
ENCRYPTION_KEY=...                            # base64, 32 bytes (from: openssl rand -base64 32)

# App
NEXT_PUBLIC_APP_URL=https://<ngrok>.ngrok-free.dev   # dev: ngrok URL; prod: real domain
```

> **ENCRYPTION_KEY format decision:** This spec uses **base64** encoding for the key (matches `openssl rand -base64 32`). The crypto module in §4 decodes with `Buffer.from(process.env.ENCRYPTION_KEY, 'base64')`. The key must decode to exactly 32 bytes. The module MUST validate this at load time and throw a clear error otherwise. (Note: the PRD shows a hex variant elsewhere — this spec standardizes on base64. Pick one and never mix.)

---

## 3. Files to Create / Modify

| File | Purpose | New or Edit |
| --- | --- | --- |
| `src/lib/supabase/client.ts` | Browser client (anon) | Create if missing |
| `src/lib/supabase/server.ts` | Server client (anon + cookies) | Create if missing |
| `src/lib/supabase/admin.ts` | Service-role client (bypasses RLS) | Create |
| `src/lib/crypto.ts` | AES-256-GCM encrypt/decrypt | Create |
| `src/lib/meta.ts` | Graph API helper functions | Create |
| `src/app/api/auth/instagram/start/route.ts` | OAuth start (redirect to FB) | Create |
| `src/app/api/auth/callback/facebook/route.ts` | OAuth callback (exchange + save) | Create |
| `src/app/(app)/accounts/page.tsx` | Accounts page (server component) | Create |
| `src/components/accounts/connect-button.tsx` | Connect button (client) | Create |
| `src/components/accounts/account-card.tsx` | Connected account card (client) | Create |
| `src/components/accounts/disconnect-dialog.tsx` | Disconnect confirm modal | Create |
| `src/app/api/auth/instagram/disconnect/route.ts` | Disconnect endpoint | Create |

---

## 4. `src/lib/crypto.ts` — Encryption Module

**Requirements:**
- Algorithm: `aes-256-gcm`.
- Key from `process.env.ENCRYPTION_KEY` decoded as **base64**; must be exactly 32 bytes or throw at module load.
- `encryptToken(plaintext)` returns `{ encrypted, iv }` where both are base64. `encrypted` = ciphertext concatenated with the 16-byte GCM auth tag, then base64-encoded. `iv` = the 12-byte IV base64-encoded.
- `decryptToken(encrypted, ivB64)` reverses it: splits off the last 16 bytes as the auth tag.
- This format MUST exactly match what the n8n Decrypt Token node expects (n8n splits `data.subarray(0, len-16)` as ciphertext and `data.subarray(len-16)` as tag, reads IV separately). Keep these in lockstep.

```typescript
import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'base64');

if (KEY.length !== 32) {
  throw new Error(
    `ENCRYPTION_KEY must decode to 32 bytes, got ${KEY.length}. ` +
    `Generate with: openssl rand -base64 32`
  );
}

/** Encrypt a token. Returns ciphertext+tag (base64) and iv (base64). */
export function encryptToken(plaintext: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes
  return {
    encrypted: Buffer.concat([ciphertext, tag]).toString('base64'),
    iv: iv.toString('base64'),
  };
}

/** Decrypt a token given the stored ciphertext+tag (base64) and iv (base64). */
export function decryptToken(encrypted: string, ivB64: string): string {
  const data = Buffer.from(encrypted, 'base64');
  const ciphertext = data.subarray(0, data.length - 16);
  const tag = data.subarray(data.length - 16);
  const iv = Buffer.from(ivB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
```

**Edge cases to handle:**
- Module-load validation of key length (above).
- `decryptToken` will throw if the auth tag is invalid (tampered data or wrong key) — let it throw; callers catch and treat as "token unreadable → mark account inactive."

---

## 5. Supabase Clients

### `src/lib/supabase/client.ts` (browser)
```typescript
'use client';
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

### `src/lib/supabase/server.ts` (server components / route handlers, respects RLS)
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }); } catch {}
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }); } catch {}
        },
      },
    }
  );
};
```

### `src/lib/supabase/admin.ts` (service-role — bypasses RLS, server only)
```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// NEVER import this into a Client Component. Server-only.
export const createAdminClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
```

---

## 6. The OAuth Flow — Full Sequence

```
User clicks "Connect Instagram"
   → GET /api/auth/instagram/start
       - require logged-in user (else redirect /login)
       - generate CSRF state, set httpOnly cookie fb_oauth_state
       - also store the logged-in user's id in a second short-lived cookie (fb_oauth_uid)
         (callback needs to know which AutoDM user this connection belongs to)
       - redirect to FB dialog with config_id
   → User approves on Facebook
   → GET /api/auth/callback/facebook?code=...&state=...
       1. verify state == cookie (CSRF) — else redirect /accounts?error=invalid_state
       2. read fb_oauth_uid cookie — else redirect /accounts?error=session_lost
       3. exchange code → short-lived user token
       4. exchange short token → long-lived (60-day) user token
       5. GET /me/accounts → list of Pages + per-Page tokens
       6. for each Page: GET /{page_id}?fields=instagram_business_account
            - skip Pages without a linked IG account
            - fetch IG username via /{ig_user_id}?fields=username
            - encrypt the PAGE access token (not the user token)
            - upsert into instagram_accounts (service-role client)
            - POST /{page_id}/subscribed_apps?subscribed_fields=feed,messages,message_reactions
              to subscribe the Page to webhooks; set webhook_subscribed=true on success
       7. clear oauth cookies
       8. redirect /accounts?connected=true  (or ?connected=none if no IG account found)
```

> **Why store the PAGE token, not the user token:** DMs are sent using the Page Access Token. The long-lived user token is only used to enumerate Pages and fetch their tokens. We persist the Page token (which for Pages-with-IG inherits long-lived/often-permanent validity).

---

## 7. `src/lib/meta.ts` — Graph API Helpers

Centralize all Graph API calls here so the callback route stays readable. Each function throws on non-OK responses with a descriptive message.

```typescript
const V = process.env.FB_GRAPH_API_VERSION || 'v18.0';
const BASE = `https://graph.facebook.com/${V}`;

async function gget(url: string) {
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) {
    throw new Error(`Meta API error: ${json.error.message} (code ${json.error.code})`);
  }
  return json;
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const url =
    `${BASE}/oauth/access_token` +
    `?client_id=${process.env.NEXT_PUBLIC_FB_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&client_secret=${process.env.FB_APP_SECRET}` +
    `&code=${code}`;
  const json = await gget(url);
  return json.access_token as string;
}

export async function exchangeForLongLivedToken(shortToken: string) {
  const url =
    `${BASE}/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${process.env.NEXT_PUBLIC_FB_APP_ID}` +
    `&client_secret=${process.env.FB_APP_SECRET}` +
    `&fb_exchange_token=${shortToken}`;
  const json = await gget(url);
  // expires_in may be present (seconds) or absent (permanent)
  return { token: json.access_token as string, expiresIn: json.expires_in as number | undefined };
}

export async function getPages(userToken: string) {
  const url = `${BASE}/me/accounts?fields=id,name,access_token&access_token=${userToken}`;
  const json = await gget(url);
  return (json.data || []) as Array<{ id: string; name: string; access_token: string }>;
}

export async function getInstagramAccount(pageId: string, pageToken: string) {
  const url = `${BASE}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`;
  const json = await gget(url);
  return json.instagram_business_account?.id as string | undefined;
}

export async function getInstagramUsername(igUserId: string, pageToken: string) {
  const url = `${BASE}/${igUserId}?fields=username&access_token=${pageToken}`;
  const json = await gget(url);
  return json.username as string;
}

export async function subscribePageToWebhooks(pageId: string, pageToken: string) {
  const url =
    `${BASE}/${pageId}/subscribed_apps` +
    `?subscribed_fields=feed,messages,message_reactions` +
    `&access_token=${pageToken}`;
  const res = await fetch(url, { method: 'POST' });
  const json = await res.json();
  return json.success === true;
}
```

---

## 8. `src/app/api/auth/instagram/start/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'node:crypto';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!user) {
    return NextResponse.redirect(new URL('/login', appUrl));
  }

  const state = crypto.randomBytes(32).toString('hex');
  const redirectUri = `${appUrl}/api/auth/callback/facebook`;

  const fbUrl =
    `https://www.facebook.com/${process.env.FB_GRAPH_API_VERSION || 'v18.0'}/dialog/oauth` +
    `?client_id=${process.env.NEXT_PUBLIC_FB_APP_ID}` +
    `&config_id=${process.env.FB_LOGIN_CONFIG_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&response_type=code`;

  const res = NextResponse.redirect(fbUrl);
  const cookieOpts = { httpOnly: true, secure: true, sameSite: 'lax' as const, maxAge: 600, path: '/' };
  res.cookies.set('fb_oauth_state', state, cookieOpts);
  res.cookies.set('fb_oauth_uid', user.id, cookieOpts);
  return res;
}
```

**Edge cases:**
- Not logged in → redirect `/login`.
- Missing `FB_LOGIN_CONFIG_ID` → the FB dialog will error; optionally guard and redirect `/accounts?error=config_missing`.

---

## 9. `src/app/api/auth/callback/facebook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptToken } from '@/lib/crypto';
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getPages,
  getInstagramAccount,
  getInstagramUsername,
  subscribePageToWebhooks,
} from '@/lib/meta';

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/accounts?error=${reason}`, appUrl));

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const cookieState = req.cookies.get('fb_oauth_state')?.value;
  const uid = req.cookies.get('fb_oauth_uid')?.value;

  // 1. CSRF
  if (!code || !state || state !== cookieState) return fail('invalid_state');
  // 2. Session
  if (!uid) return fail('session_lost');

  try {
    const redirectUri = `${appUrl}/api/auth/callback/facebook`;

    // 3 + 4. tokens
    const shortToken = await exchangeCodeForToken(code, redirectUri);
    if (!shortToken) return fail('token_exchange_failed');
    const { token: longToken, expiresIn } = await exchangeForLongLivedToken(shortToken);
    if (!longToken) return fail('long_token_failed');

    // 5. pages
    const pages = await getPages(longToken);
    if (pages.length === 0) return fail('no_pages');

    const admin = createAdminClient();
    let connectedCount = 0;

    // 6. per page
    for (const page of pages) {
      const igUserId = await getInstagramAccount(page.id, page.access_token);
      if (!igUserId) continue; // Page has no linked IG Business account

      const igUsername = await getInstagramUsername(igUserId, page.access_token);
      const { encrypted, iv } = encryptToken(page.access_token);

      const tokenExpiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 1000).toISOString()
        : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // default 60d

      const subscribed = await subscribePageToWebhooks(page.id, page.access_token);

      await admin
        .from('instagram_accounts')
        .upsert(
          {
            user_id: uid,
            ig_user_id: igUserId,
            ig_username: igUsername,
            fb_page_id: page.id,
            fb_page_name: page.name,
            access_token_encrypted: encrypted,
            access_token_iv: iv,
            token_expires_at: tokenExpiresAt,
            scopes: [
              'instagram_basic',
              'instagram_manage_comments',
              'instagram_manage_messages',
            ],
            is_active: true,
            webhook_subscribed: subscribed,
            disconnected_at: null,
            disconnect_reason: null,
          },
          { onConflict: 'user_id,ig_user_id' }
        );

      connectedCount++;
    }

    // 7. clear cookies
    const target = connectedCount > 0 ? '/accounts?connected=true' : '/accounts?connected=none';
    const res = NextResponse.redirect(new URL(target, appUrl));
    res.cookies.delete('fb_oauth_state');
    res.cookies.delete('fb_oauth_uid');
    return res;
  } catch (err) {
    console.error('[fb-callback]', err);
    return fail('unexpected');
  }
}
```

**Edge cases handled:**
- `invalid_state` — CSRF mismatch or missing code/state.
- `session_lost` — `fb_oauth_uid` cookie gone (user took >10 min, or cookies cleared).
- `token_exchange_failed`, `long_token_failed` — Meta rejected the exchange (bad secret, expired code).
- `no_pages` — user has no Facebook Pages.
- `connected=none` — user has Pages but none linked to an IG Business account (show a helpful message telling them to link IG to a Page).
- Per-Page loop continues past Pages without IG (`continue`), so one bad Page doesn't abort the rest.
- `upsert` with `onConflict: 'user_id,ig_user_id'` makes reconnect idempotent — reconnecting refreshes the token instead of erroring on the unique constraint.
- `webhook_subscribed` reflects the real subscription result, not assumed true.
- All wrapped in try/catch → `unexpected` rather than a 500 white screen.

---

## 10. Accounts Page — `src/app/(app)/accounts/page.tsx` (Server Component)

Fetches the current user's connected accounts and renders them. Reads the `?connected` / `?error` query param to show a toast/banner.

```typescript
import { createClient } from '@/lib/supabase/server';
import { ConnectButton } from '@/components/accounts/connect-button';
import { AccountCard } from '@/components/accounts/account-card';

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: accounts } = await supabase
    .from('instagram_accounts')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">Connected Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Connect your Instagram Business account to start automating DMs.
          </p>
        </div>
        <ConnectButton />
      </div>

      {searchParams.error && <ErrorBanner code={searchParams.error} />}
      {searchParams.connected === 'true' && <SuccessBanner />}
      {searchParams.connected === 'none' && <NoIgBanner />}

      <div className="space-y-3">
        {(accounts ?? []).length === 0 ? (
          <EmptyState />
        ) : (
          accounts!.map((acc) => <AccountCard key={acc.id} account={acc} />)
        )}
      </div>
    </div>
  );
}
```

> Claude should also implement small inline components `ErrorBanner`, `SuccessBanner`, `NoIgBanner`, `EmptyState` (or co-locate them). `ErrorBanner` maps each error code to a human message:
> - `invalid_state` → "Connection failed a security check. Please try again."
> - `session_lost` → "Your session expired during connection. Please log in and try again."
> - `token_exchange_failed` / `long_token_failed` → "Facebook rejected the connection. Please try again."
> - `no_pages` → "No Facebook Page found. Instagram Business accounts must be linked to a Facebook Page."
> - `config_missing` → "Server configuration error. Contact support."
> - `unexpected` → "Something went wrong. Please try again."

---

## 11. Connect Button — `src/components/accounts/connect-button.tsx` (Client)

```typescript
'use client';
import { Instagram } from 'lucide-react';

export function ConnectButton() {
  return (
    <a
      href="/api/auth/instagram/start"
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
    >
      <Instagram className="h-4 w-4" />
      Connect Instagram Account
    </a>
  );
}
```

> A plain `<a>` (full navigation) is intentional — OAuth requires a top-level redirect, not a `fetch`. Do not use `router.push` to the start route via client fetch.

---

## 12. Account Card — `src/components/accounts/account-card.tsx` (Client)

Renders one connected account. Shows status derived from `token_expires_at`:

- **Healthy** (green): expires > 7 days away, `is_active = true`.
- **Token expiring in N days** (amber): expires within 7 days.
- **Token expired — Reconnect** (red): expired or `is_active = false`.

Also shows `@ig_username`, `fb_page_name`, last sync (`last_webhook_at` or `created_at`), and a **Disconnect** button that opens the confirm dialog.

```typescript
'use client';
import { useState } from 'react';
import { DisconnectDialog } from './disconnect-dialog';

function statusOf(account: any): { label: string; tone: 'green' | 'amber' | 'red' } {
  if (!account.is_active) return { label: 'Disconnected', tone: 'red' };
  if (!account.token_expires_at) return { label: 'Healthy', tone: 'green' };
  const days = Math.floor(
    (new Date(account.token_expires_at).getTime() - Date.now()) / 86_400_000
  );
  if (days < 0) return { label: 'Token expired — reconnect', tone: 'red' };
  if (days <= 7) return { label: `Token expiring in ${days} day${days === 1 ? '' : 's'}`, tone: 'amber' };
  return { label: 'Healthy', tone: 'green' };
}

export function AccountCard({ account }: { account: any }) {
  const [open, setOpen] = useState(false);
  const status = statusOf(account);
  const dot = { green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500' }[status.tone];

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        {account.ig_username?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1">
        <div className="font-medium">@{account.ig_username}</div>
        <div className="text-xs text-muted-foreground">
          {account.fb_page_name} · <span className={`inline-block h-2 w-2 rounded-full ${dot} align-middle`} /> {status.label}
        </div>
      </div>
      {status.tone === 'red' ? (
        <a href="/api/auth/instagram/start" className="rounded-md border px-3 py-1.5 text-sm">Reconnect</a>
      ) : (
        <button onClick={() => setOpen(true)} className="rounded-md border px-3 py-1.5 text-sm">Disconnect</button>
      )}
      <DisconnectDialog open={open} onOpenChange={setOpen} account={account} />
    </div>
  );
}
```

---

## 13. Disconnect — Dialog + Endpoint

### `src/components/accounts/disconnect-dialog.tsx` (Client)
Confirm modal. Warns: *"Disconnecting will disable all automations for this account."* On confirm → `fetch('/api/auth/instagram/disconnect', { method: 'POST', body: JSON.stringify({ id }) })` → on success `router.refresh()`.

### `src/app/api/auth/instagram/disconnect/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  // RLS ensures the user can only update their own row.
  const { error } = await supabase
    .from('instagram_accounts')
    .update({
      is_active: false,
      disconnected_at: new Date().toISOString(),
      disconnect_reason: 'user_requested',
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also deactivate this account's automations
  await supabase
    .from('automations')
    .update({ is_active: false })
    .eq('ig_account_id', id)
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
```

> **Design choice:** Disconnect is a *soft* disable (`is_active = false`), not a hard delete — this preserves `dm_logs` history and lets the user reconnect. It also flips all the account's automations to inactive so no orphaned automation keeps trying to fire.

---

## 14. Middleware Note

The project's root `middleware.ts` protects `/accounts` (requires auth) and must **exclude** `/api/webhook` routes from interference. The OAuth routes under `/api/auth/...` should remain reachable. Confirm the matcher does not redirect `/api/auth/callback/facebook` (it shouldn't, since the user has a session by then, but the callback must not require the matcher to inject anything). If the existing matcher is `['/((?!_next/static|_next/image|favicon.ico|api/webhook).*)']`, that's fine — the callback works because the user is authenticated.

---

## 15. Manual Test Plan (Claude should output these steps for the user to run)

1. Ensure all env vars set; restart `pnpm dev` and ngrok; update Meta redirect URI + `NEXT_PUBLIC_APP_URL` to current ngrok URL.
2. Sign up / log in so a Supabase session exists.
3. Visit `/accounts` → click **Connect Instagram Account**.
4. Approve on the Facebook dialog.
5. Land back on `/accounts?connected=true` → see the account card with **Healthy** status.
6. Verify in Supabase SQL Editor:
   ```sql
   select ig_username, fb_page_id, is_active, webhook_subscribed,
          length(access_token_encrypted) as enc_len,
          length(access_token_iv) as iv_len,
          token_expires_at
   from instagram_accounts;
   ```
   - `access_token_encrypted` must be a base64 blob (NOT a plain `EAA...` token).
   - `iv_len` should be ~16 (base64 of 12 bytes).
7. **Round-trip test:** temporarily add a server action or script that calls `decryptToken(row.access_token_encrypted, row.access_token_iv)` and confirms it returns a working `EAA...` token (test by calling `/me?access_token=...`). Remove after verifying.
8. **Reconnect idempotency:** click Connect again with the same IG → should update the same row (no duplicate, no unique-constraint error).
9. **Disconnect:** click Disconnect → confirm → card shows Disconnected and the account's automations are now inactive.
10. **Error path:** manually hit `/api/auth/callback/facebook?code=bad&state=bad` → should redirect to `/accounts?error=invalid_state` with a friendly banner.

---

## 16. After This Phase — Swap the n8n Token Decryption

Once a real encrypted token exists in `instagram_accounts`, update Workflow 1's **Decrypt Token** node (currently a hardcoded placeholder) to do real decryption. Because n8n's Code-node sandbox blocks `crypto`/`https` in this environment, prefer the PRD's **Option B**: expose an internal Next.js endpoint `POST /api/internal/get-token-by-account-id` (protected by a shared `INTERNAL_API_KEY` header) that decrypts server-side and returns the token; n8n calls it with an HTTP Request node. This keeps the encryption key out of n8n entirely. (Implementing that internal endpoint can be a follow-up task; note it here so it isn't forgotten.)

---

## 17. Security Checklist (must all hold)

- [ ] `ENCRYPTION_KEY` is base64, decodes to exactly 32 bytes, never committed, never logged.
- [ ] Plain-text tokens never written to DB, never `console.log`-ed.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` used only in `admin.ts`, never imported into a Client Component.
- [ ] `fb_oauth_state` cookie is `httpOnly`, `secure`, `sameSite=lax`, `maxAge=600`.
- [ ] CSRF state compared before any token exchange.
- [ ] Callback never trusts a `user_id` from the query string — only from the `fb_oauth_uid` httpOnly cookie set server-side at start.
- [ ] Disconnect verifies ownership via `.eq('user_id', user.id)` (defense-in-depth on top of RLS).
- [ ] All Graph API errors caught; user sees a friendly banner, never a raw stack trace.
- [ ] `connected=none` path guides the user to link IG to a Facebook Page.

---

## 18. Definition of Done

- Clicking **Connect Instagram** completes the full OAuth dance and stores an **encrypted** Page token + IV in `instagram_accounts`.
- The account appears on `/accounts` with correct health status.
- Reconnect is idempotent; Disconnect soft-disables the account and its automations.
- Every error path redirects to `/accounts?error=...` with a human-readable banner.
- A decrypt round-trip yields a working Page Access Token.
- No plain-text token anywhere in the database or logs.
