#!/usr/bin/env node
// Crawl news from vast.gov.vn (Liferay, server-rendered) into frontend/content/.
// Usage: node scripts/crawl-vast.mjs [--since 2024-01-01] [--limit-pages N] [--only slug]
// Polite by design: sequential requests with a delay, retries, and an on-disk cache.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "frontend", "content");
const CACHE = path.join(ROOT, ".crawl-cache");
const BASE = "https://vast.gov.vn";
const DELAY_MS = 600;

const args = process.argv.slice(2);
const arg = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const SINCE = new Date(arg("--since", "2024-01-01"));
const LIMIT_PAGES = Number(arg("--limit-pages", 400));
const ONLY = arg("--only", null);

// Listing pages from the sitemap (slug -> section).
const SECTIONS = [
  { slug: "tin-tuc-hoat-ong-cua-vien-han-lam-khcnvn", key: "hoat-dong", name: "Tin tức hoạt động" },
  { slug: "tin-khoa-hoc-cong-nghe-trong-nuoc2", key: "khcn-trong-nuoc", name: "Tin KH&CN trong nước" },
  { slug: "nghien-cuu-co-ban1", key: "nghien-cuu-co-ban", name: "Nghiên cứu cơ bản" },
  { slug: "nghien-cuu-va-phat-trien-cong-nghe1", key: "phat-trien-cong-nghe", name: "Nghiên cứu và Phát triển công nghệ" },
  { slug: "-ieu-tra-co-ban1", key: "dieu-tra-co-ban", name: "Điều tra cơ bản" },
  { slug: "tin-khoa-hoc-cong-nghe-quoc-te", key: "khcn-quoc-te", name: "Tin KH&CN quốc tế" },
  { slug: "tin-tuc-giai-thuong", key: "giai-thuong-tin-tuc", name: "Tin tức Giải thưởng Trần Đại Nghĩa" },
  // `all: true` = small archives, ignore the --since cutoff
  { slug: "thong-bao-giai-thuong-tran-dai-nghia-1", key: "giai-thuong-thong-bao", name: "Thông báo Giải thưởng", all: true },
  { slug: "tieu-su-gs.vs.tran-dai-nghia", key: "giai-thuong-tieu-su", name: "Tiểu sử GS.VS. Trần Đại Nghĩa", all: true },
  { slug: "van-ban-thu-tuc-ho-so-1", key: "giai-thuong-van-ban", name: "Văn bản - Thủ tục hồ sơ", all: true },
  { slug: "du-lieu-giai-thuong-1", key: "giai-thuong-du-lieu", name: "Dữ liệu Giải thưởng", all: true },
  { slug: "thong-tin-ao-tao", key: "dao-tao", name: "Thông tin đào tạo" },
  { slug: "thong-tin-tuyen-sinh", key: "tuyen-sinh", name: "Thông tin tuyển sinh" },
  // KHCN, ĐMST và CĐS portal (separate Liferay site)
  { site: "chuyen-doi-so", slug: "ban-tin-chuyen-doi-so", key: "cds-ban-tin", name: "Bản tin phát triển KH&CN, ĐMST & CĐS" },
  { site: "chuyen-doi-so", slug: "viet-nam-chuyen-doi-so", key: "cds-viet-nam", name: "Việt Nam phát triển KH&CN, ĐMST & CĐS" },
  { site: "chuyen-doi-so", slug: "cai-cach-hanh-chinh", key: "cds-cai-cach-hanh-chinh", name: "Cải cách hành chính" },
  { site: "chuyen-doi-so", slug: "ung-dung-cntt", key: "cds-ung-dung-cntt", name: "Ứng dụng CNTT" },
  { site: "chuyen-doi-so", slug: "ipv6", key: "cds-ipv6", name: "IPv6" },
];

fs.mkdirSync(path.join(OUT, "articles"), { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
// Cache key. Paginated listing URLs (with a query) hash the WHOLE url: they used to be keyed by
// the last 90 bytes only, so the same page of two different base paths collided.
function cacheFile(url) {
  const key = url.includes("?")
    ? "q-" + crypto.createHash("sha1").update(url).digest("hex")
    : Buffer.from(url).toString("base64url").slice(-120);
  return path.join(CACHE, key + ".html");
}

async function get(url) {
  const file = cacheFile(url);
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  for (let attempt = 1; attempt <= 4; attempt++) {
    const wait = last + DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const r = await fetch(url, {
        headers: { "user-agent": "vast-redesign-demo-crawler/1.0" },
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const t = await r.text();
      fs.writeFileSync(file, t);
      return t;
    } catch (e) {
      if (attempt === 4) throw new Error(`${url}: ${e.message}`);
      await sleep(1500 * attempt);
    }
  }
}

const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
const text = (s) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const abs = (u) => (u.startsWith("http") ? u : u.startsWith("//") ? "https:" + u : BASE + (u.startsWith("/") ? "" : "/") + u);
const parseDate = (s) => {
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
const articleId = (url) => {
  const seg = decodeURIComponent(url.split("/").pop() ?? "").replace(/\.html$/, "");
  const m = seg.match(/(\d+-\d+)$/);
  return m ? m[1] : null;
};

function parseList(html, section) {
  const items = [];
  const re = /<div class="title">\s*<a href='([^']+)'>([^<]*)<\/a>\s*<\/div>\s*<div class="date"[^>]*>([^<]*)<\/div>([\s\S]*?)<div class="dotline"/g;
  let m;
  while ((m = re.exec(html))) {
    const url = m[1];
    const id = articleId(url);
    if (!id) continue;
    const img = m[4].match(/<img[^>]*src='([^']+)'/);
    const desc = m[4].match(/<p class="description">([\s\S]*?)<\/p>/);
    items.push({
      id,
      url,
      title: text(m[2]),
      date: parseDate(m[3]),
      image: img ? abs(img[1]) : null,
      summary: desc ? text(desc[1]) : "",
      section: section.key,
    });
  }
  return items;
}

/** Final URL (path) after redirects: some listing pages redirect and a redirect drops the paging query. */
async function resolveBase(url) {
  const wait = last + DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const r = await fetch(url, { headers: { "user-agent": "vast-redesign-demo-crawler/1.0" }, signal: AbortSignal.timeout(30000) });
  await r.body?.cancel();
  const u = new URL(r.url);
  return u.origin + u.pathname;
}

async function crawlSection(section) {
  const startUrl = `${BASE}/web/${section.site ?? "guest"}/${section.slug}`;
  const base = await resolveBase(startUrl);
  const first = await get(base);
  // Page 1 comes from the plain URL. The portlet instance id (needed for page 2+) is only
  // present in the pagination links, so a section with a single page has no `p_p_id=`.
  const idm = first.match(/p_p_id=(CmsViewTinTrangChuyenMuc_WAR_CmsViewEcoITportlet_INSTANCE_\w+)/);
  const P = idm ? idm[1] : null;
  const tot = first.match(/of ([\d.]+) k/);
  console.log(`  [${section.key}] ${P ? "portlet " + P.slice(-8) : "single page"}, total ${tot ? tot[1] : "?"}`);
  const out = [];
  const seen = new Set();
  for (let cur = 1; cur <= LIMIT_PAGES; cur++) {
    if (cur > 1 && !P) break;
    const url =
      cur === 1
        ? base
        : `${base}?p_p_id=${P}&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view` +
          `&p_p_col_id=column-1&p_p_col_count=1&_${P}_delta=10&_${P}_keywords=&_${P}_advancedSearch=false` +
          `&_${P}_andOperator=true&_${P}_resetCur=false&_${P}_cur=${cur}`;
    const items = parseList(await get(url), section);
    // Consecutive pages can overlap by an item, so stop only when a page brings nothing new
    // (past the last page the server just repeats it).
    const unseen = items.filter((i) => !seen.has(i.id));
    if (!unseen.length) break;
    unseen.forEach((i) => seen.add(i.id));
    const fresh = section.all ? unseen : unseen.filter((i) => i.date && new Date(i.date) >= SINCE);
    out.push(...fresh);
    if (!section.all && fresh.length < unseen.length) break; // reached older than cutoff (list is newest-first)
    if (cur % 10 === 0) console.log(`    [${section.key}] page ${cur}, ${out.length} items`);
  }
  console.log(`  [${section.key}] ${out.length} items since ${arg("--since", "2024-01-01")}`);
  return out;
}

function extractContent(html) {
  const start = html.indexOf('<div class="content"');
  if (start < 0) return "";
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0] === "</div>" ? -1 : 1;
    if (depth === 0) {
      let inner = html.slice(html.indexOf(">", start) + 1, m.index);
      return clean(inner);
    }
  }
  return "";
}

function clean(h) {
  return h
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/\s(style|class|id|width|height|align|dir|lang|data-[\w-]+)=("[^"]*"|'[^']*')/gi, "")
    // internal routes for links to other crawled content
    .replace(/\shref=("|')https?:\/\/vast\.gov\.vn\/web\/[a-z-]+\/tin-chi-tiet\/-\/chi-tiet\/[^"']*?(\d+-\d+)(?:\.html)?(?:\?[^"']*)?\1/gi, (_, q, id) => ` href=${q}/bai-viet/${id}${q}`)
    .replace(/\shref=("|')[^"']*phongBanId(?:=|&#x3d;|&amp;#x3d;)(\d+)[^"']*\1/gi, (_, q, id) => ` href=${q}/don-vi/${id}${q}`)
    .replace(/\ssrc=("|')(\/[^"']*)\1/gi, (_, q, u) => ` src=${q}${BASE}${u}${q}`)
    .replace(/\shref=("|')(\/(?!\/|don-vi\/|bai-viet\/)[^"']*)\1/gi, (_, q, u) => ` href=${q}${BASE}${u}${q}`)
    .replace(/<(p|div|span|strong|em|b|i)>\s*(&nbsp;|\s)*<\/\1>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br />")
    .trim();
}

async function crawlArticle(item) {
  const file = path.join(OUT, "articles", `${item.id}.json`);
  if (fs.existsSync(file)) return;
  const html = await get(item.url);
  const title = html.match(/<h1 class="title">([\s\S]*?)<\/h1>/);
  const date = html.match(/<div class="date"[^>]*>([^<]*)<\/div>/);
  const desc = html.match(/<div class="description"[^>]*>([\s\S]*?)<\/div>/);
  const body = extractContent(html);
  fs.writeFileSync(
    file,
    JSON.stringify({
      id: item.id,
      title: title ? text(title[1]) : item.title,
      date: (date && parseDate(date[1])) || item.date,
      description: desc ? text(desc[1]) : item.summary,
      image: item.image,
      section: item.section,
      sourceUrl: item.url,
      html: body,
    }),
  );
}

(async () => {
  const sections = ONLY ? SECTIONS.filter((s) => s.key === ONLY) : SECTIONS;
  const byId = new Map();
  for (const s of sections) {
    console.log(`Section: ${s.name}`);
    for (const it of await crawlSection(s)) if (!byId.has(it.id)) byId.set(it.id, it);
  }
  const all = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
  console.log(`Unique articles: ${all.length}. Fetching bodies...`);
  let n = 0;
  for (const it of all) {
    try {
      await crawlArticle(it);
    } catch (e) {
      console.warn("  failed:", e.message);
    }
    if (++n % 50 === 0) console.log(`  bodies ${n}/${all.length}`);
  }
  fs.writeFileSync(
    path.join(OUT, "index.json"),
    JSON.stringify({ crawledAt: new Date().toISOString(), sections: SECTIONS.map(({ key, name }) => ({ key, name })), items: all.map(({ url, ...rest }) => rest) }),
  );
  console.log("Done.");
})();
