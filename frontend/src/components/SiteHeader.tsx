import Link from "next/link";

type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

const VAST = "https://vast.gov.vn/";

const NAV: NavItem[] = [
  {
    label: "Trang chủ",
    href: "/",
    children: [
      { label: "Trang Chủ 1 — báo chí cuối trang", href: "/" },
      { label: "Trang Chủ 2 — báo chí cột phải", href: "/?v=2" },
      { label: "Trang Chủ 3 — báo chí đầu trang", href: "/?v=3" },
      { label: "Trang Chủ 4 — tin của Viện + cột báo chí", href: "/?v=4" },
    ],
  },
  {
    label: "Cơ cấu tổ chức",
    href: "/co-cau-to-chuc",
    children: [
      { label: "Lãnh đạo và Quản lý", href: "/co-cau-to-chuc/lanh-dao" },
      { label: "Các đơn vị chức năng", href: "/co-cau-to-chuc/hanh-chinh" },
      { label: "Các đơn vị nghiên cứu", href: "/co-cau-to-chuc/nghien-cuu" },
      { label: "Các đơn vị khác", href: "/co-cau-to-chuc/su-nghiep" },
      { label: "Doanh nghiệp Nhà nước", href: "/co-cau-to-chuc/doanh-nghiep" },
    ],
  },
  {
    label: "Tin tức - Sự kiện",
    href: "/tin-tuc",
    children: [
      { label: "Tin tức hoạt động của Viện Hàn lâm", href: "/tin-tuc/hoat-dong" },
      { label: "Tin KH&CN trong nước", href: "/tin-tuc/khcn-trong-nuoc" },
      { label: "Nghiên cứu cơ bản", href: "/tin-tuc/nghien-cuu-co-ban" },
      { label: "Nghiên cứu và Phát triển công nghệ", href: "/tin-tuc/phat-trien-cong-nghe" },
      { label: "Điều tra cơ bản", href: "/tin-tuc/dieu-tra-co-ban" },
      { label: "Tin KH&CN quốc tế", href: "/tin-tuc/khcn-quoc-te" },
      { label: "Tin nóng KHCN (tổng hợp từ báo chí)", href: "/tin-nong-khcn" },
    ],
  },
  { label: "Chương trình KHCN trọng điểm", href: "/chuong-trinh-khcn-trong-diem" },
  {
    label: "Giải thưởng Trần Đại Nghĩa",
    href: "/giai-thuong",
    children: [
      { label: "Tin tức Giải thưởng", href: "/giai-thuong/giai-thuong-tin-tuc" },
      { label: "Tiểu sử GS.VS. Trần Đại Nghĩa", href: "/giai-thuong/giai-thuong-tieu-su" },
      { label: "Văn bản - Thủ tục hồ sơ", href: "/giai-thuong/giai-thuong-van-ban" },
      { label: "Thông báo", href: "/giai-thuong/giai-thuong-thong-bao" },
      { label: "Dữ liệu Giải thưởng", href: "/giai-thuong/giai-thuong-du-lieu" },
    ],
  },
  {
    label: "KHCN, ĐMST và CĐS",
    href: "/chuyen-doi-so",
    children: [
      { label: "Bản tin phát triển KH&CN, ĐMST & CĐS", href: "/chuyen-doi-so/cds-ban-tin" },
      { label: "Việt Nam phát triển KH&CN, ĐMST & CĐS", href: "/chuyen-doi-so/cds-viet-nam" },
      { label: "Cải cách hành chính", href: "/chuyen-doi-so/cds-cai-cach-hanh-chinh" },
      { label: "Ứng dụng CNTT", href: "/chuyen-doi-so/cds-ung-dung-cntt" },
      { label: "IPv6", href: "/chuyen-doi-so/cds-ipv6" },
    ],
  },
  {
    label: "Hoạt động đào tạo",
    href: "/hoat-dong-dao-tao",
    children: [
      { label: "Thông tin đào tạo", href: "/hoat-dong-dao-tao/dao-tao" },
      { label: "Thông tin tuyển sinh", href: "/hoat-dong-dao-tao/tuyen-sinh" },
    ],
  },
];

function NavLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return href.startsWith("http") ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <>
      <a className="skip" href="#main">
        Bỏ qua, đến nội dung chính
      </a>
      <div className="topbar">
        <div className="wrap">
          <span>Cổng thông tin điện tử chính thức</span>
          <div className="links">
            <Link href="/lien-he">Liên hệ</Link>
            <a href={VAST} target="_blank" rel="noopener noreferrer">
              vast.gov.vn
            </a>
            <div className="lang" aria-label="Ngôn ngữ">
              <a className="on" href="#">
                VI
              </a>
              <a href="#">EN</a>
            </div>
          </div>
        </div>
      </div>

      <header className="masthead-bar">
        <div className="wrap masthead">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo" src="/vast-logo.png" alt="Logo Viện Hàn lâm Khoa học và Công nghệ Việt Nam" />
          <div>
            <small>Cộng hòa Xã hội Chủ nghĩa Việt Nam</small>
            <Link href="/">
              <h1 className="site-title">Viện Hàn lâm Khoa học và Công nghệ Việt Nam</h1>
            </Link>
            <span className="en">Vietnam Academy of Science and Technology</span>
          </div>
        </div>
      </header>

      <nav className="main" aria-label="Điều hướng chính">
        <div className="wrap">
          <ul>
            {NAV.map((item, i) => (
              <li key={item.label}>
                <NavLink href={item.href} className={i === 0 ? "on" : undefined}>
                  {item.label}
                </NavLink>
                {item.children && (
                  <div className="sub">
                    {item.children.map((c) => (
                      <NavLink key={c.label} href={c.href}>
                        {c.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
