// Centralized Meta Graph API helpers (spec §7).
// Each function throws on a non-OK Graph response with a descriptive message.

const VERSION = process.env.FB_GRAPH_API_VERSION || "v18.0";
const BASE = `https://graph.facebook.com/${VERSION}`;

function buildUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${BASE}/${path}`);
  url.search = new URLSearchParams(params).toString();
  return url.toString();
}

async function gget(url: string) {
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) {
    throw new Error(
      `Meta API error: ${json.error.message} (code ${json.error.code})`,
    );
  }
  return json;
}

/** Exchange an OAuth `code` for a short-lived user access token. */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<string> {
  const json = await gget(
    buildUrl("oauth/access_token", {
      client_id: process.env.NEXT_PUBLIC_FB_APP_ID!,
      redirect_uri: redirectUri,
      client_secret: process.env.FB_APP_SECRET!,
      code,
    }),
  );
  return json.access_token as string;
}

/** Exchange a short-lived token for a long-lived (≈60-day) user token. */
export async function exchangeForLongLivedToken(
  shortToken: string,
): Promise<{ token: string; expiresIn?: number }> {
  const json = await gget(
    buildUrl("oauth/access_token", {
      grant_type: "fb_exchange_token",
      client_id: process.env.NEXT_PUBLIC_FB_APP_ID!,
      client_secret: process.env.FB_APP_SECRET!,
      fb_exchange_token: shortToken,
    }),
  );
  // expires_in may be present (seconds) or absent (effectively permanent).
  return {
    token: json.access_token as string,
    expiresIn: json.expires_in as number | undefined,
  };
}

/** List the Facebook Pages the user manages, each with its own Page token. */
export async function getPages(
  userToken: string,
): Promise<Array<{ id: string; name: string; access_token: string }>> {
  const json = await gget(
    buildUrl("me/accounts", {
      fields: "id,name,access_token",
      access_token: userToken,
    }),
  );
  return (json.data || []) as Array<{
    id: string;
    name: string;
    access_token: string;
  }>;
}

/**
 * Fetch the Instagram Business account linked to a Page (id + username) in a
 * single nested query. Returns null if the Page has no linked IG account.
 */
export async function getInstagramBusinessAccount(
  pageId: string,
  pageToken: string,
): Promise<{ id: string; username: string } | null> {
  const json = await gget(
    buildUrl(pageId, {
      fields: "instagram_business_account{id,username}",
      access_token: pageToken,
    }),
  );
  const account = json.instagram_business_account;
  if (!account?.id) return null;
  return { id: account.id as string, username: account.username as string };
}

export type IgMedia = {
  id: string;
  caption: string | null;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
  media_url: string | null;
  thumbnail_url: string | null;
  permalink: string;
  timestamp: string;
};

/**
 * Fetch a creator's recent media for the wizard's "select a post" step (spec §2).
 * `igUserId` is the Instagram Business account id; `pageToken` is the decrypted
 * Page access token. Caller is responsible for ownership checks and caching.
 */
export async function getInstagramMedia(
  igUserId: string,
  pageToken: string,
  limit = 25,
): Promise<IgMedia[]> {
  const json = await gget(
    buildUrl(`${igUserId}/media`, {
      fields:
        "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
      limit: String(limit),
      access_token: pageToken,
    }),
  );
  return (json.data || []) as IgMedia[];
}

/** Subscribe the Page to webhook events. Returns true on success. */
export async function subscribePageToWebhooks(
  pageId: string,
  pageToken: string,
): Promise<boolean> {
  const res = await fetch(
    buildUrl(`${pageId}/subscribed_apps`, {
      subscribed_fields: "feed,messages,message_reactions",
      access_token: pageToken,
    }),
    { method: "POST" },
  );
  const json = await res.json();
  return json.success === true;
}
