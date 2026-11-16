"use client";

import Link from "next/link";
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
    const used = new Set(
      pool.map((a) => a.topic?.slug).filter((slug): slug is string => Boolean(slug)),
    );
    return topics.filter((t) => used.has(t.slug));
  }, [hot, newer, topics]);

  useEffect(() => {
    if (topic && !availableTopics.some((t) => t.slug === topic)) {
      setTopic(undefined);
    }
  }, [topic, availableTopics]);

  const items = useMemo(() => {
    const base = tab === "hot" ? hot : newer;
    if (!topic) return base;
    return base.filter((a) => a.topic?.slug === topic);
  }, [hot, newer, tab, topic]);

  return (
    <div className="hub">
      <div className="hub__toolbar">
        <div className="tabs" role="tablist" aria-label="Luồng tin">
          <button
            type="button"
            className={tab === "hot" ? "tab tab--active" : "tab"}
            onClick={() => setTab("hot")}
          >
            Nóng
          </button>
          <button
            type="button"
            className={tab === "new" ? "tab tab--active" : "tab"}
            onClick={() => setTab("new")}
          >
            Mới
          </button>
        </div>
        {availableTopics.length > 0 && (
          <div className="topic-row">
            <button
              type="button"
              className={!topic ? "topic-chip topic-chip--active" : "topic-chip"}
              onClick={() => setTopic(undefined)}
            >
              Tất cả
            </button>
            {availableTopics.map((t) => (
              <button
                key={t.slug}
                type="button"
                className={topic === t.slug ? "topic-chip topic-chip--active" : "topic-chip"}
                onClick={() => setTopic(t.slug)}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="story-list">
          {items.map((article, idx) => (
            <ArticleCard key={article.id} article={article} featured={idx === 0 && tab === "hot"} />
          ))}
        </div>
      )}

      <p className="hub__note">
        Mỗi bài hiển thị tóm tắt trên cổng VAST. Đọc đầy đủ tại nguồn gốc qua nút{" "}
        <Link href="/tin-nong-khcn">Đọc gốc</Link> trên trang chi tiết.
      </p>
    </div>
  );
}
