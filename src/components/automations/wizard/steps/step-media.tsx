"use client";

// Step 2 — Media (spec §6). Fetches the creator's recent media from our server
// route (token decrypted server-side, cached 5 min). The pinned "All posts"
// card selects media_id = null. Loading = shimmer skeletons; empty/error copy
// per spec §9.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Images, RefreshCw } from "lucide-react";

import { cardContainer, cardItem } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { IgMedia } from "@/lib/meta";
import type { WizardState } from "@/lib/automations/wizard";

export function StepMedia({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
  const reduce = useReducedMotion();
  const [media, setMedia] = useState<IgMedia[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/instagram/media?ig_account_id=${encodeURIComponent(state.ig_account_id)}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "fetch_failed");
      }
      const body = (await res.json()) as { media: IgMedia[] };
      setMedia(body.media);
    } catch {
      setError("Couldn't load your posts.");
    } finally {
      setLoading(false);
    }
  }, [state.ig_account_id]);

  useEffect(() => {
    // Genuine external-system sync (fetch + setState in load); rule opted out.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const allSelected = state.media_id === null;
  const isEmpty = !loading && !error && (media?.length ?? 0) === 0;

  return (
    <div>
      {error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f3d9d6] bg-danger-bg px-4 py-3 text-sm text-danger">
          <span>{error}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 font-medium text-ink hover:underline"
            >
              <RefreshCw className="size-4" /> Retry
            </button>
            <Link
              href="/accounts"
              className="font-medium text-brand hover:underline"
            >
              Reconnect
            </Link>
          </div>
        </div>
      )}

      <motion.div
        role="radiogroup"
        aria-label="Content to watch"
        variants={reduce ? undefined : cardContainer}
        initial={reduce ? undefined : "hidden"}
        animate={reduce ? undefined : "show"}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {/* All posts, pinned first */}
        <motion.button
          variants={reduce ? undefined : cardItem}
          type="button"
          role="radio"
          aria-checked={allSelected}
          onClick={() => set({ media_id: null, media_url: null })}
          className={cn(
            "relative flex aspect-square min-h-11 flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app",
            allSelected
              ? "border-[1.5px] border-border-focus bg-selected-bg"
              : "border-border-default bg-surface-card hover:border-border-strong",
          )}
        >
          <Images
            className={cn("size-6", allSelected ? "text-brand" : "text-ink-muted")}
          />
          <span
            className={cn(
              "text-[12px] font-medium",
              allSelected ? "text-brand" : "text-ink",
            )}
          >
            All posts
          </span>
          {allSelected && (
            <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-action text-white">
              <Check className="size-3.5" />
            </span>
          )}
        </motion.button>

        {loading &&
          Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="wz-shimmer aspect-square rounded-xl bg-surface-muted"
            />
          ))}

        {!loading &&
          media?.map((m) => {
            const selected = state.media_id === m.id;
            const src = m.thumbnail_url ?? m.media_url ?? "";
            return (
              <motion.button
                key={m.id}
                variants={reduce ? undefined : cardItem}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() =>
                  set({ media_id: m.id, media_url: m.thumbnail_url ?? m.media_url })
                }
                title={m.caption ?? undefined}
                className={cn(
                  "relative aspect-square min-h-11 overflow-hidden rounded-xl border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app",
                  selected
                    ? "border-[1.5px] border-border-focus"
                    : "border-border-default hover:border-border-strong",
                )}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={m.caption ?? "Instagram post"}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-surface-muted text-[10px] text-ink-muted">
                    No preview
                  </div>
                )}
                {selected && (
                  <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-action text-white">
                    <Check className="size-3.5" />
                  </span>
                )}
              </motion.button>
            );
          })}
      </motion.div>

      {isEmpty && (
        <p className="mt-4 text-sm text-ink-tertiary">
          No posts yet — publish on Instagram, or choose{" "}
          <span className="font-medium text-ink">All posts</span>.
        </p>
      )}
      {!loading && !error && (
        <p className="mt-3 text-xs text-ink-muted">recent 25 only</p>
      )}
    </div>
  );
}
