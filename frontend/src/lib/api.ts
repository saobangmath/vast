const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

export type Source = {
  id: number;
  key: string;
  name: string;
  homepage_url: string;
  is_official: boolean;
};

export type Topic = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
};

export type ArticleCard = {
  id: number;
  title: string;
  summary: string;
  canonical_url: string;
  image_url: string | null;
  published_at: string | null;
  related_count: number;
  hot_score: number;
  source: Source;
  topic: Topic | null;
};

export type ArticleDetail = ArticleCard & {
  crawled_at: string;
  cluster_id: number | null;
  related_articles: ArticleCard[];
};

export type FeedResponse = {
  items: ArticleCard[];
  total: number;
  page: number;
  page_size: number;
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchHot(page = 1, topic?: string) {
  const qs = new URLSearchParams({ page: String(page), page_size: "20" });
  if (topic) qs.set("topic", topic);
  return getJson<FeedResponse>(`/api/articles/hot?${qs}`);
}

export function fetchNew(page = 1, topic?: string) {
  const qs = new URLSearchParams({ page: String(page), page_size: "20" });
  if (topic) qs.set("topic", topic);
  return getJson<FeedResponse>(`/api/articles/new?${qs}`);
}

export function fetchArticle(id: number) {
  return getJson<ArticleDetail>(`/api/articles/${id}`);
}

export function fetchTopics() {
  return getJson<Topic[]>("/api/topics");
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Vừa cập nhật";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  return `${days} ngày`;
}

/** Stable accent hue per outlet so sources are recognisable at a glance. */
export function sourceHue(key: string): number {
  return [...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
}
