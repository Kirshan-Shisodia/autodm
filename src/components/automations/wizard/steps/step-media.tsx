"use client";

// Step 2 — Select target media (spec §5). Fetches the creator's recent media
// from our server route (token decrypted server-side, cached 5 min). The
// "All posts" card selects media_id = null.

import { useCallback, useEffect, useState } from "react";
import { Check, Images, RefreshCw } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { IgMedia } from "@/lib/meta";
import type { WizardState } from "@/lib/automations/wizard";

export function StepMedia({
  state,
  set,
}: {
  state: WizardState;
  set: (patch: Partial<WizardState>) => void;
}) {
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
      setError(
        "We couldn't load your posts right now. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [state.ig_account_id]);

  useEffect(() => {
    // Genuine external-system sync (fetch + setState in load); rule opted out.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function pickAll() {
    set({ media_id: null, media_url: null });
  }
  function pick(m: IgMedia) {
    set({ media_id: m.id, media_url: m.thumbnail_url ?? m.media_url });
  }

  const allSelected = state.media_id === null;

  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[var(--wz-r-card)] border border-[var(--wz-accent-pop)]/30 bg-[var(--wz-accent-pop)]/5 px-4 py-3 text-sm text-[var(--wz-text)]">
          <span>{error}</span>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 font-medium text-[var(--wz-accent)]"
          >
            <RefreshCw className="size-4" /> Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* All posts card, always first */}
        <button
          type="button"
          role="radio"
          aria-checked={allSelected}
          onClick={pickAll}
          className={[
            "relative flex aspect-square min-h-[44px] flex-col items-center justify-center gap-1.5 rounded-[var(--wz-r-card)] border bg-white p-2 text-center transition-colors",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wz-accent)]",
            allSelected
              ? "border-transparent ring-2 ring-inset ring-[var(--wz-accent)]"
              : "border-[var(--wz-border)] hover:border-[var(--wz-accent)]/40",
          ].join(" ")}
        >
          <Images
            className={`size-6 ${allSelected ? "text-[var(--wz-accent)]" : "text-[var(--wz-text-muted)]"}`}
          />
          <span
            className={`text-[12px] font-medium ${allSelected ? "text-[var(--wz-accent)]" : "text-[var(--wz-text)]"}`}
          >
            All posts
          </span>
          {allSelected && (
            <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--wz-accent)] text-white">
              <Check className="size-3.5" />
            </span>
          )}
        </button>

        {loading &&
          Array.from({ length: 9 }).map((_, i) => (
            <Skeleton
              key={i}
              className="aspect-square rounded-[var(--wz-r-card)]"
            />
          ))}

        {!loading &&
          media?.map((m) => {
            const selected = state.media_id === m.id;
            const src = m.thumbnail_url ?? m.media_url ?? "";
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => pick(m)}
                title={m.caption ?? undefined}
                className={[
                  "group relative aspect-square min-h-[44px] overflow-hidden rounded-[var(--wz-r-card)] border transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wz-accent)]",
                  selected
                    ? "border-transparent ring-2 ring-inset ring-[var(--wz-accent)]"
                    : "border-[var(--wz-border)] hover:border-[var(--wz-accent)]/40",
                ].join(" ")}
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
                  <div className="flex size-full items-center justify-center bg-[var(--wz-surface)] text-[10px] text-[var(--wz-text-muted)]">
                    No preview
                  </div>
                )}
                {selected && (
                  <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-[var(--wz-accent)] text-white">
                    <Check className="size-3.5" />
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {!loading && !error && (media?.length ?? 0) === 0 && (
        <p className="mt-4 text-sm text-[var(--wz-text-muted)]">
          No posts found on this account yet. Post something on Instagram, then
          refresh.
        </p>
      )}
    </div>
  );
}
