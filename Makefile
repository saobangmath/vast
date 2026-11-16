# VAST + Tin nóng KHCN — local convenience targets
ROOT := $(CURDIR)
BACKEND := $(ROOT)/backend
FRONTEND := $(ROOT)/frontend
VENV := $(BACKEND)/.venv
PY := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
UVICORN := $(VENV)/bin/uvicorn

API_HOST ?= 127.0.0.1
API_PORT ?= 8000
WEB_PORT ?= 3000

.PHONY: help install install-backend install-frontend api web crawl-status crawl-api docker-up docker-down health check clean

help:
	@echo "VAST Tin nóng KHCN — make targets"
	@echo ""
	@echo "  make install       Install backend venv + frontend npm deps"
	@echo "  make api           Run FastAPI with reload on :$(API_PORT)"
	@echo "  make web           Run Next.js dev server on :$(WEB_PORT)"
	@echo "  make crawl-api     Trigger one crawl via POST /api/crawl/run"
	@echo "  make crawl-status  Show crawl status via API"
	@echo "  make health        Hit /api/health"
	@echo "  make check         Smoke-test hot/new/topics APIs"
	@echo "  make docker-up     Start Postgres + API via docker compose"
	@echo "  make docker-down   Stop docker compose stack"
	@echo "  make clean         Remove caches / build artifacts"
	@echo ""
	@echo "Typical local flow:"
	@echo "  make install && make api    # terminal 1 — API"
	@echo "  make web                    # terminal 2 — UI"
	@echo "  make crawl-api              # optional one-shot crawl (API must be up)"
	@echo "  (production crawl: GitHub Actions every 15 min → /api/crawl/run)"

install: install-backend install-frontend

install-backend:
	@test -x $(PY) || python3 -m venv $(VENV)
	$(PIP) install -r $(BACKEND)/requirements.txt

install-frontend:
	cd $(FRONTEND) && npm install

api:
	cd $(BACKEND) && $(UVICORN) app.main:app --reload --host $(API_HOST) --port $(API_PORT)

web:
	cd $(FRONTEND) && npm run dev -- --port $(WEB_PORT)

crawl-status:
	curl -s http://$(API_HOST):$(API_PORT)/api/crawl/status | python3 -m json.tool

crawl-api:
	curl -s -X POST http://$(API_HOST):$(API_PORT)/api/crawl/run | python3 -m json.tool

health:
	curl -s http://$(API_HOST):$(API_PORT)/api/health | python3 -m json.tool

check:
	@echo "== health ==" && $(MAKE) --no-print-directory health
	@echo "== hot ==" && curl -s "http://$(API_HOST):$(API_PORT)/api/articles/hot?page_size=2" | python3 -c "import sys,json; d=json.load(sys.stdin); print('total=%s sample=%s' % (d['total'], (d['items'][0]['title'][:70] if d['items'] else '(empty)')))"
	@echo "== new ==" && curl -s "http://$(API_HOST):$(API_PORT)/api/articles/new?page_size=2" | python3 -c "import sys,json; d=json.load(sys.stdin); print('total=%s sample=%s' % (d['total'], (d['items'][0]['title'][:70] if d['items'] else '(empty)')))"
	@echo "== topics ==" && curl -s http://$(API_HOST):$(API_PORT)/api/topics | python3 -c "import sys,json; print(len(json.load(sys.stdin)), 'topics')"

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

clean:
	rm -rf $(FRONTEND)/.next $(BACKEND)/__pycache__ $(BACKEND)/app/**/__pycache__ $(BACKEND)/.pytest_cache
	find $(BACKEND) -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null || true
