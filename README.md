# VAST + Tin nóng KHCN (Demo)

Hybrid portal inspired by [vast.gov.vn](https://vast.gov.vn/) with a Báo Mới–style **Tin nóng KHCN** hub. A backend crawler pulls science/tech stories from an allowlisted set of Vietnamese sources and auto-publishes **summaries + source links** (no full-text republication).

## Stacks — local test vs prod demo

### Local test

| Layer | Technology | Details |
|-------|------------|---------|
| **Frontend** | **Next.js 15** (App Router) + React 19 + TypeScript + Tailwind CSS 4 | `make web` → http://localhost:3000 |
| **Backend** | **FastAPI** (Python) + Uvicorn + SQLAlchemy 2 | `make api` → http://localhost:8000 |
| **Database** | **SQLite** | File: `backend/data/vast_news.db` (default `DATABASE_URL=sqlite:///./data/vast_news.db`) |
| **Crawl** | Via API | `make crawl-api` → `POST /api/crawl/run` |

```text
Browser → localhost:3000 (Next.js)
              ↓ NEXT_PUBLIC_API_URL=http://localhost:8000
         localhost:8000 (FastAPI)
              ↓
         SQLite (backend/data/vast_news.db)
```

```bash
make install
make api    # terminal 1
make web    # terminal 2
# optional: make crawl-api
```

Local env:

- Backend: `backend/.env` (see `backend/.env.example`) — SQLite by default
- Frontend: `frontend/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

### Prod demo

| Layer | Technology | Details |
|-------|------------|---------|
| **Frontend** | **Next.js 15** | Vercel project, Root Directory = `frontend` |
| **Backend** | **FastAPI** (Python) | Vercel project, Root Directory = `backend` |
| **Database** | **Neon** (serverless Postgres) | `DATABASE_URL` on the backend Vercel project |
| **Hosting** | **Vercel** (monorepo → 2 projects) | Auto-deploy on push/merge to `main` |
| **Crawl** | **GitHub Actions** (every 5 min) | `POST /api/crawl/run` (variable `CRAWL_API_BASE_URL`) |

```text
Browser → Vercel (Next.js FE)
              ↓ NEXT_PUBLIC_API_URL
         Vercel (FastAPI BE)
              ↓ DATABASE_URL
            Neon Postgres

GitHub Actions (every 5 min) → POST /api/crawl/run → same Neon DB
```

Prod env:

| Project | Variable | Purpose |
|---------|----------|---------|
| Frontend (Vercel) | `NEXT_PUBLIC_API_URL` | Backend URL, e.g. `https://<api>.vercel.app` |
| Backend (Vercel) | `DATABASE_URL` | Neon Postgres connection string |
| Backend (Vercel) | `CORS_ORIGINS` / `CORS_ORIGIN_REGEX` | Optional; regex allows `*.vercel.app` by default |
| GitHub Actions | `CRAWL_API_BASE_URL` (Actions **variable**) | Backend URL for scheduled crawl |

Full deploy steps: **[DEPLOY.md](DEPLOY.md)**.

---

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
| GET | `/` | `{"message":"hello"}` |
| GET | `/api/health` | Health check |
| GET | `/api/articles/hot` | Hot feed |
| GET | `/api/articles/new` | New feed |
| GET | `/api/articles/{id}` | Summary detail + related |
| GET | `/api/topics` | Topic list |
| POST | `/api/crawl/run` | Run crawl cycle |

## Notes

- Respect publishers: store summary/metadata, always attribute and link out.
- Some RSS endpoints may be unavailable; crawler skips failing sources and continues.
