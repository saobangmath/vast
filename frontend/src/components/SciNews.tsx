import Image from "next/image";
import Link from "next/link";

export type OfficialNews = {
  id: string;
  title: string;
  image: string | null;
  dateLabel: string;
  sectionLabel: string;
};

/** Official science & technology news from the Academy: 1 lead + 3 compact + a row of 3. */
export function SciNews({ official, below }: { official: OfficialNews[]; below?: React.ReactNode }) {
  const [lead, ...others] = official;
  const rest = others.slice(0, 3);

  return (
    <section className="sci" aria-labelledby="sci-h">
      <div className="sci-head">
        <div>
          <h2 className="sci-title" id="sci-h">
            Khoa học &amp; công nghệ
          </h2>
          <p className="sci-sub">Tin khoa học và công nghệ chính thống từ Viện Hàn lâm.</p>
        </div>
        <Link className="sci-all" href="/tin-tuc/khcn-trong-nuoc">
          Xem tất cả →
        </Link>
      </div>

      <div className="sci-body">
        <div className="feature-grid">
          {lead && (
            <Link href={`/bai-viet/${lead.id}`} className="fcard">
              {lead.image ? (
                <Image src={lead.image} alt="" fill sizes="(max-width: 900px) 100vw, 640px" />
              ) : (
                <div className="fcard-ph" aria-hidden />
              )}
              <div className="fcard-shade" />
              <div className="fcard-body">
                <span className="tag">{lead.sectionLabel}</span>
                <h3>{lead.title}</h3>
                <span className="fcard-meta">{lead.dateLabel}</span>
              </div>
            </Link>
          )}
          <div className="scard-col">
            {rest.map((n) => (
              <Link key={n.id} href={`/bai-viet/${n.id}`} className="scard">
                {n.image ? (
                  <Image src={n.image} alt="" width={240} height={160} sizes="120px" />
                ) : (
                  <div className="scard-ph" aria-hidden />
                )}
                <div>
                  <span className="cat">{n.sectionLabel}</span>
                  <h4>{n.title}</h4>
                  <span className="meta">{n.dateLabel}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {below}
      </div>
    </section>
  );
}
