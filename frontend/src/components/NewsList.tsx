import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { formatDate, groupSections, listNews, sectionName, type Group } from "@/lib/content";

type Props = { group: Group; section: string; page: number; intro?: React.ReactNode; blurb?: string };

/** Paginated list of official VAST articles for one menu group, with section tabs. */
export function NewsList({ group, section, page, intro, blurb }: Props) {
  const tabs = groupSections(group);
  const { items, total, pages, page: cur } = listNews(group, section, page);
  const base = section === "all" ? group.base : `${group.base}/${section}`;
  const href = (p: number) => (p === 1 ? base : `${base}?page=${p}`);
  const title = section === "all" ? group.name : sectionName(section);

  // compact page window: 1 … cur-2..cur+2 … last
  const nums = [...new Set([1, cur - 2, cur - 1, cur, cur + 1, cur + 2, pages])].filter((n) => n >= 1 && n <= pages);

  return (
    <>
      <PageHero
        eyebrow={section === "all" ? undefined : group.name}
        title={title}
        subtitle={blurb ?? `${total.toLocaleString("vi-VN")} bài viết`}
        crumbs={[{ label: group.name, href: section === "all" ? undefined : group.base }, ...(section === "all" ? [] : [{ label: title }])]}
      />
      <div className="wrap portal-main page-body">
        {intro}
        {tabs.length > 1 && (
          <div className="chips filters" aria-label="Chuyên mục">
            <Link className={`pill ${section === "all" ? "on" : ""}`} href={group.base}>
              Tất cả
            </Link>
            {tabs.map((s) => (
              <Link key={s.key} className={`pill ${section === s.key ? "on" : ""}`} href={`${group.base}/${s.key}`}>
                {s.name}
              </Link>
            ))}
          </div>
        )}

        <div className="news-list">
          {items.map((a) => (
            <Link key={a.id} href={`/bai-viet/${a.id}`} className="nrow">
              {a.image ? (
                <Image src={a.image} alt="" width={440} height={275} sizes="(max-width: 640px) 100vw, 220px" />
              ) : (
                <div className="nrow-ph" aria-hidden />
              )}
              <div>
                <span className="cat">{sectionName(a.section)}</span>
                <h2>{a.title}</h2>
                <p>{a.summary}</p>
                <span className="meta">{formatDate(a.date)}</span>
              </div>
            </Link>
          ))}
          {items.length === 0 && <p className="meta">Chưa có bài viết.</p>}
        </div>

        {pages > 1 && (
          <nav className="pager" aria-label="Phân trang">
            {cur > 1 && <Link href={href(cur - 1)}>‹ Trước</Link>}
            {nums.map((n, i) => (
              <span key={n}>
                {i > 0 && n - nums[i - 1] > 1 && <span className="gap">…</span>}
                <Link href={href(n)} className={n === cur ? "on" : undefined} aria-current={n === cur ? "page" : undefined}>
                  {n}
                </Link>
              </span>
            ))}
            {cur < pages && <Link href={href(cur + 1)}>Sau ›</Link>}
          </nav>
        )}
      </div>
    </>
  );
}
