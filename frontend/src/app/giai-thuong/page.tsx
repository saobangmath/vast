import type { Metadata } from "next";
import { NewsList } from "@/components/NewsList";
import { getGroup, getPages } from "@/lib/content";

const group = getGroup("giai-thuong")!;
export const metadata: Metadata = { title: `${group.name} | VAST` };

export default async function GroupIndex({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const intro = getPages().awardIntro;
  return (
    <NewsList
      group={group}
      section="all"
      page={Number(page) || 1}
      blurb="Giải thưởng của khoa học công nghệ định hướng ứng dụng và đổi mới sáng tạo."
      intro={
        intro && (
          <details className="intro-card">
            <summary>
              <span>Giới thiệu về Giải thưởng</span>
              <span className="intro-toggle" aria-hidden />
            </summary>
            <div className="prose" dangerouslySetInnerHTML={{ __html: intro }} />
          </details>
        )
      }
    />
  );
}
