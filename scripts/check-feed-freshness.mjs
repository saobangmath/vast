#!/usr/bin/env node
// Is the backend crawl working? Read-only (never triggers a crawl).
//
//   node scripts/check-feed-freshness.mjs https://vast-vert.vercel.app
//   API_BASE=http://localhost:8000 node scripts/check-feed-freshness.mjs
//
// 1) Reads GET /api/health -> crawl.healthy (a crawl finished OK in the last 15 minutes).
// 2) Older backends without that field: falls back to comparing the newest article in the DB with
//    the newest item of the outlets' RSS feeds (approximate: the backend keeps only science/tech news).
// Exit code 0 = OK, 1 = problem (usable in a monitor).

const API = (process.argv[2] || process.env.API_BASE || "http://localhost:8000").replace(/\/$/, "");
const FEEDS = {
  "vnexpress-khoahoc": "https://vnexpress.net/rss/khoa-hoc.rss",
  "tuoitre-khoahoc": "https://tuoitre.vn/rss/khoa-hoc.rss",
  "thanhnien-congnghe": "https://thanhnien.vn/rss/cong-nghe.rss",
  "vietnamnet-khoahoc": "https://vietnamnet.vn/rss/khoa-hoc.rss",
  "genk-ict": "https://genk.vn/rss/tin-ict.rss",
};
const ago = (ms) => {
  const m = Math.round((Date.now() - ms) / 60000);
  return m < 90 ? `${m} phút` : `${(m / 60).toFixed(1)} giờ`;
};
const get = async (path) => {
  const r = await fetch(API + path, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`${path} -> HTTP ${r.status}`);
  return r.json();
};

console.log(`Backend: ${API}   (giờ hiện tại ${new Date().toISOString().slice(0, 19)}Z)\n`);
const health = await get("/api/health");
const c = health.crawl || {};

if ("healthy" in c) {
  // ---- 1) persisted crawl history ----
  const last = c.last_success_at ? `${c.minutes_since_last_success} phút trước (${c.last_success_at.slice(0, 19)}Z)` : "chưa lần nào";
  console.log(`Crawl thành công gần nhất : ${last}`);
  console.log(`Lần chạy mới nhất         : bắt đầu ${c.last_started_at ?? "-"} | kết thúc ${c.last_finished_at ?? "(chưa xong)"} | đang chạy: ${c.running}`);
  console.log(`Kết quả lần mới nhất      : ${c.last_stats ? JSON.stringify(c.last_stats) : "-"}`);
  if (c.last_error) console.log(`Lỗi lần mới nhất          : ${c.last_error}`);
  console.log(
    c.healthy
      ? "\n=> OK: crawl chạy đều (có lượt thành công trong 15 phút qua)."
      : "\n=> CÓ VẤN ĐỀ: không có lượt crawl thành công nào trong 15 phút qua. Kiểm tra GitHub Actions (Crawl every 5 minutes) và log Vercel.",
  );
  process.exit(c.healthy ? 0 : 1);
}

// ---- 2) fallback: compare DB with RSS ----
console.log("(Backend chưa có lịch sử crawl trong /api/health -> so sánh với RSS, chỉ mang tính tham khảo)\n");
const { items, total } = await get("/api/articles/new?page_size=50");
const ts = (s) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + "Z").getTime();
const dbNewest = Math.max(0, ...items.filter((a) => a.published_at).map((a) => ts(a.published_at)));
let feedNewest = 0;
for (const [key, url] of Object.entries(FEEDS)) {
  try {
    const x = await (await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000) })).text();
    const ds = [...x.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map((m) => new Date(m[1]).getTime()).filter(Boolean);
    const top = ds.length ? Math.max(...ds) : 0;
    feedNewest = Math.max(feedNewest, top);
    console.log(`  RSS ${key.padEnd(20)} mới nhất ${top ? ago(top) + " trước" : "?"}`);
  } catch (e) {
    console.log(`  RSS ${key.padEnd(20)} lỗi: ${e.message}`);
  }
}
console.log(`\nDB: ${total} bài, bài mới nhất ${dbNewest ? ago(dbNewest) + " trước" : "chưa có"} | RSS có bài mới nhất ${feedNewest ? ago(feedNewest) + " trước" : "?"}`);
const lagMin = Math.round((feedNewest - dbNewest) / 60000);
const stale = lagMin > 180 && Date.now() - feedNewest < 60 * 60000;
console.log(stale ? `=> CÓ THỂ CHƯA CẬP NHẬT: DB tụt ${(lagMin / 60).toFixed(1)} giờ so với RSS.` : "=> Chưa thấy dấu hiệu tụt hậu rõ rệt.");
process.exit(stale ? 1 : 0);
