# VAST + Tin nóng KHCN (Demo)

Hybrid portal inspired by [vast.gov.vn](https://vast.gov.vn/) with a Báo Mới–style **Tin nóng KHCN** hub. A backend crawler pulls science/tech stories from an allowlisted set of Vietnamese sources and auto-publishes **summaries + source links** (no full-text republication).

## Stack

- `frontend/` — Next.js 15 (App Router) + Tailwind
- `backend/` — FastAPI + SQLAlchemy + SQLite (default) or Postgres
- `docker-compose.yml` — optional Postgres + API

## Quick start (local)

```bash
make install   # backend venv + frontend deps
make api       # terminal 1 → http://localhost:8000
make web       # terminal 2 → http://localhost:3000
```

**Automatic crawl (production):** GitHub Actions every **1 hour** → `POST /api/crawl/run`  
(set repo secret `CRAWL_API_BASE_URL`). Optional local loop: `make crawl-loop`.

## Deploy (Vercel + Neon)

See **[DEPLOY.md](DEPLOY.md)**:

- **Frontend** → Vercel project, Root Directory `frontend`
- **Backend** → Vercel project, Root Directory `backend`
- **Postgres** → Neon (`DATABASE_URL` on the backend project)
- **CI/CD** → Vercel auto-deploys on `main`
- **Crawl** → GitHub Actions hourly → backend `/api/crawl/run` (not Vercel Cron)

## Product scope (v1)

- VAST-style homepage + CTA into **Tin nóng KHCN**
- Feeds: **Nóng** (hot score) / **Mới** (recency) + topic chips
- Article page: summary on-site, **Đọc gốc** to publisher
- Allowlisted **external** VN science/tech press (RSS-first); VAST itself is not crawled
- Auto-publish (no editor queue yet)
- Related-story clustering by title similarity

Deferred: international sources + translation model.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/articles/hot` | Hot feed |
| GET | `/api/articles/new` | New feed |
| GET | `/api/articles/{id}` | Summary detail + related |
| GET | `/api/topics` | Topic list |
| POST | `/api/crawl/run` | Run crawl cycle |

## Notes

- Respect publishers: store summary/metadata, always attribute and link out.
- Some RSS endpoints may be unavailable; crawler skips failing sources and continues.
