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

export type PressLayout = "grid" | "rail" | "hot";

type Props = { articles: ArticleCard[]; layout?: PressLayout };

/** Aggregated press feed: every card links out to the original publisher's article. */
export function PressFeed({ articles, layout = "grid" }: Props) {
  const [cur, setCur] = useState("all");

  const sources = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of articles) if (!seen.has(a.source.key)) seen.set(a.source.key, a.source.name);
    return [...seen].map(([key, name]) => ({ key, name }));
  }, [articles]);

  const items = useMemo(() => {
    if (cur !== "all") return articles.filter((a) => a.source.key === cur).slice(0, layout === "rail" ? 8 : 12);
    const by = new Map<string, ArticleCard[]>();
    for (const a of articles) by.set(a.source.key, [...(by.get(a.source.key) ?? []), a]);
    const out: ArticleCard[] = [];
    for (let k = 0; k < 2; k++)
      for (const s of sources) {
        const a = by.get(s.key)?.[k];
        if (a) out.push(a);
      }
    const sorted = out.sort((a, b) => +new Date(b.published_at ?? 0) - +new Date(a.published_at ?? 0));
    if (layout === "rail") return sorted.slice(0, 8);
    if (layout === "hot") return sorted.slice(0, 10);
    return sorted.slice(0, 12);
  }, [articles, cur, sources, layout]);

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

  const filters = (
    <div className="chips filters" role="tablist" aria-label="Lọc theo nguồn báo">
      {[{ key: "all", name: "Tất cả" }, ...sources].map((s) => (
        <button key={s.key} role="tab" aria-selected={cur === s.key} onClick={() => setCur(s.key)}>
          {s.name}
        </button>
      ))}
    </div>
  );

  if (layout === "hot") {
    const [lead, ...rest] = items;
    return (
      <>
        {filters}
        <div className="hot-feed">
          {lead && (
            <a className="hot-lead" href={lead.canonical_url} target="_blank" rel="noopener noreferrer">
              {lead.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lead.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" />
              )}
              <div className="hot-lead-body">
                <span className="src">
                  {lead.source.name}
                  <ExtIcon />
                </span>
                <h3 className="hot-lead-title">{lead.title}</h3>
                {lead.summary && <p className="hot-lead-sum">{lead.summary}</p>}
                <span className="meta">
                  {formatRelativeTime(lead.published_at)}
                  {lead.related_count > 0 && ` · ${lead.related_count} bài liên quan`}
                </span>
              </div>
            </a>
          )}
          <ul className="hot-list">
            {rest.map((a) => (
              <li key={a.id}>
                <a href={a.canonical_url} target="_blank" rel="noopener noreferrer">
                  <span className="src">
                    {a.source.name}
                    <ExtIcon />
                  </span>
                  <span className="hot-list-t">{a.title}</span>
                  <span className="meta">
                    {formatRelativeTime(a.published_at)}
                    {a.related_count > 0 && ` · ${a.related_count} liên quan`}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  }

  if (layout === "rail") {
    return (
      <>
        {filters}
        <div className="news-rail">
          {items.map((a) => (
            <a key={a.id} className="nitem nitem--rail" href={a.canonical_url} target="_blank" rel="noopener noreferrer">
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

  return (
    <>
      {filters}
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
