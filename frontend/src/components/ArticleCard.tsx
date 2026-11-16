"use client";

import Link from "next/link";
import type { ArticleCard as ArticleCardType } from "@/lib/api";
import { formatRelativeTime, sourceHue } from "@/lib/api";

/** Aggregated press article: summary on the portal, original article one click away. */
export function ArticleCard({ article }: { article: ArticleCardType }) {
  const detail = `/tin-nong-khcn/${article.id}`;
  return (
    <article className="nrow nrow--press">
      <Link href={detail} className="nrow-media" tabIndex={-1} aria-hidden>
        {article.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => e.currentTarget.remove()}
          />
        ) : (
          <div className="nrow-ph" />
        )}
      </Link>
      <div>
        <div className="press-meta">
          <span className="src-badge">
            <i style={{ background: `hsl(${sourceHue(article.source.key)} 62% 42%)` }} aria-hidden />
            {article.source.name}
          </span>
          <time dateTime={article.published_at ?? undefined}>{formatRelativeTime(article.published_at)}</time>
          {article.related_count > 0 && <span className="related-pill">{article.related_count} bài liên quan</span>}
        </div>
        <h2>
          <Link href={detail}>{article.title}</Link>
        </h2>
        {article.summary && <p>{article.summary}</p>}
        <div className="press-actions">
          {article.topic && <span className="pill pill--static">{article.topic.name}</span>}
          <a className="ext-link" href={article.canonical_url} target="_blank" rel="noopener noreferrer">
            Đọc tại nguồn
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
