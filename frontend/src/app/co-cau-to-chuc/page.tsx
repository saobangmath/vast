import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { UnitCard } from "@/components/UnitCard";
import { getPages } from "@/lib/content";

export const metadata: Metadata = { title: "Cơ cấu tổ chức | VAST" };

export default function OrgPage() {
  const { groups, leadership } = getPages();
  const photo = leadership.match(/<img[^>]*src="([^"]+)"/)?.[1];
  const total = groups.reduce((a, g) => a + g.units.length, 0);

  return (
    <>
      <PageHero
        eyebrow="Viện Hàn lâm Khoa học và Công nghệ Việt Nam"
        title="Cơ cấu tổ chức"
        subtitle={`${total} đơn vị trực thuộc: các đơn vị chức năng, viện nghiên cứu, đơn vị sự nghiệp và doanh nghiệp nhà nước.`}
        crumbs={[{ label: "Cơ cấu tổ chức" }]}
      />
      <div className="wrap portal-main page-body">
        <Link href="/co-cau-to-chuc/lanh-dao" className="leader-card">
          {photo && <Image src={photo} alt="Lãnh đạo Viện Hàn lâm" width={700} height={609} sizes="(max-width: 800px) 100vw, 420px" />}
          <div>
            <span className="cat">Lãnh đạo và Quản lý</span>
            <h2>Chủ tịch và bốn Phó Chủ tịch</h2>
            <p>Ban lãnh đạo Viện Hàn lâm Khoa học và Công nghệ Việt Nam và các đơn vị chức năng giúp việc.</p>
            <span className="cta cta--navy">Xem Lãnh đạo →</span>
          </div>
        </Link>

        {groups.map((g) => (
          <section key={g.key} className="org-section" id={g.key}>
            <div className="sec-head">
              <h2 className="sec-h">{g.name}</h2>
              <Link href={`/co-cau-to-chuc/${g.key}`}>{g.units.length} đơn vị →</Link>
            </div>
            <p className="org-blurb">{g.blurb}</p>
            <div className="unit-grid">
              {g.units.map((u) => (
                <UnitCard key={u.id} unit={u} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
