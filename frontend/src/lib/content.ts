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
  {
    key: "chuyen-doi-so",
    name: "KHCN, ĐMST và CĐS",
    base: "/chuyen-doi-so",
    sections: ["cds-ban-tin", "cds-viet-nam", "cds-cai-cach-hanh-chinh", "cds-ung-dung-cntt", "cds-ipv6"],
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

/* ───────────── static pages: organisation units, leadership, contact ───────────── */

export type Unit = { id: string; name: string; image: string | null; html: string; title: string };
export type UnitGroup = { key: string; name: string; blurb: string; units: Unit[] };
type Pages = { groups: UnitGroup[]; leadership: string; contact: string; awardIntro: string };

let pagesCache: Pages | null = null;
export function getPages(): Pages {
  if (!pagesCache) {
    try {
      pagesCache = JSON.parse(fs.readFileSync(path.join(DIR, "pages.json"), "utf8")) as Pages;
    } catch {
      pagesCache = { groups: [], leadership: "", contact: "", awardIntro: "" };
    }
  }
  return pagesCache;
}

export function findUnit(id: string): { unit: Unit; group: UnitGroup } | null {
  for (const group of getPages().groups) {
    const unit = group.units.find((u) => u.id === id);
    if (unit) return { unit, group };
  }
  return null;
}

const SMALL = new Set(["và", "của", "cho", "về", "trong", "tại", "theo", "với", "các", "ở"]);
/** "VIỆN KHOA HỌC VẬT LIỆU" -> "Viện Khoa học Vật liệu"-style title case. */
export function titleCase(s: string): string {
  return s
    .toLocaleLowerCase("vi")
    .split(/\s+/)
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toLocaleUpperCase("vi") + w.slice(1)))
    .join(" ");
}

const entities = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** Plain-text lines of a crawled HTML fragment. */
export function htmlLines(html: string): string[] {
  return entities(
    html
      .replace(/<\/(div|p|li|h\d|tr)>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/[ \t ]+/g, " "),
  )
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export type Fact = { label: string; value: string };
export type UnitBlock = { title: string; lines: string[] };
export type UnitView = {
  facts: Fact[]; // key facts above the first heading (address, head, decision…)
  contact: Fact[]; // "ĐỊA CHỈ LIÊN HỆ"
  address: string;
  leaders: { role: string; names: string[] }[];
  blocks: UnitBlock[]; // remaining sections (functions, council, …)
};

const isHeading = (l: string) =>
  l.length >= 4 && l.length <= 70 && !l.includes(":") && l === l.toLocaleUpperCase("vi") && /\p{L}/u.test(l);
const kv = (l: string): Fact | null => {
  const m = l.match(/^([^:]{2,60}):\s*(.+)$/);
  return m ? { label: m[1].trim(), value: m[2].trim() } : null;
};

/** Turn the legacy table markup of a unit page into structured data for the new layout. */
export function parseUnit(html: string): UnitView {
  const lines = htmlLines(html);
  const view: UnitView = { facts: [], contact: [], address: "", leaders: [], blocks: [] };
  let cur: UnitBlock | null = null;
  const head: string[] = [];
  const sections: UnitBlock[] = [];
  for (const l of lines) {
    if (isHeading(l)) {
      cur = { title: l, lines: [] };
      sections.push(cur);
    } else if (cur) cur.lines.push(l);
    else head.push(l);
  }
  // key facts: "Trụ sở: …", "Viện trưởng: …" (+ following name lines), decision…
  let lastRole: Fact | null = null;
  for (const l of head) {
    const f = kv(l);
    if (f) {
      view.facts.push(f);
      lastRole = f;
    } else if (lastRole && /^(Phó|Giám|Viện|Chủ|Trưởng|Hiệu)/i.test(lastRole.label)) lastRole.value += `\n${l}`;
    else if (l) view.facts.push({ label: "", value: l });
  }
  for (const s of sections) {
    if (!s.lines.length) continue;
    if (/ĐỊA CHỈ/.test(s.title)) {
      for (const l of s.lines) {
        const f = kv(l);
        if (f) view.contact.push(f);
        else if (!view.address) view.address = l;
      }
    } else if (/LÃNH ĐẠO/.test(s.title)) {
      let role: { role: string; names: string[] } | null = null;
      for (const l of s.lines) {
        if (l.endsWith(":")) {
          role = { role: l.slice(0, -1), names: [] };
          view.leaders.push(role);
        } else if (role) role.names.push(l);
        else {
          const f = kv(l);
          if (f) view.leaders.push({ role: f.label, names: [f.value] });
        }
      }
    } else view.blocks.push(s);
  }
  return view;
}

export type ContactCard = { title: string; lines: Fact[]; note: string[] };
/** Contact page: blocks separated by a dashed line; first line is the title. */
export function parseContact(html: string): ContactCard[] {
  const cards: ContactCard[] = [];
  let cur: string[] = [];
  const flush = () => {
    if (!cur.length) return;
    const [title, ...rest] = cur;
    const lines: Fact[] = [];
    const note: string[] = [];
    for (const l of rest) {
      const f = kv(l);
      if (f) lines.push(f);
      else note.push(l);
    }
    cards.push({ title, lines, note });
    cur = [];
  };
  for (const l of htmlLines(html)) {
    if (/^-{4,}$/.test(l)) flush();
    else cur.push(l);
  }
  flush();
  return cards;
}
