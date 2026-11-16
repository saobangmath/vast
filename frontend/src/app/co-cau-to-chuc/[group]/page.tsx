import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { UnitCard } from "@/components/UnitCard";
import { getPages } from "@/lib/content";

type Props = { params: Promise<{ group: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { group } = await params;
  const g = getPages().groups.find((x) => x.key === group);
  return { title: g ? `${g.name} | VAST` : "Cơ cấu tổ chức | VAST" };
}

export default async function OrgGroupPage({ params }: Props) {
  const { group } = await params;
  const groups = getPages().groups;
  const g = groups.find((x) => x.key === group);
  if (!g) notFound();
  return (
    <>
      <PageHero
        eyebrow="Cơ cấu tổ chức"
        title={g.name}
        subtitle={g.blurb}
        crumbs={[{ label: "Cơ cấu tổ chức", href: "/co-cau-to-chuc" }, { label: g.name }]}
      />
      <div className="wrap portal-main page-body">
        <div className="chips filters">
          <Link className="pill" href="/co-cau-to-chuc/lanh-dao">
            Lãnh đạo
          </Link>
          {groups.map((x) => (
            <Link key={x.key} className={`pill ${x.key === g.key ? "on" : ""}`} href={`/co-cau-to-chuc/${x.key}`}>
              {x.name}
            </Link>
          ))}
        </div>
        <div className="unit-grid">
          {g.units.map((u) => (
            <UnitCard key={u.id} unit={u} />
          ))}
        </div>
      </div>
    </>
  );
}
