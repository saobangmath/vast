"use client";

import { useState } from "react";
import type { ArticleCard as ArticleCardType } from "@/lib/api";
import { formatRelativeTime, sourceHue } from "@/lib/api";

/** Aggregated press article: summary on the portal, original article one click away. */
export function ArticleCard({ article }: { article: ArticleCardType }) {
  const [broken, setBroken] = useState(false); // image URL failed to load -> show the placeholder
  // Every link goes straight to the publisher's article (new tab), not to an internal summary page.
  const source = { href: article.canonical_url, target: "_blank", rel: "noopener noreferrer" } as const;
  return (
    <article className="nrow nrow--press">
      <a {...source} className="nrow-media" tabIndex={-1} aria-hidden>
        {article.image_url && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="nrow-ph" />
        )}
      </a>
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
          <a {...source}>{article.title}</a>
        </h2>
        {article.summary && <p>{article.summary}</p>}
        {article.topic && (
          <div className="press-actions">
            <span className="pill pill--static">{article.topic.name}</span>
          </div>
        )}
      </div>
    </article>
  );
}
