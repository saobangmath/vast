import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getArticle, getIndex, groupOfSection, sectionName } from "@/lib/content";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = getArticle((await params).id);
  return { title: a ? `${a.title} | VAST` : "Không tìm thấy | VAST", description: a?.description };
}

export default async function ArticlePage({ params }: Props) {
  const a = getArticle((await params).id);
  if (!a) notFound();
  const group = groupOfSection(a.section);
  const related = getIndex()
    .items.filter((i) => i.section === a.section && i.id !== a.id)
    .slice(0, 5);

  return (
    <div className="wrap portal-main page-top">
      <nav className="crumbs" aria-label="Đường dẫn">
        <Link href="/">Trang chủ</Link> / <Link href={group?.base ?? "/tin-tuc"}>{group?.name ?? "Tin tức"}</Link> /{" "}
        <Link href={`${group?.base ?? "/tin-tuc"}/${a.section}`}>{sectionName(a.section)}</Link>
      </nav>
      <div className="article-layout">
        <article>
          <span className="cat">{sectionName(a.section)}</span>
          <h1 className="article-title">{a.title}</h1>
          <div className="meta">{formatDate(a.date)}</div>
          {a.description && <p className="article-lead">{a.description}</p>}
          <div className="prose" dangerouslySetInnerHTML={{ __html: a.html }} />
          <p className="note">
            Nguồn:{" "}
            <a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
              vast.gov.vn
            </a>
          </p>
        </article>
        <aside className="panel">
          <h3>Tin cùng chuyên mục</h3>
          <ul className="list">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/bai-viet/${r.id}`}>{r.title}</Link>
                <span className="meta">{formatDate(r.date)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
