import type { Metadata } from "next";
import { HubClient } from "@/components/HubClient";
import { PageHero } from "@/components/PageHero";
import { fetchHot, fetchNew, fetchTopics } from "@/lib/api";

export const metadata: Metadata = { title: "Tin nóng KHCN | VAST" };

type SearchParams = Promise<{ tab?: string; topic?: string }>;

async function loadHub() {
  try {
    const [hot, newer, topics] = await Promise.all([fetchHot(1), fetchNew(1), fetchTopics()]);
    return { hot: hot.items, newer: newer.items, topics };
  } catch {
    return { hot: [], newer: [], topics: [] };
  }
}

export default async function TinNongPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { hot, newer, topics } = await loadHub();
  const initialTab = params.tab === "new" ? "new" : "hot";

  return (
    <>
      <PageHero
        eyebrow="Tổng hợp từ báo chí"
        title="Tin nóng KHCN"
        subtitle="Tin khoa học - công nghệ từ báo chí và các nguồn bên ngoài. Đọc tóm tắt tại đây, đọc đầy đủ tại nguồn gốc."
        crumbs={[{ label: "Tin tức - Sự kiện", href: "/tin-tuc" }, { label: "Tin nóng KHCN" }]}
      />
      <div className="wrap portal-main page-body">
        <HubClient hot={hot} newer={newer} topics={topics} initialTab={initialTab} initialTopic={params.topic} />
      </div>
    </>
  );
}
