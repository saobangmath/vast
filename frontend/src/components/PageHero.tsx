import Link from "next/link";

export type Crumb = { label: string; href?: string };

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  /** Optional visual on the right (e.g. a unit's photo). */
  aside?: React.ReactNode;
};

/** Dark page header band shared by all inner pages. */
export function PageHero({ eyebrow, title, subtitle, crumbs = [], aside }: Props) {
  return (
    <section className="page-hero">
      <div className="wrap page-hero-grid">
        <div>
          <nav className="crumbs crumbs--hero" aria-label="Đường dẫn">
            <Link href="/">Trang chủ</Link>
            {crumbs.map((c) => (
              <span key={c.label}>
                {" / "}
                {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
              </span>
            ))}
          </nav>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="page-hero-title">{title}</h1>
          {subtitle && <p className="page-hero-sub">{subtitle}</p>}
        </div>
        {aside && <div className="page-hero-aside">{aside}</div>}
      </div>
    </section>
  );
}
