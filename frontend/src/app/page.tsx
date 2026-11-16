import Link from "next/link";
import { PressSidebar } from "@/components/PressSidebar";
import { SciNews } from "@/components/SciNews";
import { fetchNew } from "@/lib/api";
import { formatDate, getIndex, sectionName } from "@/lib/content";
import { PARTNER_LINKS } from "@/lib/vast-content";

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
  const official = news
    .filter((n) => n.section.startsWith("khcn") || n.section.includes("nghien-cuu") || n.section === "phat-trien-cong-nghe")
    .slice(0, 7)
    .map((n) => ({ id: n.id, title: n.title, image: n.image, dateLabel: formatDate(n.date), sectionLabel: sectionName(n.section) }));
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

        <div className="sci-layout">
          <SciNews official={official} />
          <PressSidebar articles={articles} />
        </div>

        <div className="info-row">
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
        </div>

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
