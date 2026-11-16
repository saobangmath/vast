# Deploy to Vercel (frontend + backend) + Neon Postgres

```text
Browser → Vercel project: frontend (Next.js)
                ↓ NEXT_PUBLIC_API_URL
         Vercel project: backend (FastAPI serverless)
                ↓ DATABASE_URL
              Neon (Postgres)
         Vercel Cron → GET /api/crawl/run every 5 min
```

> In-process 5‑minute scheduler is **disabled on Vercel** (serverless). Use **Vercel Cron** (or cron-job.org) instead.

---

## 0) GitHub

```bash
# already prepared in repo — push if needed
git push -u origin main
```

---

## 1) Neon

1. Create a Neon project
2. Copy the Postgres connection string (with `sslmode=require`)
3. You will paste it into the **backend** Vercel project as `DATABASE_URL` (never commit it)

---

## 2) Vercel — Backend (FastAPI)

1. [vercel.com/new](https://vercel.com/new) → import this GitHub repo
2. Project name e.g. `vast-khcn-api`
3. **Root Directory** → `backend`
4. Framework: FastAPI / Python (auto)
5. Environment variables:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon connection string |
| `CORS_ORIGINS` | `https://<your-frontend>.vercel.app` (update after step 3) |
| `CRAWL_ON_STARTUP` | `false` (optional; cron will crawl) |

6. Deploy → copy URL, e.g. `https://vast-khcn-api.vercel.app`
7. Smoke test: `/api/health`, `/api/articles/hot`

Cron: [`backend/vercel.json`](backend/vercel.json) schedules `GET /api/crawl/run` every 5 minutes.  
**Hobby** plans may limit cron frequency (sometimes daily only) — if so, use [cron-job.org](https://cron-job.org) to hit that URL every 5 minutes, or upgrade to Pro.

---

## 3) Vercel — Frontend (Next.js)

1. **Add New Project** → same GitHub repo again
2. Project name e.g. `vast-khcn-web`
3. **Root Directory** → `frontend`
4. Environment variables:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://vast-khcn-api.vercel.app` (no trailing slash) |

5. Deploy
6. Go back to **backend** project → set `CORS_ORIGINS` to the frontend URL → Redeploy backend

---

## Local

```bash
make install && make api && make web
```

Local still uses in-process scheduler every 5 minutes (not Vercel).

---

## Checklist

- [ ] Repo on GitHub
- [ ] Neon `DATABASE_URL` on backend Vercel project
- [ ] Backend Root Directory = `backend`
- [ ] Frontend Root Directory = `frontend`
- [ ] `NEXT_PUBLIC_API_URL` → backend URL
- [ ] `CORS_ORIGINS` → frontend URL
- [ ] Cron or external ping hitting `/api/crawl/run`
