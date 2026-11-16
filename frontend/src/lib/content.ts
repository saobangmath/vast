import fs from "node:fs";
import path from "node:path";

// Official VAST content crawled by scripts/crawl-vast.mjs into frontend/content/.
// Server-only (reads the filesystem).

const DIR = path.join(process.cwd(), "content");

export type Section = { key: string; name: string };
export type NewsItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  image: string | null;
  summary: string;
  section: string;
};
export type Article = NewsItem & { description: string; sourceUrl: string; html: string };
type Index = { crawledAt: string; sections: Section[]; items: NewsItem[] };

/** Menu groups: which crawled sections belong under which top-level menu item. */
export type Group = { key: string; name: string; base: string; sections: string[] };
export const GROUPS: Group[] = [
  {
    key: "tin-tuc",
    name: "Tin tức - Sự kiện",
    base: "/tin-tuc",
    sections: ["hoat-dong", "khcn-trong-nuoc", "nghien-cuu-co-ban", "phat-trien-cong-nghe", "dieu-tra-co-ban", "khcn-quoc-te"],
  },
  {
    key: "giai-thuong",
    name: "Giải thưởng Trần Đại Nghĩa",
    base: "/giai-thuong",
    sections: ["giai-thuong-tin-tuc", "giai-thuong-thong-bao", "giai-thuong-tieu-su", "giai-thuong-van-ban", "giai-thuong-du-lieu"],
  },
  {
    key: "dao-tao",
    name: "Hoạt động đào tạo",
    base: "/hoat-dong-dao-tao",
    sections: ["dao-tao", "tuyen-sinh"],
  },
];

export const getGroup = (key: string) => GROUPS.find((g) => g.key === key);
export const groupOfSection = (section: string) => GROUPS.find((g) => g.sections.includes(section));

let cache: Index | null = null;

export function getIndex(): Index {
  if (!cache) {
    try {
      cache = JSON.parse(fs.readFileSync(path.join(DIR, "index.json"), "utf8")) as Index;
    } catch {
      cache = { crawledAt: "", sections: [], items: [] };
    }
  }
  return cache;
}

/** Sections of a group that have at least one article, in group order. */
export function groupSections(group: Group): Section[] {
  const idx = getIndex();
  const used = new Set(idx.items.map((i) => i.section));
  return group.sections
    .filter((k) => used.has(k))
    .map((k) => idx.sections.find((s) => s.key === k) ?? { key: k, name: k });
}

export function listNews(group: Group, section: string | "all", page: number, pageSize = 12) {
  const keys = section === "all" ? group.sections : [section];
  const all = getIndex().items.filter((i) => keys.includes(i.section));
  const pages = Math.max(1, Math.ceil(all.length / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  return { items: all.slice((p - 1) * pageSize, p * pageSize), total: all.length, page: p, pages };
}

export function getArticle(id: string): Article | null {
  if (!/^\d+-\d+$/.test(id)) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, "articles", `${id}.json`), "utf8")) as Article;
  } catch {
    return null;
  }
}

export function sectionName(key: string): string {
  return getIndex().sections.find((s) => s.key === key)?.name ?? key;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
