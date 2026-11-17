import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { paperLabel, queryPapers } from "@/lib/papers";

export const metadata: Metadata = { title: "Công bố khoa học thế giới | VAST" };
export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string; loai?: string; venue?: string; linhvuc?: string; nam?: string; trang?: string }>;

const MONTH = (m: number) => `Tháng ${m}`;

export default async function PapersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const kind = sp.loai === "journal" || sp.loai === "conference" ? sp.loai : "";
  const venue = sp.venue || "";
  const domain = sp.linhvuc || "";
  const q = sp.q || "";
  const year = Number(sp.nam) || 0;
  const r = queryPapers({ q, kind, venue, domain, year, page: Number(sp.trang) || 1 });

  const href = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const cur: Record<string, string | number | undefined> = { q, loai: kind, venue, linhvuc: domain, nam: year, trang: 1, ...over };
    for (const [k, v] of Object.entries(cur)) if (v && !(k === "trang" && v === 1)) p.set(k, String(v));
    const s = p.toString();
    return `/cong-bo-khoa-hoc${s ? `?${s}` : ""}`;
  };

  const domains = Object.entries(r.domainCounts).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHero
        eyebrow="Khoa học thế giới"
        title="Công bố khoa học thế giới"
        subtitle="Danh sách bài báo từ các tạp chí Q1 và hội nghị A* hàng đầu, lấy từ nguồn chính thức của từng tạp chí / hội nghị. Bấm vào bài để đọc tại nguồn."
        crumbs={[{ label: "Tin tức - Sự kiện", href: "/tin-tuc" }, { label: "Công bố khoa học thế giới" }]}
      />
      <div className="wrap portal-main page-body">
        <form className="pubs-search" action="/cong-bo-khoa-hoc" method="get">
          <input name="q" defaultValue={q} placeholder="Tìm theo tiêu đề hoặc tác giả…" aria-label="Tìm kiếm" />
          {kind && <input type="hidden" name="loai" value={kind} />}
          {venue && <input type="hidden" name="venue" value={venue} />}
          {domain && <input type="hidden" name="linhvuc" value={domain} />}
          {year > 0 && <input type="hidden" name="nam" value={year} />}
          <button type="submit" className="cta">Tìm</button>
        </form>

        <div className="pubs-filters">
          <div className="chips filters" aria-label="Năm">
            <Link className={`pill ${!year ? "on" : ""}`} href={href({ nam: "" })}>Mọi năm</Link>
            {Object.entries(r.yearCounts)
              .sort((a, b) => Number(b[0]) - Number(a[0]))
              .map(([y, n]) => (
                <Link key={y} className={`pill ${year === Number(y) ? "on" : ""}`} href={href({ nam: year === Number(y) ? "" : y })}>
                  {y} <span className="pill-n">{n.toLocaleString("vi-VN")}</span>
                </Link>
              ))}
          </div>
          <div className="chips filters" aria-label="Lĩnh vực">
            <Link className={`pill ${!domain ? "on" : ""}`} href={href({ linhvuc: "" })}>Mọi lĩnh vực</Link>
            {domains.map(([d, n]) => (
              <Link key={d} className={`pill ${domain === d ? "on" : ""}`} href={href({ linhvuc: domain === d ? "" : d })}>
                {d} <span className="pill-n">{n.toLocaleString("vi-VN")}</span>
              </Link>
            ))}
          </div>
        </div>

        <p className="pubs-count">
          <b>{r.total.toLocaleString("vi-VN")}</b> công bố{r.total !== r.all ? ` (trên tổng ${r.all.toLocaleString("vi-VN")})` : ""} · Cập nhật {r.generated}
        </p>

        <ul className="pubs-list">
          {r.rows.map((p) => (
            <li key={p.id}>
              <a className="pub" href={p.url} target="_blank" rel="noopener noreferrer">
                <span className={`tier tier--venue ${p.venueInfo.tier === "A*" ? "tier--astar" : "tier--q1"}`}>{paperLabel(p, p.venueInfo)}</span>
                <span className="pub-main">
                  <span className="pub-title">{p.title}</span>
                  {p.authors && <span className="pub-auth">{p.authors}</span>}
                  <span className="pub-meta">
                    <i>{p.venueInfo.full}</i> · {MONTH(p.month)}/{p.year} · <span className="dtag">{p.domain}</span>
                  </span>
                </span>
              </a>
            </li>
          ))}
          {r.rows.length === 0 && <li className="pubs-empty">Không có công bố nào khớp bộ lọc.</li>}
        </ul>

        {r.pages > 1 && (
          <nav className="pubs-pager" aria-label="Phân trang">
            {r.page > 1 && <Link className="pill" href={href({ trang: r.page - 1 })}>← Trước</Link>}
            <span>Trang {r.page} / {r.pages.toLocaleString("vi-VN")}</span>
            {r.page < r.pages && <Link className="pill" href={href({ trang: r.page + 1 })}>Sau →</Link>}
          </nav>
        )}
      </div>
    </>
  );
}
