# Project Knowledge Base - Quick Reference

## What This Project Is

A **full-stack web scraping platform** for lead generation. Users can:
1. Create scrape templates with CSS/XPath selectors.
2. Run jobs to extract data from any website using multiple engines (Playwright, Cloudscraper).
3. Export data to CSV/JSON for leads.
4. Manage job lifecycles (Retry, Cancel, Delete).

## Current State

### Working ✅
- **Backend API (FastAPI)**: Full CRUD for Jobs and Templates.
- **Frontend (Next.js)**: Premium Dashboard with Dark Mode, Job management, and Template editor.
- **Database (SQLAlchemy)**: SQLite/Postgres persistence with cascaded deletions.
- **Scraping Engine**: Advanced Playwright Stealth integration with anti-bot bypass.
- **Exporting**: CSV and JSON export functionality.
- **Job Lifecycle**: Restart/Retry, Cancel, and Edit all fully functional.

### In Progress 🚧
- **Celery + Redis**: Transitioning sync job runs to a dedicated background worker queue.
- **Proxy Rotation**: Native support for residential proxy providers.
- **Detailed Logs**: Persistent history of scraper iteration logs.

### Missing Critical Pieces ❌
1. **Multi-User Auth**: JWT-based login and project isolation.
2. **Visual Selector Tool**: Browser-based point-and-click selector helper.

---

## Key Files

| File                            | Purpose                           |
| ------------------------------- | --------------------------------- |
| `backend/app/main.py`           | FastAPI app entry                 |
| `backend/app/api/routes.py`     | API endpoints & logic             |
| `backend/app/models/models.py`  | DB tables (Job, Template, Record) |
| `backend/app/scraper/engine.py` | Core Playwright Stealth logic     |
| `frontend/src/app/page.tsx`     | Main Dashboard UI & State         |
| `frontend/src/lib/api.ts`       | Type-safe API client              |

---

## Tech Stack

- **Frontend**: Next.js 14, Tailwind (Premium UI), Lucide Icons, Framer Motion.
- **Backend**: FastAPI, Python 3.11+.
- **DB**: SQLite (local) / PostgreSQL (prod).
- **Scraping**: **Playwright Stealth**, cloudscraper, BeautifulSoup.
- **Queue**: Celery + Redis (Ready for configuration).

---

## How to Run

```bash
cd webscraper-app

# Docker (Recommended)
docker-compose up --build

# Backend Manual
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend Manual
cd frontend
npm install
npm run dev
```

---

## Implementation Status

- [x] Job CRUD (Create, Read, Update, Delete)
- [x] Job Control (Run, Cancel, Restart/Retry)
- [x] Template Management (Site types, Selectors, Methods)
- [x] Stealth Scraper (Playwright Bypass)
- [x] Data Export (CSV/JSON)
- [x] Premium UI (Dark Mode, Accessibility)

---

*Last Updated: 2026-02-13*
*Maintainer: Antigravity AI Assistant*
