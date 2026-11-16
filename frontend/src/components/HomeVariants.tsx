"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ArticleCard } from "@/lib/api";
import { PressSection } from "@/components/PressSection";
import { PressSidebar } from "@/components/PressSidebar";
import { SciNews, type OfficialNews } from "@/components/SciNews";
import { PARTNER_LINKS } from "@/lib/vast-content";

const VAST = "https://vast.gov.vn/";

const TABS = [
  { id: 1, label: "Trang Chủ 1", hint: "Tin của Viện + cột báo chí mới nhất" },
  { id: 2, label: "Trang Chủ 2", hint: "Báo chí đầu trang (kiểu Báo Mới)" },
  { id: 3, label: "Trang Chủ 3", hint: "Như Trang Chủ 2 nhưng không có banner đầu trang" },
] as const;

/** Official VAST content for the homepage, computed on the server from the crawled data. */
export type HomeData = {
  featured: { id: string; title: string; summary: string; dateLabel: string; sectionLabel: string } | null;
  /** Latest science & technology articles of the Academy (with images). */
  science: OfficialNews[];
  /** Latest activity headlines. */
  activity: { id: string; title: string }[];
};

type Props = { articles: ArticleCard[]; today: string; home: HomeData };

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

function ScienceCards({ items }: { items: OfficialNews[] }) {
  return (
    <section>
      <div className="sec-head">
        <h2 className="sec-h">Tin khoa học - Công nghệ</h2>
        <Link href="/tin-tuc/khcn-trong-nuoc">Xem tất cả →</Link>
      </div>
      <div className="cards">
        {items.slice(0, 4).map((c) => (
          <article key={c.id} className="card">
            {c.image ? (
              <Image className="card-img" src={c.image} alt="" width={640} height={320} sizes="(max-width: 640px) 100vw, 380px" />
            ) : (
              <div className="thumb" style={{ "--c1": "#123e6b", "--c2": "#0a2340" } as React.CSSProperties} />
            )}
            <div className="card-in">
              <span className="cat">{c.sectionLabel}</span>
              <h4>
                <Link href={`/bai-viet/${c.id}`}>{c.title}</Link>
              </h4>
              <span className="meta">{c.dateLabel}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function InfoPanels() {
  return (
    <>
      <div className="panel alert">
        <h3>Cảnh báo</h3>
        <b>Động đất độ lớn 3,5</b>
        <p style={{ margin: "4px 0 0" }}>Xã Măng Bút, tỉnh Quảng Ngãi · 26/10/2026</p>
      </div>
      <div className="panel">
        <h3>Đề tài nổi bật</h3>
        <ul className="list">
          <li>
            <a href={VAST} target="_blank" rel="noopener noreferrer">
              Nghiên cứu đa dạng sinh học khu hệ cá ở Bến Tre
            </a>
          </li>
          <li>
            <a href={VAST} target="_blank" rel="noopener noreferrer">
              An toàn thực phẩm và giảm ô nhiễm nuôi thủy sản ở Quảng Ninh
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}

function AsidePanels({ activity }: { activity: HomeData["activity"] }) {
  return (
    <aside className="stack">
      <div className="panel alert">
        <h3>Cảnh báo</h3>
        <b>Động đất độ lớn 3,5</b>
        <p style={{ margin: "4px 0 0" }}>Xã Măng Bút, tỉnh Quảng Ngãi · 26/10/2026</p>
      </div>
      <div className="panel">
        <h3>
          <Link href="/tin-tuc/hoat-dong">Tin tức hoạt động</Link>
        </h3>
        <ul className="list">
          {activity.map((n) => (
            <li key={n.id}>
              <Link href={`/bai-viet/${n.id}`}>{n.title}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h3>Đề tài nổi bật</h3>
        <ul className="list">
          <li>
            <a href={VAST} target="_blank" rel="noopener noreferrer">
              Nghiên cứu đa dạng sinh học khu hệ cá ở Bến Tre
            </a>
          </li>
          <li>
            <a href={VAST} target="_blank" rel="noopener noreferrer">
              An toàn thực phẩm và giảm ô nhiễm nuôi thủy sản ở Quảng Ninh
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
}

function PartnerLinks() {
  return (
    <section className="links-row">
      <h2 className="sec-h">Liên kết &amp; đào tạo</h2>
      <div className="chips">
        {PARTNER_LINKS.map((p) => (
          <a key={p} className="chip" href={VAST} target="_blank" rel="noopener noreferrer">
            {p}
          </a>
        ))}
      </div>
    </section>
  );
}

export function HomeVariants({ articles, today, home }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const raw = Number(params.get("v") ?? "1");
  const variant = raw === 2 || raw === 3 ? raw : 1;

  function setVariant(id: number) {
    const next = new URLSearchParams(params.toString());
    if (id === 1) next.delete("v");
    else next.set("v", String(id));
    const q = next.toString();
    router.replace(q ? `/?${q}` : "/", { scroll: false });
  }

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

      <div className="layout-tabs" role="tablist" aria-label="Phiên bản Trang chủ">
        <div className="wrap layout-tabs-inner">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={variant === t.id}
              title={t.hint}
              onClick={() => setVariant(t.id)}
            >
              {t.label}
            </button>
          ))}
          <span className="layout-tabs-hint">{TABS.find((t) => t.id === variant)?.hint}</span>
        </div>
      </div>

      {variant !== 3 && <Banner featured={home.featured} />}

      <div className={variant === 3 ? "wrap portal-main portal-main--nobanner" : "wrap portal-main"}>
        {variant === 1 && (
          <>
            <div className="sci-layout">
              <SciNews official={home.science} />
              <PressSidebar articles={articles} />
            </div>
            <div className="info-row">
              <InfoPanels />
            </div>
          </>
        )}

        {variant !== 1 && (
          <>
            <PressSection articles={articles} layout="hot" className="press--hot" id="press-h-v3" />
            <div className="cols">
              <ScienceCards items={home.science} />
              <AsidePanels activity={home.activity} />
            </div>
          </>
        )}

        <PartnerLinks />
      </div>
    </>
  );
}
