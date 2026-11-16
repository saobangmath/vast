"use client";

import { useEffect, useMemo, useState } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import type { ArticleCard as ArticleCardType, Topic } from "@/lib/api";

type Tab = "hot" | "new";

type Props = {
  hot: ArticleCardType[];
  newer: ArticleCardType[];
  topics: Topic[];
  initialTab?: Tab;
  initialTopic?: string;
};

export function HubClient({ hot, newer, topics, initialTab = "hot", initialTopic }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [topic, setTopic] = useState<string | undefined>(initialTopic);

  const availableTopics = useMemo(() => {
    const pool = [...hot, ...newer];
    const used = new Set(pool.map((a) => a.topic?.slug).filter((slug): slug is string => Boolean(slug)));
    return topics.filter((t) => used.has(t.slug));
  }, [hot, newer, topics]);

  useEffect(() => {
    if (topic && !availableTopics.some((t) => t.slug === topic)) setTopic(undefined);
  }, [topic, availableTopics]);

  const items = useMemo(() => {
    const base = tab === "hot" ? hot : newer;
    return topic ? base.filter((a) => a.topic?.slug === topic) : base;
  }, [hot, newer, tab, topic]);

  return (
    <div className="hub">
      <div className="hub-bar">
        <div className="seg2" role="tablist" aria-label="Luồng tin">
          <button type="button" role="tab" aria-selected={tab === "hot"} onClick={() => setTab("hot")}>
            Nóng
          </button>
          <button type="button" role="tab" aria-selected={tab === "new"} onClick={() => setTab("new")}>
            Mới
          </button>
        </div>
        {availableTopics.length > 0 && (
          <div className="chips filters hub-topics">
            <button type="button" className={`pill ${!topic ? "on" : ""}`} onClick={() => setTopic(undefined)}>
              Tất cả
            </button>
            {availableTopics.map((t) => (
              <button
                key={t.slug}
                type="button"
                className={`pill ${topic === t.slug ? "on" : ""}`}
                onClick={() => setTopic(t.slug)}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <div className="news-list">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-ico" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M4 5h16v14H4zM8 9h8M8 13h5" />
            </svg>
          </div>
          <h2>Chưa có tin để hiển thị</h2>
          <p>Nguồn tổng hợp tin chưa phản hồi hoặc chưa có bài phù hợp. Vui lòng thử lại sau.</p>
        </div>
      )}

      <p className="note">
        Mỗi bài hiển thị tóm tắt trên cổng VAST. Bấm &ldquo;Đọc tại nguồn&rdquo; để đọc đầy đủ trên trang của cơ quan
        báo chí.
      </p>
    </div>
  );
}
