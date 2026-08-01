"use client";

// Search + category filter, and everything downstream of it: the topic grid and
// the popular-articles list both narrow as you type. Client-side because the
// catalog is a static constant — no round trip buys us anything at this size.
//
// The filter is the one piece of state on the page. When nothing is typed and
// the category is "all" we render the default view from the mockup (six topic
// tiles + the five popular articles); the moment either changes we swap to a
// flat result list, because a grid of tiles is the wrong shape for results.

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Play, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  articleHref,
  CATEGORY_LABEL,
  filterArticles,
  HELP_ARTICLES,
  HELP_CATEGORIES,
  POPULAR_ARTICLES,
  VIDEO_GUIDES,
  type CategoryId,
  type HelpArticle,
} from "@/lib/help";

export function HelpSearch() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");

  const filtering = query.trim().length > 0 || category !== "all";

  const results = useMemo(
    () => filterArticles(HELP_ARTICLES, query, category),
    [query, category],
  );

  return (
    <div className="space-y-4">
      <SearchBar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
      />

      {filtering ? (
        <ResultsCard
          results={results}
          onClear={() => {
            setQuery("");
            setCategory("all");
          }}
        />
      ) : (
        <>
          <TopicGrid onPick={setCategory} />
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <PopularArticles />
            <VideoGuidesCard />
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Search bar
// ------------------------------------------------------------------

function SearchBar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  category: CategoryId | "all";
  onCategoryChange: (v: CategoryId | "all") => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border-default bg-surface-card p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search for help articles, guides, or anything..."
          aria-label="Search help articles"
          className="h-10 w-full rounded-lg bg-transparent pr-3 pl-9 text-[13px] text-ink placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        />
      </div>

      <div className="relative sm:w-52">
        <select
          value={category}
          onChange={(e) =>
            onCategoryChange(e.target.value as CategoryId | "all")
          }
          aria-label="Filter by category"
          className="h-10 w-full appearance-none rounded-lg border border-border-default bg-surface-card pr-9 pl-3 text-[13px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          <option value="all">All Categories</option>
          {HELP_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Default view — topic tiles
// ------------------------------------------------------------------

function TopicGrid({ onPick }: { onPick: (id: CategoryId) => void }) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <h2 className="text-[15px] font-semibold text-ink">Browse Help Topics</h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {HELP_CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              className="flex flex-col items-center rounded-xl border border-border-default bg-surface-card px-4 py-5 text-center transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full",
                  c.tile,
                )}
                aria-hidden
              >
                <Icon className="size-5" />
              </span>
              <span className="mt-3 text-[13px] font-semibold text-ink">
                {c.title}
              </span>
              <span className="mt-1.5 text-[11px] leading-relaxed text-ink-tertiary">
                {c.blurb}
              </span>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand">
                {c.articleCount} articles
                <ChevronRight className="size-3" aria-hidden />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// Default view — popular articles + video guides
// ------------------------------------------------------------------

function ArticleRow({
  article,
  showCategory,
}: {
  article: HelpArticle;
  /** Results are mixed across topics, so they earn a category chip. */
  showCategory?: boolean;
}) {
  const Icon = article.icon;
  return (
    <Link
      href={articleHref(article.slug)}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-secondary"
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">
          {article.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-ink-tertiary">
          {article.blurb}
        </span>
      </span>
      {showCategory && (
        <span className="hidden shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-ink-tertiary sm:block">
          {CATEGORY_LABEL[article.category]}
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden />
    </Link>
  );
}

function PopularArticles() {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <h2 className="text-[15px] font-semibold text-ink">Popular Articles</h2>

      <div className="mt-3 space-y-0.5">
        {POPULAR_ARTICLES.map((a) => (
          <ArticleRow key={a.slug} article={a} />
        ))}
      </div>

      <Link
        href="/help/articles"
        className="mt-4 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-card text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        View All Help Articles
        <ChevronRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}

function VideoGuidesCard() {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">Video Guides</h2>
        <Link
          href="/help/videos"
          className="inline-flex items-center gap-1 text-[12px] font-medium text-brand transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:text-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          View All
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-3 space-y-0.5">
        {VIDEO_GUIDES.map((video) => (
          <Link
            key={video.id}
            href={video.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            {/* Thumbnail placeholder — a warm muted tile with a play chip and
                the runtime, so the row keeps its shape before real posters. */}
            <span
              className="relative flex h-12 w-20 shrink-0 items-center justify-center rounded-lg bg-surface-muted"
              aria-hidden
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-surface-card">
                <Play className="size-3 fill-ink text-ink" />
              </span>
              <span className="wz-font-mono absolute right-1 bottom-1 rounded bg-surface-inverse/85 px-1 text-[9px] text-ink-inverse">
                {video.duration}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">
                {video.title}
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-ink-tertiary">
                {video.blurb}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/help/videos"
        className="mt-4 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-card text-[12px] font-medium text-ink-secondary transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg hover:text-ink focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        More Video Guides
        <ChevronRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}

// ------------------------------------------------------------------
// Filtered view
// ------------------------------------------------------------------

function ResultsCard({
  results,
  onClear,
}: {
  results: HelpArticle[];
  onClear: () => void;
}) {
  return (
    <section className="rounded-xl border border-border-default bg-surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">
          {results.length} {results.length === 1 ? "article" : "articles"}
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg px-2 py-1 text-[12px] font-medium text-brand transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-hover-bg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
        >
          Clear filters
        </button>
      </div>

      {results.length === 0 ? (
        <p className="mt-6 pb-2 text-center text-[13px] text-ink-tertiary">
          Nothing matched that. Try a different term, or{" "}
          <Link
            href="/help/contact"
            className="font-medium text-brand underline underline-offset-2"
          >
            contact support
          </Link>
          .
        </p>
      ) : (
        <div className="mt-3 space-y-0.5">
          {results.map((a) => (
            <ArticleRow key={a.slug} article={a} showCategory />
          ))}
        </div>
      )}
    </section>
  );
}
