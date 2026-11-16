# TODO — VAST + Tin nóng KHCN

## Done (v1 demo)

- [x] Hybrid portal: VAST homepage + Tin nóng KHCN hub
- [x] FastAPI backend + Next.js frontend
- [x] Local SQLite / prod Neon Postgres
- [x] Allowlisted VN science/tech crawler (RSS) + relevance filter
- [x] Hot / New feeds, topics, related clusters, **Đọc gốc**
- [x] Deploy path: Vercel (FE + BE) + Neon
- [x] Auto crawl via GitHub Actions every 5 min → `POST /api/crawl/run`
- [x] Remove unused `backend/scripts/` CLI crawl helpers

## Next

- [ ] Confirm GitHub Actions variable `CRAWL_API_BASE_URL` is set and crawl runs green
- [ ] Confirm Vercel FE `NEXT_PUBLIC_API_URL` + BE `DATABASE_URL` (Neon)
- [ ] Optional: tighten `CORS_ORIGINS` to the exact frontend URL
- [ ] Rotate Neon credentials if they were ever exposed in chat/logs
- [ ] Push outstanding local changes (README / crawl interval / scripts removal) to `main`

## Monitoring, logs & alerts

- [ ] Centralize backend logs (Vercel Logs + structured logging; optional ship to Axiom / Better Stack / Datadog)
- [ ] Dashboard for crawl health: last run time, fetched/inserted/skipped, error rate
- [ ] Alerts when GitHub Actions crawl workflow fails (email/Slack via Actions notify or monitoring service)
- [ ] Alerts when `/api/crawl/run` or `/api/health` errors / latency spikes
- [ ] Alerts when Neon connection fails or crawl returns empty for N consecutive runs
- [ ] Track Vercel function duration/timeouts for crawl jobs
- [ ] Retain crawl run history in DB (e.g. `crawl_runs` table) for audit/debug

## International crawl + Vietnamese translation

- [ ] Allowlist foreign science/tech sources (e.g. Nature news, ScienceDaily, Phys.org, IEEE, MIT News)
- [ ] Detect source language (`original_lang`) on ingest
- [ ] Translation pipeline: title + summary → Vietnamese (MT model / API; later fine-tune)
- [ ] Store both original and VN fields (`title`, `summary`, `translated_title`, `translated_summary`)
- [ ] Hub UX: show Vietnamese by default; optional “Xem bản gốc”
- [ ] Quality checks: skip/flag bad translations before publish
- [ ] Rate limits + robots/ToS compliance for foreign publishers

## Product (later)

- [ ] Admin moderation queue (approve before publish) — currently auto-publish
- [ ] Better related clustering (embeddings vs title Jaccard)
- [ ] More / better VN science-tech sources (replace weak RSS feeds)
- [ ] Search + pagination UX on the hub
- [ ] Official VAST CMS content joined into the hub (not crawled)

## Database indexes (query performance)

Single-column indexes already exist on common FKs / sort keys (`source_id`, `topic_id`, `cluster_id`, `published_at`, `hot_score`, `sources.key`, `topics.slug`). Still TODO:

- [ ] Composite index for Hot feed: `(hot_score DESC, published_at DESC)`
- [ ] Composite index for New feed: `(published_at DESC, id DESC)`
- [ ] Composite index for topic-filtered Hot: `(topic_id, hot_score DESC, published_at DESC)`
- [ ] Composite index for topic-filtered New: `(topic_id, published_at DESC)`
- [ ] Index on `canonical_url` (lookup/dedupe beyond unique constraint alone on some engines)
- [ ] Index on `clusters.updated_at` if listing/rebuilding clusters by recency
- [ ] Full-text / trigram indexes for search (when hub search lands; Postgres `tsvector` / `pg_trgm` on Neon)
- [ ] Review `EXPLAIN ANALYZE` on `/api/articles/hot|new` against Neon after data grows
- [ ] Migration path (Alembic) so index changes apply cleanly on Neon (not only `create_all`)

## Ops / polish

- [ ] Strip or downrank non-tech noise further in `relevance.py`
- [ ] Ignored Build Step on Vercel monorepo (FE vs BE path filters)
