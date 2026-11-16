import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchArticle, formatRelativeTime, sourceHue } from "@/lib/api";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const a = await fetchArticle(Number(id));
    return { title: `${a.title} | VAST`, description: a.summary };
  } catch {
    return { title: "Tin nóng KHCN | VAST" };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isFinite(articleId)) notFound();

  let article;
  try {
    article = await fetchArticle(articleId);
  } catch {
    notFound();
  }

  return (
    <div className="wrap portal-main page-top">
      <nav className="crumbs" aria-label="Đường dẫn">
        <Link href="/">Trang chủ</Link> / <Link href="/tin-nong-khcn">Tin nóng KHCN</Link>
      </nav>

      <div className="article-layout">
        <article>
          <div className="press-meta">
            <span className="src-badge">
              <i style={{ background: `hsl(${sourceHue(article.source.key)} 62% 42%)` }} aria-hidden />
              {article.source.name}
            </span>
            <time dateTime={article.published_at ?? undefined}>{formatRelativeTime(article.published_at)}</time>
            {article.related_count > 0 && <span className="related-pill">{article.related_count} bài liên quan</span>}
          </div>
          <h1 className="article-title">{article.title}</h1>
          {article.topic && <span className="pill pill--static">{article.topic.name}</span>}
          <p className="article-lead">{article.summary || "Chưa có tóm tắt từ nguồn."}</p>

          <div className="detail-actions">
            <a className="cta cta--navy" href={article.canonical_url} target="_blank" rel="noopener noreferrer">
              Đọc bài gốc tại {article.source.name} ↗
            </a>
            <Link className="cta cta--line" href="/tin-nong-khcn">
              ← Quay lại Tin nóng KHCN
            </Link>
          </div>
          <p className="note">
            Đây là tóm tắt do cổng VAST tổng hợp tự động. Nội dung đầy đủ thuộc quyền của {article.source.name}.
          </p>
        </article>

        {article.related_articles.length > 0 && (
          <aside className="panel">
            <h3>Tin liên quan</h3>
            <ul className="list">
              {article.related_articles.map((r) => (
                <li key={r.id}>
                  <a href={r.canonical_url} target="_blank" rel="noopener noreferrer">
                    {r.title}
                  </a>
                  <span className="meta">
                    {r.source.name} · {formatRelativeTime(r.published_at)}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
