#!/usr/bin/env node
// Crawl the "static" pages of vast.gov.vn: organisation units (4 groups + detail pages),
// leadership, contact and the Tran Dai Nghia award introduction -> frontend/content/pages.json
// Usage: node scripts/crawl-pages.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "frontend", "content");
const CACHE = path.join(ROOT, ".crawl-cache");
const BASE = "https://vast.gov.vn";
const DELAY_MS = 600;

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function get(url) {
  const file = path.join(CACHE, Buffer.from(url).toString("base64url").slice(-120) + ".html");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8");
  for (let attempt = 1; attempt <= 4; attempt++) {
    const wait = last + DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const r = await fetch(url, { headers: { "user-agent": "vast-redesign-demo-crawler/1.0" }, signal: AbortSignal.timeout(30000) });
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
const abs = (u) => (u.startsWith("http") ? u : BASE + (u.startsWith("/") ? "" : "/") + u);

function clean(h) {
  return h
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/\s(style|class|id|width|height|align|dir|lang|bgcolor|border|cellpadding|cellspacing|data-[\w-]+)=("[^"]*"|'[^']*')/gi, "")
    .replace(/\shref=("|')https?:\/\/vast\.gov\.vn\/web\/[a-z-]+\/tin-chi-tiet\/-\/chi-tiet\/[^"']*?(\d+-\d+)(?:\.html)?(?:\?[^"']*)?\1/gi, (_, q, id) => ` href=${q}/bai-viet/${id}${q}`)
    .replace(/\shref=("|')[^"']*phongBanId(?:=|&#x3d;|&amp;#x3d;)(\d+)[^"']*\1/gi, (_, q, id) => ` href=${q}/don-vi/${id}${q}`)
    .replace(/\ssrc=("|')(\/[^"']*)\1/gi, (_, q, u) => ` src=${q}${BASE}${u}${q}`)
    .replace(/\shref=("|')(\/(?!\/|don-vi\/|bai-viet\/)[^"']*)\1/gi, (_, q, u) => ` href=${q}${BASE}${u}${q}`)
    .replace(/<(p|div|span|strong|em|b|i)>\s*(&nbsp;|\s)*<\/\1>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br />")
    .trim();
}

/** Inner HTML of the first <div ... class="...marker..."> (balanced). */
function divInner(html, marker, from = 0) {
  const re = new RegExp(`<div[^>]*class="[^"]*${marker}[^"]*"[^>]*>`);
  const m = re.exec(html.slice(from));
  if (!m) return "";
  const start = from + m.index;
  const tag = /<div\b|<\/div>/g;
  tag.lastIndex = start;
  let depth = 0;
  let t;
  while ((t = tag.exec(html))) {
    depth += t[0] === "</div>" ? -1 : 1;
    if (depth === 0) return html.slice(start + m[0].length, t.index);
  }
  return "";
}

const GROUPS = [
  { key: "hanh-chinh", name: "Các đơn vị chức năng", slug: "don-vi-hanh-chinh1", blurb: "Các ban, văn phòng và quỹ giúp Chủ tịch Viện Hàn lâm quản lý, điều hành hoạt động chung." },
  { key: "nghien-cuu", name: "Các đơn vị nghiên cứu", slug: "vien-nghien-cuu1", blurb: "Các viện và trung tâm nghiên cứu khoa học, phát triển công nghệ thuộc Viện Hàn lâm." },
  { key: "su-nghiep", name: "Các đơn vị khác", slug: "don-vi-su-nghiep", blurb: "Các đơn vị sự nghiệp phục vụ nghiên cứu, đào tạo và ứng dụng." },
  { key: "doanh-nghiep", name: "Doanh nghiệp Nhà nước", slug: "-on-vi-tu-trang-trai-kinh-phi", blurb: "Doanh nghiệp và đơn vị tự trang trải kinh phí." },
];

async function crawlUnits() {
  const groups = [];
  for (const g of GROUPS) {
    const html = await get(`${BASE}/web/guest/${g.slug}`);
    const units = [];
    const re = /<div class="box-one[^"]*">([\s\S]*?)<div class="dotline"/g;
    let m;
    while ((m = re.exec(html))) {
      const blk = m[1];
      const link = blk.match(/<h1>\s*<a href="([^"]+)">([^<]*)<\/a>/);
      if (!link) continue;
      const id = decode(link[1]).match(/phongBanId=(\d+)/)?.[1];
      if (!id) continue;
      const img = blk.match(/<img[^>]*src="([^"]+)"/);
      units.push({ id, name: text(link[2]), image: img ? abs(img[1]) : null, _url: decode(link[1]) });
    }
    const total = html.match(/Hiển thị (\d+) kết quả/)?.[1];
    console.log(`  [${g.key}] ${units.length} units${total ? ` (site says ${total})` : ""}`);
    for (const u of units) {
      try {
        const d = await get(u._url);
        const title = divInner(d, "info-cocau-title");
        const body = divInner(d, "info-cocau-body");
        // legacy layout tables -> plain blocks (the redesign lays content out itself)
        u.html = clean(body.replace(/<(\/?)(table|tbody|thead|tfoot|tr|td|th)\b[^>]*>/gi, "<$1div>"));
        u.title = text(title) || u.name;
      } catch (e) {
        console.warn("   failed unit", u.id, e.message);
        u.html = "";
      }
      delete u._url;
    }
    groups.push({ key: g.key, name: g.name, blurb: g.blurb, units });
  }
  return groups;
}

async function crawlLeadership() {
  const html = await get(`${BASE}/web/guest/lanh-dao-va-quan-ly`);
  const body = divInner(html, "entry-content");
  return clean(body);
}

async function crawlContact() {
  const html = await get(`${BASE}/web/guest/lien-he`);
  return clean(divInner(html, "journal-content-article"));
}

async function crawlAwardIntro() {
  const html = await get(`${BASE}/web/guest/gioi-thieu-chung2`);
  return clean(divInner(html, "journal-content-article"));
}

(async () => {
  console.log("Units...");
  const groups = await crawlUnits();
  console.log("Leadership, contact, award intro...");
  const pages = {
    crawledAt: new Date().toISOString(),
    groups,
    leadership: await crawlLeadership(),
    contact: await crawlContact(),
    awardIntro: await crawlAwardIntro(),
  };
  fs.writeFileSync(path.join(OUT, "pages.json"), JSON.stringify(pages));
  const n = groups.reduce((a, g) => a + g.units.length, 0);
  console.log(`Done: ${n} units, leadership ${pages.leadership.length}B, contact ${pages.contact.length}B, award intro ${pages.awardIntro.length}B`);
})();
