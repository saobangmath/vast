import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { UnitCard } from "@/components/UnitCard";
import { getPages } from "@/lib/content";

export const metadata: Metadata = { title: "Lãnh đạo và Quản lý | VAST" };

export default function LeadershipPage() {
  const { groups, leadership } = getPages();
  const photo = leadership.match(/<img[^>]*src="([^"]+)"/)?.[1];
  const functional = groups.find((g) => g.key === "hanh-chinh");
  return (
    <>
      <PageHero
        eyebrow="Cơ cấu tổ chức"
        title="Lãnh đạo và Quản lý"
        subtitle="Lãnh đạo Viện Hàn lâm Khoa học và Công nghệ Việt Nam gồm Chủ tịch và bốn Phó Chủ tịch."
        crumbs={[{ label: "Cơ cấu tổ chức", href: "/co-cau-to-chuc" }, { label: "Lãnh đạo và Quản lý" }]}
      />
      <div className="wrap portal-main page-body">
        {photo && (
          <figure className="leader-photo">
            <Image src={photo} alt="Lãnh đạo Viện Hàn lâm Khoa học và Công nghệ Việt Nam" width={700} height={609} sizes="(max-width: 800px) 100vw, 700px" priority />
          </figure>
        )}
        {functional && (
          <section className="org-section">
            <div className="sec-head">
              <h2 className="sec-h">Các đơn vị chức năng</h2>
              <Link href="/co-cau-to-chuc/hanh-chinh">Xem tất cả →</Link>
            </div>
            <div className="unit-grid">
              {functional.units.map((u) => (
                <UnitCard key={u.id} unit={u} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
