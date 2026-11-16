import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { formatDate, getIndex } from "@/lib/content";

export const metadata: Metadata = { title: "Chương trình KHCN trọng điểm | VAST" };

export default function ProgramPage() {
  const items = getIndex().items.filter((i) => /trọng điểm/i.test(`${i.title} ${i.summary}`));
  return (
    <>
      <PageHero
        eyebrow="Khoa học và công nghệ"
        title="Chương trình KHCN trọng điểm"
        subtitle="Các chương trình, nhiệm vụ khoa học và công nghệ trọng điểm do Viện Hàn lâm chủ trì và triển khai."
        crumbs={[{ label: "Chương trình KHCN trọng điểm" }]}
      />
      <div className="wrap portal-main page-body">
        <div className="empty-state">
          <div className="empty-ico" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6" />
            </svg>
          </div>
          <h2>Nội dung đang được cập nhật</h2>
          <p>
            Trang giới thiệu chương trình trên cổng hiện tại chưa có nội dung. Bên dưới là các tin liên quan đến
            nhiệm vụ trọng điểm.
          </p>
        </div>
        {items.length > 0 && (
          <div className="news-list">
            {items.map((a) => (
              <Link key={a.id} href={`/bai-viet/${a.id}`} className="nrow">
                {a.image ? (
                  <Image src={a.image} alt="" width={440} height={275} sizes="(max-width: 640px) 100vw, 220px" />
                ) : (
                  <div className="nrow-ph" aria-hidden />
                )}
                <div>
                  <h2>{a.title}</h2>
                  <p>{a.summary}</p>
                  <span className="meta">{formatDate(a.date)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
