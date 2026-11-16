import Link from "next/link";
import { PressFeed } from "@/components/PressFeed";
import { fetchNew } from "@/lib/api";
import {
  ACTIVITY_NEWS,
  FEATURED,
  PARTNER_LINKS,
  SCIENCE_CARDS,
  SERVICES,
} from "@/lib/vast-content";

const VAST = "https://vast.gov.vn/";

async function loadPress() {
  try {
    const res = await fetchNew(1);
    return res.items;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const articles = await loadPress();
  const today = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  );

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

      <section className="banner" aria-label="Giới thiệu">
        <div className="wrap banner-grid">
          <div className="banner-copy">
            <span className="eyebrow">Cổng thông tin điện tử</span>
            <h2 className="banner-title">Khoa học và công nghệ phục vụ phát triển đất nước</h2>
            <p>
              Kết nối thông tin chính thống của Viện Hàn lâm Khoa học và Công nghệ Việt Nam với dòng tin khoa học
              - công nghệ cập nhật từ báo chí trong nước.
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

      <div className="wrap portal-main">

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

        <div className="cols">
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
        </div>

        <section className="press" aria-labelledby="press-h">
          <div className="sec-head">
            <h2 className="sec-h" id="press-h">
              Khoa học &amp; công nghệ trên báo chí
            </h2>
            <Link href="/tin-nong-khcn">Tin nóng KHCN →</Link>
          </div>
          <PressFeed articles={articles} />
          <p className="note">
            Tiêu đề và liên kết được tổng hợp tự động từ các cơ quan báo chí; bấm vào để đọc bài gốc trên trang của
            báo. Nội dung thuộc quyền của từng cơ quan báo chí.
          </p>
        </section>

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
      </div>
    </>
  );
}
