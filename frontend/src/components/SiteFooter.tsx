import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="portal-footer">
      <div className="wrap">
        <div>
          <h5>Viện Hàn lâm Khoa học và Công nghệ Việt Nam</h5>
          <p style={{ margin: 0 }}>Số 18, đường Hoàng Quốc Việt, phường Nghĩa Đô, Thành phố Hà Nội</p>
        </div>
        <div>
          <h5>Truy cập nhanh</h5>
          <ul>
            <li>
              <Link href="/">Trang chủ</Link>
            </li>
            <li>
              <Link href="/tin-nong-khcn">Tin nóng KHCN</Link>
            </li>
            <li>
              <a href="https://vast.gov.vn/" target="_blank" rel="noopener noreferrer">
                vast.gov.vn
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h5>Hỗ trợ</h5>
          <ul>
            <li>
              <a href="https://vast.gov.vn/" target="_blank" rel="noopener noreferrer">
                Liên hệ
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="legal">
        <div className="wrap">
          Khi phát hành lại thông tin cần ghi rõ nguồn: “Viện Hàn lâm Khoa học và Công nghệ Việt Nam”. · Bản demo
          thiết kế lại giao diện, không phải trang chính thức.
        </div>
      </div>
    </footer>
  );
}
