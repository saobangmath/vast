import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { fetchArticle, formatRelativeTime } from "@/lib/api";

type Props = { params: Promise<{ id: string }> };

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
    <article className="detail">
      <div className="story__meta">
        <span className={article.source.is_official ? "badge badge--official" : "badge"}>
          {article.source.name}
        </span>
        <time dateTime={article.published_at ?? undefined}>
          {formatRelativeTime(article.published_at)}
        </time>
        {article.related_count > 0 && (
          <span className="related">{article.related_count} liên quan</span>
        )}
      </div>
      <h1>{article.title}</h1>
      {article.topic && <span className="topic-chip">{article.topic.name}</span>}
      <p className="detail__summary">{article.summary || "Chưa có tóm tắt từ nguồn."}</p>
      <div className="detail__actions">
        <a
          className="btn btn--solid"
          href={article.canonical_url}
          target="_blank"
          rel="noreferrer"
        >
          Đọc gốc
        </a>
        <Link className="btn btn--outline" href="/tin-nong-khcn">
          Quay lại Tin nóng KHCN
        </Link>
      </div>

      {article.related_articles.length > 0 && (
        <section className="related-block">
          <h2>Tin liên quan</h2>
          {article.related_articles.map((related) => (
            <ArticleCard key={related.id} article={related} />
          ))}
        </section>
      )}
    </article>
  );
}
