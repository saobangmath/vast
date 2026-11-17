// Crawl the paper lists of top venues (CORE A* conferences, Q1 journals) from their OFFICIAL sources.
//   CVPR/ICCV         openaccess.thecvf.com        ECCV     ecva.net
//   ACL/EMNLP/NAACL   ACL Anthology (XML on GitHub)
//   NeurIPS / ICLR    papers.nips.cc / proceedings.iclr.cc      ICML  proceedings.mlr.press
//   Nature/Science/Cell/IJCV   Crossref (metadata deposited by the publishers)
// Output: frontend/content/papers/papers.json (committed; a few crawls per year are enough).
// Usage: node scripts/crawl-papers.mjs [slug-year ...]   e.g. node scripts/crawl-papers.mjs cvpr-2025 nature-2025
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "frontend", "content", "papers", "papers.json");
const UA = "Mozilla/5.0 (compatible; vast-portal-demo/1.0; academic metadata crawler)";
const FROM_YEAR = 2025;

const D = {
  ai: "Trí tuệ nhân tạo",
  cv: "Thị giác máy tính",
  nlp: "Xử lý ngôn ngữ tự nhiên",
  ml: "Học máy",
  robot: "Robot & điều khiển",
  bio: "Y sinh & sự sống",
  phys: "Vật lý & lượng tử",
  mat: "Vật liệu & hóa học",
  earth: "Trái đất & môi trường",
  space: "Thiên văn & vũ trụ",
  other: "Khoa học khác",
};

// ---- venues -----------------------------------------------------------------------------------
const VENUES = [
  { slug: "cvpr", name: "CVPR", full: "IEEE/CVF Conference on Computer Vision and Pattern Recognition", kind: "conference", tier: "A*", defaultDomain: "cv" },
  { slug: "iccv", name: "ICCV", full: "IEEE/CVF International Conference on Computer Vision", kind: "conference", tier: "A*", defaultDomain: "cv" },
  { slug: "eccv", name: "ECCV", full: "European Conference on Computer Vision", kind: "conference", tier: "A*", defaultDomain: "cv" },
  { slug: "acl", name: "ACL", full: "Annual Meeting of the Association for Computational Linguistics", kind: "conference", tier: "A*", defaultDomain: "nlp" },
  { slug: "emnlp", name: "EMNLP", full: "Empirical Methods in Natural Language Processing", kind: "conference", tier: "A*", defaultDomain: "nlp" },
  { slug: "naacl", name: "NAACL", full: "North American Chapter of the Association for Computational Linguistics", kind: "conference", tier: "A*", defaultDomain: "nlp" },
  { slug: "neurips", name: "NeurIPS", full: "Conference on Neural Information Processing Systems", kind: "conference", tier: "A*", defaultDomain: "ml", classify: true },
  { slug: "icml", name: "ICML", full: "International Conference on Machine Learning", kind: "conference", tier: "A*", defaultDomain: "ml", classify: true },
  { slug: "iclr", name: "ICLR", full: "International Conference on Learning Representations", kind: "conference", tier: "A*", defaultDomain: "ml", classify: true },
  { slug: "ijcv", name: "IJCV", full: "International Journal of Computer Vision", kind: "journal", tier: "Q1", defaultDomain: "cv", issn: "0920-5691" },
  { slug: "nature", name: "Nature", full: "Nature", kind: "journal", tier: "Q1", defaultDomain: "other", classify: true, issn: "0028-0836", accept: (w) => /^10\.1038\/s41586-/.test(w.doi) },
  { slug: "science", name: "Science", full: "Science", kind: "journal", tier: "Q1", defaultDomain: "other", classify: true, issn: "0036-8075", accept: (w) => w.nAuthors >= 3 },
  { slug: "cell", name: "Cell", full: "Cell", kind: "journal", tier: "Q1", defaultDomain: "bio", classify: true, issn: "0092-8674", accept: (w) => w.nAuthors >= 4 },
];
const bySlug = Object.fromEntries(VENUES.map((v) => [v.slug, v]));

// (slug, year, month of the event)
const JOBS = [
  ["cvpr", 2025, 6], ["cvpr", 2026, 6],
  ["iccv", 2025, 10],
  ["eccv", 2024, 9],
  ["acl", 2025, 7], ["acl", 2026, 7],
  ["emnlp", 2025, 11],
  ["naacl", 2025, 4],
  ["neurips", 2025, 12],
  ["icml", 2025, 7],
  ["iclr", 2025, 4], ["iclr", 2026, 4],
  ["ijcv", 2025, 0], ["nature", 2025, 0], ["science", 2025, 0], ["cell", 2025, 0],
];

// ---- helpers ----------------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "*/*" }, signal: AbortSignal.timeout(120000) });
      if (res.status === 429 || res.status >= 500) throw new Error("HTTP " + res.status);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.text();
    } catch (e) {
      if (i === tries - 1) throw new Error(`${url}: ${e.message}`);
      await sleep(2000 * (i + 1));
    }
  }
}
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, n) => ENT[n])
    .replace(/&amp;/g, "&");
const clean = (s) => decode(decode(s.replace(/<[^>]+>/g, ""))).replace(/\s+/g, " ").trim();

// ---- domain tagging ---------------------------------------------------------------------------
const RX = {
  robot: /\b(robot\w*|manipulat\w+|locomotion|autonomous driving|navigation|control polic\w+|embodied|reinforcement learning|motion planning)\b/gi,
  cv: /\b(image\w*|video\w*|visual\w*|vision|3d|point clouds?|segmentation|object detection|camera|depth|pose|rendering|nerf|gaussian splatting|diffusion models?|face|pixel\w*|multimodal|text-to-image)\b/gi,
  nlp: /\b(language models?|llms?|text|translation|question answering|dialogue|reasoning|prompt\w*|tokens?|summari[sz]\w+|retrieval|nlp|speech|multilingual|instruction)\b/gi,
  bio: /\b(cancer|patients?|cells?|genes?|genom\w+|proteins?|disease|virus|viral|immun\w+|clinical|brain|neuron\w*|bacteri\w+|dna|rna|tumou?rs?|mice|mouse|vaccine|antibod\w+|metabol\w+|stem|embryo\w*|infection|neural circuit|synap\w+|human|plants?|crops?|evolution\w*|genetic\w*|ecolog\w+|flowering|fish|birds?|insects?|yeast|organisms?)\b/gi,
  phys: /\b(quantum|superconduct\w+|photon\w*|spin|qubits?|laser|magnetic|topological|electron\w*|plasma|boson|fermion|lattice|entangle\w+|optical|particle)\b/gi,
  mat: /\b(catalys\w+|polymer\w*|batter\w+|molecul\w+|synthesis|perovskite|crystal\w*|alloy|nanomaterial\w*|chemical|electrolyte|solar cell|semiconductor|oxide|graphene|reaction|material\w*)\b/gi,
  earth: /\b(climate|ocean\w*|ice sheet|glacier|carbon|earthquake|seismic|species|ecosystem\w*|forest|biodiversity|atmospher\w+|warming|sea level|soil|river|drought|fossil|volcan\w+)\b/gi,
  space: /\b(galax\w+|stars?|stellar|black holes?|exoplanet\w*|telescope|cosmic|cosmolog\w+|mars|planet\w*|supernova|gravitational wave|solar system|asteroid|dark matter|universe)\b/gi,
  ai: /\b(machine learning|deep learning|neural networks?|artificial intelligence|transformers?|large language|foundation model)\b/gi,
};
const count = (rx, s) => (s.match(rx) || []).length;
function classify(venue, title, abstract = "") {
  const s = `${title} ${abstract}`;
  if (!venue.classify) return venue.defaultDomain;
  if (venue.kind === "conference") {
    const r = count(RX.robot, s), c = count(RX.cv, s), n = count(RX.nlp, s), b = count(RX.bio, s);
    const best = Math.max(r, c, n, b);
    if (best < 1) return "ml";
    if (b === best && b > 1) return "bio";
    if (r === best) return "robot";
    if (c >= n) return "cv";
    return "nlp";
  }
  const scores = ["bio", "phys", "mat", "earth", "space", "ai"].map((k) => [k, count(RX[k], s)]);
  scores.sort((a, b) => b[1] - a[1]);
  if (scores[0][1] < 1) return venue.defaultDomain;
  return scores[0][0];
}

// ---- crawlers: each returns [{title, authors[], url, abstract?, doi?, month?}] ----------------
async function cvf(conf, year) {
  const html = await get(`https://openaccess.thecvf.com/${conf}${year}?day=all`);
  const out = [];
  for (const blk of html.split('<dt class="ptitle"').slice(1)) {
    const m = blk.match(/<a href="([^"]+)">([\s\S]*?)<\/a>/);
    if (!m) continue;
    const authors = [...blk.matchAll(/name="query_author" value="([^"]+)"/g)].map((x) => clean(x[1]));
    out.push({ title: clean(m[2]), authors, url: new URL(m[1], "https://openaccess.thecvf.com").href });
  }
  return out;
}

async function eccv(year) {
  const html = await get("https://www.ecva.net/papers.php");
  const out = [];
  for (const blk of html.split('<dt class="ptitle"').slice(1)) {
    const m = blk.match(/<a href=([^>\s]+)>\s*([\s\S]*?)<\/a>/);
    if (!m || !m[1].includes(`eccv_${year}`)) continue;
    const au = blk.match(/<\/dt>\s*<dd>\s*([\s\S]*?)<\/dd>/);
    const doi = blk.match(/href="(https:\/\/link\.springer\.com[^"]+)"/);
    out.push({
      title: clean(m[2]),
      authors: au ? clean(au[1]).replace(/\*/g, "").split(/\s*,\s*/).filter(Boolean) : [],
      url: doi ? doi[1] : new URL(m[1], "https://www.ecva.net/").href,
    });
  }
  return out;
}

async function anthology(collection, year) {
  const xml = await get(`https://raw.githubusercontent.com/acl-org/acl-anthology/master/data/xml/${year}.${collection}.xml`);
  const out = [];
  for (const vol of xml.matchAll(/<volume id="([^"]+)"[^>]*>([\s\S]*?)<\/volume>/g)) {
    if (!/^(long|short|main|industry)$/.test(vol[1])) continue; // main proceedings only (no Findings/workshops)
    const mm = vol[2].match(/<month>([^<]+)<\/month>/);
    for (const p of vol[2].matchAll(/<paper id="(\d+)">([\s\S]*?)<\/paper>/g)) {
      if (p[1] === "0") continue;
      const title = p[2].match(/<title>([\s\S]*?)<\/title>/);
      if (!title) continue;
      const authors = [...p[2].matchAll(/<author[^>]*>\s*(?:<first>([\s\S]*?)<\/first>)?\s*<last>([\s\S]*?)<\/last>/g)].map((a) => clean(`${a[1] || ""} ${a[2]}`));
      const abs = p[2].match(/<abstract>([\s\S]*?)<\/abstract>/);
      out.push({ title: clean(title[1]), authors, abstract: abs ? clean(abs[1]) : "", url: `https://aclanthology.org/${year}.${collection}-${vol[1]}.${p[1]}/`, monthName: mm?.[1] });
    }
  }
  return out;
}

async function nipsStyle(host, year, sub = "") {
  const html = await get(`https://${host}/paper_files/paper/${year}${sub}`);
  const out = [];
  for (const li of html.split("<li").slice(1)) {
    const m = li.match(/<a title="paper title" href="([^"]+)">([\s\S]*?)<\/a>/);
    if (!m) continue;
    const au = li.match(/<span class="paper-authors">([\s\S]*?)<\/span>/);
    out.push({
      title: clean(m[2]),
      authors: au ? clean(au[1]).split(/\s*,\s*/).filter(Boolean) : [],
      url: new URL(m[1], `https://${host}`).href,
    });
  }
  return out;
}

async function pmlr(volume) {
  const html = await get(`https://proceedings.mlr.press/v${volume}/`);
  const out = [];
  for (const blk of html.split('<div class="paper">').slice(1)) {
    const t = blk.match(/<p class="title">([\s\S]*?)<\/p>/);
    const u = blk.match(/<a href="(https:\/\/proceedings\.mlr\.press\/v\d+\/[^"]+\.html)">abs<\/a>/);
    const a = blk.match(/<span class="authors">([\s\S]*?)<\/span>/);
    if (!t || !u) continue;
    out.push({ title: clean(t[1]), authors: a ? clean(a[1]).split(/\s*,\s*/).filter(Boolean) : [], url: u[1] });
  }
  return out;
}

async function crossref(v, year) {
  const out = [];
  let cursor = "*";
  for (let page = 0; page < 40; page++) {
    const url =
      `https://api.crossref.org/journals/${v.issn}/works?filter=from-pub-date:${year}-01-01,type:journal-article` +
      `&rows=1000&cursor=${encodeURIComponent(cursor)}&select=DOI,title,author,issued,URL,abstract`;
    const j = JSON.parse(await get(url));
    const items = j.message.items;
    if (!items.length) break;
    for (const w of items) {
      const title = clean((w.title || [""])[0] || "");
      if (title.length < 20) continue;
      const authors = (w.author || []).map((a) => `${a.given || ""} ${a.family || a.name || ""}`.trim()).filter(Boolean);
      const dp = w.issued?.["date-parts"]?.[0] || [];
      const rec = { title, authors, url: w.URL, doi: w.DOI, abstract: w.abstract ? clean(w.abstract) : "", year: dp[0], month: dp[1] };
      if (v.accept && !v.accept({ doi: w.DOI, nAuthors: authors.length })) continue;
      out.push(rec);
    }
    cursor = j.message["next-cursor"];
    if (!cursor) break;
    await sleep(300);
  }
  return out;
}

const MONTHS = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };

async function run(slug, year) {
  switch (slug) {
    case "cvpr": return cvf("CVPR", year);
    case "iccv": return cvf("ICCV", year);
    case "eccv": return eccv(year);
    case "acl": case "emnlp": case "naacl": return anthology(slug, year);
    case "neurips": return nipsStyle("papers.nips.cc", year, "/vol38-main-conference"); // NeurIPS 2025 = vol. 38
    case "iclr": return nipsStyle("proceedings.iclr.cc", year);
    case "icml": return pmlr(267); // ICML 2025
    default: return crossref(bySlug[slug], year);
  }
}

// ---- main -------------------------------------------------------------------------------------
const only = process.argv.slice(2);
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { items: [] };
const keep = only.length ? prev.items.filter((p) => !only.includes(`${p.venue}-${p.eventYear}`)) : [];
const items = [...keep];
for (const [slug, year, evMonth] of JOBS) {
  const key = `${slug}-${year}`;
  if (only.length && !only.includes(key)) continue;
  const v = bySlug[slug];
  process.stdout.write(`${key} ... `);
  try {
    const rows = await run(slug, year);
    const seen = new Set();
    let n = 0;
    for (const r of rows) {
      if (!r.title || seen.has(r.url)) continue;
      seen.add(r.url);
      const domainKey = classify(v, r.title, r.abstract);
      const y = r.year || year;
      const m = r.month || (r.monthName && MONTHS[r.monthName]) || evMonth || 1;
      items.push({
        id: crypto.createHash("sha1").update(r.url).digest("hex").slice(0, 12),
        title: r.title,
        authors: r.authors.slice(0, 6).join(", ") + (r.authors.length > 6 ? ` và ${r.authors.length - 6} tác giả khác` : ""),
        venue: slug,
        eventYear: year,
        year: y,
        month: m,
        domain: D[domainKey],
        url: r.url,
      });
      n++;
    }
    console.log(n);
  } catch (e) {
    console.log("FAILED", e.message);
  }
}
items.sort((a, b) => b.year - a.year || b.month - a.month || a.title.localeCompare(b.title));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  JSON.stringify({ generated: new Date().toISOString().slice(0, 10), venues: VENUES.map(({ slug, name, full, kind, tier }) => ({ slug, name, full, kind, tier })), items }),
);
const stat = {};
for (const p of items) stat[p.venue] = (stat[p.venue] || 0) + 1;
console.log("total", items.length, stat, (fs.statSync(OUT).size / 1e6).toFixed(1) + " MB");
