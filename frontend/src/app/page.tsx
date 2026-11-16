import { Suspense } from "react";
import { HomeVariants, type HomeData } from "@/components/HomeVariants";
import { fetchNew } from "@/lib/api";
import { formatDate, getIndex, sectionName } from "@/lib/content";

async function loadPress() {
  try {
    const res = await fetchNew(1);
    return res.items;
  } catch {
    return [];
  }
}

/** Homepage content from the crawled vast.gov.vn data (frontend/content). */
function loadHome(): HomeData {
  const news = getIndex().items;
  const activity = news.filter((n) => n.section === "hoat-dong");
  const featured = activity.find((n) => n.image) ?? news[0];
  const science = news
    .filter((n) => n.section.startsWith("khcn") || n.section.includes("nghien-cuu") || n.section === "phat-trien-cong-nghe")
    .slice(0, 7)
    .map((n) => ({ id: n.id, title: n.title, image: n.image, dateLabel: formatDate(n.date), sectionLabel: sectionName(n.section) }));

  return {
    featured: featured
      ? {
          id: featured.id,
          title: featured.title,
          summary: featured.summary,
          dateLabel: formatDate(featured.date),
          sectionLabel: sectionName(featured.section),
        }
      : null,
    science,
    activity: activity
      .filter((n) => n.id !== featured?.id)
      .slice(0, 4)
      .map((n) => ({ id: n.id, title: n.title })),
  };
}

export default async function HomePage() {
  const articles = await loadPress();
  const home = loadHome();
  const today = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  );

  return (
    <Suspense fallback={<div className="wrap" style={{ padding: "24px 0" }}>Đang tải Trang chủ…</div>}>
      <HomeVariants articles={articles} today={today} home={home} />
    </Suspense>
  );
}
