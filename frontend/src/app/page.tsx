import { HomeContent, type HomeData } from "@/components/HomeContent";
import { fetchNew } from "@/lib/api";
import { formatDate, getIndex, sectionName } from "@/lib/content";
import { homePapers, paperLabel } from "@/lib/papers";

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
  };
}

export default async function HomePage() {
  const articles = await loadPress();
  const home = loadHome();
  const { byTopic: rawByTopic, topics, total } = homePapers();
  const byTopic = Object.fromEntries(
    Object.entries(rawByTopic).map(([t, ps]) => [
      t,
      ps.map((p) => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        url: p.url,
        label: paperLabel(p, p.venueInfo),
        tier: p.venueInfo.tier,
      })),
    ]),
  );
  const today = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  );

  return <HomeContent articles={articles} today={today} home={home} intl={{ byTopic, topics: topics.slice(0, 6), total }} />;
}
