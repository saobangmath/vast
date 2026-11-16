import Link from "next/link";
import type { ArticleCard } from "@/lib/api";
import { formatRelativeTime, sourceHue } from "@/lib/api";

const ExtIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

/** Latest press links: every row opens the original article on the publisher's own site. */
export function PressSidebar({ articles }: { articles: ArticleCard[] }) {
  const items = [...articles]
    .sort((a, b) => +new Date(b.published_at ?? 0) - +new Date(a.published_at ?? 0))
    .slice(0, 8);

  return (
    <aside className="latest" aria-labelledby="latest-h">
      <div className="latest-head">
        <h3 id="latest-h">
          <span className="live" aria-hidden />
          Tin mới nhất từ báo chí
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="meta" style={{ padding: "0 20px 20px" }}>
          Chưa tải được tin mới. Thử lại sau.
        </p>
      ) : (
        <ol className="latest-list">
          {items.map((a) => (
            <li key={a.id}>
              <a href={a.canonical_url} target="_blank" rel="noopener noreferrer" className="latest-item">
                <span className="latest-title">{a.title}</span>
                <span className="latest-meta">
                  <span className="latest-src">
                    <i style={{ background: `hsl(${sourceHue(a.source.key)} 62% 42%)` }} aria-hidden />
                    {a.source.name}
                  </span>
                  <span>{formatRelativeTime(a.published_at)}</span>
                  {a.related_count > 0 && <span>{a.related_count} liên quan</span>}
                  <ExtIcon />
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}

      <div className="latest-foot">
        <Link href="/tin-nong-khcn">Xem thêm Tin nóng KHCN →</Link>
      </div>
    </aside>
  );
}
