"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ArticleCard } from "@/lib/api";
import { PressSection } from "@/components/PressSection";
import {
  ACTIVITY_NEWS,
  FEATURED,
  PARTNER_LINKS,
  SCIENCE_CARDS,
  SERVICES,
} from "@/lib/vast-content";

const VAST = "https://vast.gov.vn/";

const TABS = [
  { id: 1, label: "Trang Chủ 1", hint: "Báo chí ở cuối trang (hiện tại)" },
  { id: 2, label: "Trang Chủ 2", hint: "Báo chí cột phải" },
  { id: 3, label: "Trang Chủ 3", hint: "Báo chí đầu trang (kiểu Báo Mới)" },
] as const;

type Props = { articles: ArticleCard[]; today: string };

function Banner() {
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
            <a className="cta cta--ghost" href={VAST} target="_blank" rel="noopener noreferrer">
              vast.gov.vn
            </a>
          </div>
        </div>
        <article className="banner-card">
          <span className="tag">{FEATURED.tag}</span>
          <h3>{FEATURED.title}</h3>
          <p>{FEATURED.summary}</p>
          <a href={FEATURED.href} target="_blank" rel="noopener noreferrer">
            Đọc chi tiết →
          </a>
          <div className="meta">
            {FEATURED.date} · {FEATURED.section}
          </div>
        </article>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section className="services" aria-label="Hệ thống nội bộ">
      {SERVICES.map((s) => (
        <a key={s.code} className="svc" href={VAST} target="_blank" rel="noopener noreferrer">
          <div className="ico">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d={s.icon} />
            </svg>
          </div>
          <b>{s.name}</b>
          <span>{s.code}</span>
        </a>
      ))}
    </section>
  );
}

function ScienceCards() {
  return (
    <section>
      <div className="sec-head">
        <h2 className="sec-h">Tin khoa học - Công nghệ</h2>
        <a href={VAST} target="_blank" rel="noopener noreferrer">
          Xem tất cả →
        </a>
      </div>
      <div className="cards">
        {SCIENCE_CARDS.map((c) => (
          <article key={c.title} className="card">
            <div className="thumb" style={{ "--c1": c.c1, "--c2": c.c2 } as React.CSSProperties} />
            <div className="card-in">
              <span className="cat">{c.cat}</span>
              <h4>
                <a href={VAST} target="_blank" rel="noopener noreferrer">
                  {c.title}
                </a>
              </h4>
              <span className="meta">{c.meta}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AsidePanels() {
  return (
    <aside className="stack">
      <div className="panel alert">
        <h3>Cảnh báo</h3>
        <b>Động đất độ lớn 3,5</b>
        <p style={{ margin: "4px 0 0" }}>Xã Măng Bút, tỉnh Quảng Ngãi · 26/10/2026</p>
      </div>
      <div className="panel">
        <h3>Tin tức hoạt động</h3>
        <ul className="list">
          {ACTIVITY_NEWS.map((t) => (
            <li key={t}>
              <a href={VAST} target="_blank" rel="noopener noreferrer">
                {t}
              </a>
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

export function HomeVariants({ articles, today }: Props) {
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

      <Banner />

      <div className="wrap portal-main">
        {variant === 3 && (
          <PressSection articles={articles} layout="hot" className="press--hot" id="press-h-v3" />
        )}

        <Services />

        {variant === 1 && (
          <>
            <div className="cols">
              <ScienceCards />
              <AsidePanels />
            </div>
            <PressSection articles={articles} layout="grid" />
          </>
        )}

        {variant === 2 && (
          <div className="cols cols--press-right">
            <div className="stack">
              <ScienceCards />
              <AsidePanels />
            </div>
            <PressSection articles={articles} layout="rail" className="press--rail" id="press-h-v2" />
          </div>
        )}

        {variant === 3 && (
          <div className="cols">
            <ScienceCards />
            <AsidePanels />
          </div>
        )}

        <PartnerLinks />
      </div>
    </>
  );
}
