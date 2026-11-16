"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ArticleCard } from "@/lib/api";
import { formatRelativeTime } from "@/lib/api";

const ExtIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

type Props = { articles: ArticleCard[] };

/** Aggregated press feed: every card links out to the original publisher's article. */
export function PressFeed({ articles }: Props) {
  const [cur, setCur] = useState("all");

  const sources = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of articles) if (!seen.has(a.source.key)) seen.set(a.source.key, a.source.name);
    return [...seen].map(([key, name]) => ({ key, name }));
  }, [articles]);

  const items = useMemo(() => {
    if (cur !== "all") return articles.filter((a) => a.source.key === cur).slice(0, 9);
    // "All": interleave sources (two newest per source) so one outlet can't dominate.
    const by = new Map<string, ArticleCard[]>();
    for (const a of articles) by.set(a.source.key, [...(by.get(a.source.key) ?? []), a]);
    const out: ArticleCard[] = [];
    for (let k = 0; k < 2; k++) for (const s of sources) {
      const a = by.get(s.key)?.[k];
      if (a) out.push(a);
    }
    return out.sort((a, b) => +new Date(b.published_at ?? 0) - +new Date(a.published_at ?? 0)).slice(0, 12);
  }, [articles, cur, sources]);

  if (articles.length === 0) {
    return (
      <p className="meta">
        Chưa tải được tin tổng hợp. Mở{" "}
        <Link href="/tin-nong-khcn" style={{ textDecoration: "underline" }}>
          Tin nóng KHCN
        </Link>{" "}
        hoặc thử lại sau.
      </p>
    );
  }

  return (
    <>
      <div className="chips filters" role="tablist" aria-label="Lọc theo nguồn báo">
        {[{ key: "all", name: "Tất cả" }, ...sources].map((s) => (
          <button key={s.key} role="tab" aria-selected={cur === s.key} onClick={() => setCur(s.key)}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="news-grid">
        {items.map((a) => (
          <a key={a.id} className="nitem" href={a.canonical_url} target="_blank" rel="noopener noreferrer">
            {a.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" />
            )}
            <div>
              <span className="src">
                {a.source.name}
                <ExtIcon />
              </span>
              <div className="t">{a.title}</div>
              <span className="meta">
                {formatRelativeTime(a.published_at)}
                {a.related_count > 0 && ` · ${a.related_count} bài liên quan`}
              </span>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
