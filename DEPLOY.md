# Deploy: Vercel (frontend + backend) + Neon + auto-deploy on `main`

```text
merge/push to main (GitHub)
        ↓
   Vercel Git integration
        ├─ project: frontend  (Root = frontend/)
        └─ project: backend   (Root = backend/)
                ↓
              Neon Postgres
```

No GitHub Actions required for deploy — Vercel deploys automatically when `main` updates.

### Chicken-and-egg URLs (`NEXT_PUBLIC_API_URL` ↔ `CORS_ORIGINS`)

You do **not** need both URLs on day one. Use this order:

1. **Deploy backend first** with only `DATABASE_URL`  
   - CORS already allows `https://*.vercel.app` via `CORS_ORIGIN_REGEX` (built-in default)  
   - Exact `CORS_ORIGINS` can wait
2. Copy backend URL → **deploy frontend** with `NEXT_PUBLIC_API_URL=<backend-url>`
3. (Optional later) set `CORS_ORIGINS` to the exact frontend URL for tighter lockdown

Note: most listing pages fetch on the **Next.js server**, so CORS often does not matter for the first demo. `NEXT_PUBLIC_API_URL` is the one you must set after the backend URL exists.

---

## 1) Neon

1. Create a Neon project
2. Copy the Postgres URL (`sslmode=require`)
3. Use it only as a Vercel **backend** env var `DATABASE_URL` (never commit it)

---

## 2) Vercel — Backend first (auto-deploy)

1. Open [vercel.com/new](https://vercel.com/new)
2. **Import** your GitHub repo
3. Configure:
   - **Project Name:** e.g. `vast-khcn-api`
   - **Root Directory:** `backend` (Edit → select folder)
   - **Framework Preset:** FastAPI / Other (auto-detect is fine)
   - **Production Branch:** `main`
4. **Environment Variables** (first deploy):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Neon connection string |
| `CRAWL_ON_STARTUP` | `false` |

Skip `CORS_ORIGINS` for now (regex covers `*.vercel.app`).

5. Deploy → copy the URL (e.g. `https://vast-khcn-api.vercel.app`)
6. Confirm: `/api/health`

Cron: `backend/vercel.json` calls `GET /api/crawl/run` every 5 minutes.  
Hobby may limit cron frequency — use [cron-job.org](https://cron-job.org) if needed.

### Optional: only rebuild backend when backend files change

**Project Settings → Git → Ignored Build Step:**

```bash
git diff --quiet HEAD^ HEAD -- ./backend
```

(Exit `0` = skip build; exit `1` = build.)

---

## 3) Vercel — Frontend second (auto-deploy)

1. **Add New Project** → import the **same** GitHub repo again
2. Configure:
   - **Project Name:** e.g. `vast-khcn-web`
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
   - **Production Branch:** `main`
3. **Environment Variables** (now you know the backend URL):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | `https://vast-khcn-api.vercel.app` (no trailing slash) |

4. Deploy → open the site
5. Optional harden: backend → set `CORS_ORIGINS=https://vast-khcn-web.vercel.app` → Redeploy

### Optional: only rebuild frontend when frontend files change

**Ignored Build Step:**

```bash
git diff --quiet HEAD^ HEAD -- ./frontend
```

---

## 4) Verify CI/CD

1. Merge a PR into `main` (or push to `main`)
2. In each Vercel project → **Deployments**: a new Production deployment should start
3. GitHub commit should show a Vercel status check (after the GitHub integration is authorized)

If deploys do not start:

- Vercel project → **Settings → Git**: repo connected, Production Branch = `main`
- GitHub → repo **Settings → Integrations / Applications**: Vercel has access
- You used **Root Directory** correctly (`frontend` / `backend`)

---

## Local

```bash
make install && make api && make web
```

Local API still uses the in-process 5‑minute scheduler. On Vercel that scheduler is off; Cron hits `/api/crawl/run` instead.

---

## Checklist

- [ ] GitHub repo connected to Vercel (twice: FE + API)
- [ ] Backend Root Directory = `backend`
- [ ] Frontend Root Directory = `frontend`
- [ ] Production Branch = `main` on both
- [ ] `DATABASE_URL` on backend
- [ ] `NEXT_PUBLIC_API_URL` on frontend
- [ ] `CORS_ORIGINS` = frontend URL on backend
- [ ] Push/merge to `main` creates two Production deployments
