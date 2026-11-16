import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { fetchHot, fetchNew } from "@/lib/api";

async function loadHomeFeeds() {
  try {
    const [hot, newer] = await Promise.all([fetchHot(1), fetchNew(1)]);
    return { hot: hot.items.slice(0, 5), newer: newer.items.slice(0, 6) };
  } catch {
    return { hot: [], newer: [] };
  }
}

export default async function HomePage() {
  const { hot, newer } = await loadHomeFeeds();

  return (
    <>
      <section className="hero">
        <div className="hero__content">
          <p className="hero__brand">VAST</p>
          <h1 className="hero__headline">Khoa học và công nghệ phục vụ phát triển đất nước</h1>
          <p className="hero__support">
            Cổng thông tin Viện Hàn lâm Khoa học và Công nghệ Việt Nam — kết nối nội dung chính thống
            của viện với dòng tin KHCN tổng hợp từ nguồn bên ngoài.
          </p>
          <div className="cta-row">
            <Link className="btn btn--primary" href="/tin-nong-khcn">
              Mở Tin nóng KHCN
            </Link>
            <a className="btn btn--ghost" href="https://vast.gov.vn/" target="_blank" rel="noreferrer">
              vast.gov.vn
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Tin KHCN nổi bật</h2>
        <p className="section__lead">
          Widget cầu nối từ trang chủ viện tới chuyên trang tổng hợp: nóng theo độ liên quan, mới theo
          thời gian.
        </p>
        <div className="home-grid">
          <div className="panel">
            <h3>Đang nóng</h3>
            {hot.map((article, idx) => (
              <ArticleCard key={article.id} article={article} featured={idx === 0} />
            ))}
          </div>
          <div className="panel">
            <h3>Mới cập nhật</h3>
            {newer.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
            <div className="cta-row">
              <Link className="btn btn--outline" href="/tin-nong-khcn">
                Xem tất cả trên Tin nóng KHCN
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
