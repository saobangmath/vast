import { HubClient } from "@/components/HubClient";
import { fetchHot, fetchNew, fetchTopics } from "@/lib/api";

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
      <div className="hub-hero">
        <h1>Tin nóng KHCN</h1>
        <p>
          Tổng hợp tin khoa học — công nghệ từ báo chí và nguồn bên ngoài. Đọc tóm tắt tại đây, đọc đầy
          đủ tại nguồn gốc.
        </p>
      </div>
      <section className="section">
        <HubClient
          hot={hot}
          newer={newer}
          topics={topics}
          initialTab={initialTab}
          initialTopic={params.topic}
        />
      </section>
    </>
  );
}
