import Image from "next/image";
import Link from "next/link";
import { PressFeed } from "@/components/PressFeed";
import { fetchNew } from "@/lib/api";
import { formatDate, getIndex, sectionName } from "@/lib/content";
import {
  PARTNER_LINKS,
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
  const news = getIndex().items;
  const activity = news.filter((n) => n.section === "hoat-dong");
  const featured = activity.find((n) => n.image) ?? news[0];
  const activityList = activity.filter((n) => n.id !== featured?.id).slice(0, 4);
  const science = news.filter((n) => n.section.startsWith("khcn") || n.section.includes("nghien-cuu") || n.section === "phat-trien-cong-nghe").slice(0, 4);
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
          {featured && (
            <article className="banner-card">
              <span className="tag">Tin nổi bật</span>
              <h3>{featured.title}</h3>
              <p>{featured.summary}</p>
              <Link href={`/bai-viet/${featured.id}`}>Đọc chi tiết →</Link>
              <div className="meta">
                {formatDate(featured.date)} · {sectionName(featured.section)}
              </div>
            </article>
          )}
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
              <Link href="/tin-tuc/khcn-trong-nuoc">Xem tất cả →</Link>
            </div>
            <div className="cards">
              {science.map((c) => (
                <article key={c.id} className="card">
                  {c.image ? (
                    <Image className="card-img" src={c.image} alt="" width={640} height={320} sizes="(max-width: 640px) 100vw, 380px" />
                  ) : (
                    <div className="thumb" style={{ "--c1": "#123e6b", "--c2": "#0a2340" } as React.CSSProperties} />
                  )}
                  <div className="card-in">
                    <span className="cat">{sectionName(c.section)}</span>
                    <h4>
                      <Link href={`/bai-viet/${c.id}`}>{c.title}</Link>
                    </h4>
                    <span className="meta">{formatDate(c.date)}</span>
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
              <h3><Link href="/tin-tuc/hoat-dong">Tin tức hoạt động</Link></h3>
              <ul className="list">
                {activityList.map((n) => (
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
