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
    ],
  },
  {
    label: "Cơ cấu tổ chức",
    href: VAST,
    children: [
      { label: "Lãnh đạo và Quản lý", href: VAST },
      { label: "Các đơn vị chức năng", href: VAST },
      { label: "Các đơn vị nghiên cứu", href: VAST },
      { label: "Các đơn vị khác", href: VAST },
      { label: "Doanh nghiệp Nhà nước", href: VAST },
    ],
  },
  {
    label: "Tin tức - Sự kiện",
    href: "/tin-nong-khcn",
    children: [
      { label: "Tin tức hoạt động của Viện Hàn lâm", href: VAST },
      { label: "Tin nóng KHCN (tổng hợp từ báo chí)", href: "/tin-nong-khcn" },
      { label: "Tin mới cập nhật", href: "/tin-nong-khcn?tab=new" },
    ],
  },
  { label: "Chương trình KHCN trọng điểm", href: VAST },
  {
    label: "Giải thưởng Trần Đại Nghĩa",
    href: VAST,
    children: [
      { label: "Tin tức Giải thưởng", href: VAST },
      { label: "Tiểu sử GS.VS. Trần Đại Nghĩa", href: VAST },
      { label: "Văn bản - Thủ tục hồ sơ", href: VAST },
      { label: "Thông báo", href: VAST },
      { label: "Dữ liệu Giải thưởng", href: VAST },
    ],
  },
  { label: "KHCN, ĐMST và CĐS", href: VAST },
  { label: "Hoạt động đào tạo", href: VAST },
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
