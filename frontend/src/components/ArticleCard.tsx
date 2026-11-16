import Link from "next/link";
import type { ArticleCard as ArticleCardType } from "@/lib/api";
import { formatRelativeTime } from "@/lib/api";

type Props = {
  article: ArticleCardType;
  featured?: boolean;
};

export function ArticleCard({ article, featured = false }: Props) {
  return (
    <article className={`story ${featured ? "story--featured" : ""}`}>
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
      <h3 className="story__title">
        <Link href={`/tin-nong-khcn/${article.id}`}>{article.title}</Link>
      </h3>
      {article.summary && <p className="story__summary">{article.summary}</p>}
      {article.topic && <span className="topic-chip">{article.topic.name}</span>}
    </article>
  );
}
