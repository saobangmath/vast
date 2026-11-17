import Link from "next/link";
import type { ArticleCard } from "@/lib/api";
import { PressSidebar } from "@/components/PressSidebar";
import { SciNews, type OfficialNews } from "@/components/SciNews";
import { IntlPapers, type IntlPaper } from "@/components/IntlPapers";

/** Official VAST content for the homepage, computed on the server from the crawled data. */
export type HomeData = {
  featured: { id: string; title: string; summary: string; dateLabel: string; sectionLabel: string } | null;
  /** Latest science & technology articles of the Academy (with images). */
  science: OfficialNews[];
};

type Props = { articles: ArticleCard[]; today: string; home: HomeData; intl?: { byTopic: Record<string, IntlPaper[]>; topics: string[]; total: number } };

function Banner({ featured }: { featured: HomeData["featured"] }) {
  return (
    <section className="banner" aria-label="Giới thiệu">
      <div className="wrap banner-grid">
        <div className="banner-copy">
          <span className="eyebrow">Cổng thông tin điện tử</span>
          <h2 className="banner-title">Khoa học và công nghệ phục vụ phát triển đất nước</h2>
          <p>
            Kết nối thông tin chính thống của Viện Hàn lâm Khoa học và Công nghệ Việt Nam với dòng tin khoa học -
            công nghệ cập nhật từ báo chí trong nước.
          </p>
          <div className="banner-actions">
            <Link className="cta" href="/tin-nong-khcn">
              Mở Tin nóng KHCN →
            </Link>
          </div>
        </div>
        {featured && (
          <article className="banner-card">
            <span className="tag">Tin nổi bật</span>
            <h3>{featured.title}</h3>
            <p>{featured.summary}</p>
            <Link href={`/bai-viet/${featured.id}`}>Đọc chi tiết →</Link>
            <div className="meta">
              {featured.dateLabel} · {featured.sectionLabel}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}

/** The (final) homepage: banner, Academy science news next to the latest press, info panels. */
export function HomeContent({ articles, today, home, intl }: Props) {
  return (
    <>
      <div className="ticker">
        <div className="wrap">
          <span className="tag">Thông báo</span>
          <span>
            Thông báo động đất và cảnh báo sóng thần: động đất độ lớn 3,5 tại xã Măng Bút, tỉnh Quảng Ngãi.
          </span>
          <span className="date">{today}</span>
        </div>
      </div>

      <Banner featured={home.featured} />

      <div className="wrap portal-main portal-main--head">
        <div className="sci-layout">
          <SciNews
            official={home.science}
            below={intl && intl.total > 0 ? <IntlPapers byTopic={intl.byTopic} topics={intl.topics} total={intl.total} /> : null}
          />
          <PressSidebar articles={articles} />
        </div>
      </div>
    </>
  );
}
