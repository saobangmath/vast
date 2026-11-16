import Link from "next/link";
import type { ArticleCard } from "@/lib/api";
import { PressFeed, type PressLayout } from "@/components/PressFeed";

type Props = {
  articles: ArticleCard[];
  layout?: PressLayout;
  className?: string;
  id?: string;
};

export function PressSection({ articles, layout = "grid", className, id = "press-h" }: Props) {
  return (
    <section className={["press", className].filter(Boolean).join(" ")} aria-labelledby={id}>
      <div className="sec-head">
        <h2 className="sec-h" id={id}>
          Khoa học &amp; công nghệ trên báo chí
        </h2>
        <Link href="/tin-nong-khcn">Tin nóng KHCN →</Link>
      </div>
      <PressFeed articles={articles} layout={layout} />
      <p className="note">
        Tiêu đề và liên kết được tổng hợp tự động từ các cơ quan báo chí; bấm vào để đọc bài gốc trên trang của
        báo. Nội dung thuộc quyền của từng cơ quan báo chí.
      </p>
    </section>
  );
}
