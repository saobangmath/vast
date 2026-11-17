"use client";

import Link from "next/link";
import { useState } from "react";

export type IntlPaper = {
  id: string;
  title: string;
  authors: string;
  url: string;
  label: string; // e.g. "ICLR'25"
  tier: "Q1" | "A*";
};

type Props = { byTopic: Record<string, IntlPaper[]>; topics: string[]; total: number };

/** "Bài báo quốc tế": latest papers of Q1 journals / A* conferences, filtered by topic. */
export function IntlPapers({ byTopic, topics }: Props) {
  const [topic, setTopic] = useState("");
  const items = byTopic[topic] ?? byTopic[""] ?? [];

  return (
    <section className="intl" aria-labelledby="intl-h">
      <div className="intl-head">
        <div>
          <h3 id="intl-h">Bài báo quốc tế</h3>
          <p>Công bố mới từ các tạp chí Q1 và hội nghị A* hàng đầu thế giới.</p>
        </div>
        <Link className="sci-all" href={topic ? `/cong-bo-khoa-hoc?linhvuc=${encodeURIComponent(topic)}` : "/cong-bo-khoa-hoc"}>
          Xem thêm →
        </Link>
      </div>

      <div className="chips filters intl-chips" role="tablist" aria-label="Lĩnh vực">
        {["", ...topics.slice(0, 6)].map((t) => (
          <button
            key={t || "all"}
            type="button"
            role="tab"
            aria-selected={topic === t}
            className={`pill ${topic === t ? "on" : ""}`}
            onClick={() => setTopic(t)}
          >
            {t || "Tất cả"}
          </button>
        ))}
      </div>

      <ul className="intl-list">
        {items.map((p) => (
          <li key={p.id}>
            <a className="intl-item" href={p.url} target="_blank" rel="noopener noreferrer">
              <span className={`tier tier--venue ${p.tier === "A*" ? "tier--astar" : "tier--q1"}`}>{p.label}</span>
              <span className="intl-main">
                <span className="intl-title">{p.title}</span>
                {p.authors && (
                  <span className="intl-meta">
                    {p.authors.split(", ").slice(0, 3).join(", ")}
                    {p.authors.split(", ").length > 3 ? " …" : ""}
                  </span>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
