import Link from "next/link";

const links = [
  { href: "/", label: "Trang chủ" },
  { href: "/tin-nong-khcn", label: "Tin nóng KHCN" },
  { href: "/tin-nong-khcn?tab=new", label: "Tin mới" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          <span className="brand__mark" aria-hidden />
          <span className="brand__text">
            <strong>VAST</strong>
            <em>Viện Hàn lâm Khoa học và Công nghệ Việt Nam</em>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Chính">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
