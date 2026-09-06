# Implementation Guide & Architecture Reference

## Current State: Phase 1 Complete ✅

The core platform is functional and verified. The following critical features are now live:
1. **Dynamic Job Management**: Create, Edit, Delete, Run, Cancel, and Restart jobs.
2. **Template System**: Reusable selectors and scraping method configurations.
3. **Advanced Playwright Engine**: Stealth-enabled scraping with anti-bot bypass.
4. **Data Export**: Immediate CSV and JSON downloads.
5. **Premium UI**: Dark Mode, accessible charts, and responsive dashboard.

---

## Future Roadmap: Phase 2 & Beyond

### Step 1: Decentralized Async Queueing (Next Priority) 🚧

**Current Logic:** Scraping runs in a synchronous (but non-blocking) loop inside the FastAPI process.
**Goal:** Distribute jobs to separate Celery workers to scale throughput.

**File to Create:** `backend/app/celery_app.py`
**File to Modify:** `backend/app/api/routes.py` (change `run_job` to call `.delay()`)

### Step 2: Proxy Rotation Middleware

**Goal:** Integrate a provider like Bright Data or Oxylabs to bypass IP-level restrictions.

**Implementation Logic:**
- Add `proxy_url` to Template model.
- Update `ScraperEngine.playwright_scrape` to launch browser with `--proxy-server` argument.

### Step 3: Visual Selector Overlay

**Goal:** Allow users to pick selectors without opening DevTools.

**Concept:**
- Use a dedicated microservice to render the target site in an iframe.
- Inject a script to capture element paths and return them to the Template editor.

---

## Technical Maintenance

### Updating Dependencies
Ensure Playwright is updated regularly to match modern browser fingerprints:
```bash
docker exec -it webscraper-app-backend-1 playwright install chromium
```

### Database Management
To review raw data or fix dangling jobs:
```sql
UPDATE jobs SET status = 'failed' WHERE status = 'running'; -- Reset stuck jobs
DELETE FROM records WHERE job_id NOT IN (SELECT id FROM jobs); -- Cleanup
```

---

## Code Reference Summary

| Feature         | Primary logic Location                                 |
| --------------- | ------------------------------------------------------ |
| UI Theme Logic  | `frontend/src/app/page.tsx` (useEffect/toggleDarkMode) |
| Stealth Engine  | `backend/app/scraper/engine.py` (ScraperEngine class)  |
| API Layer       | `backend/app/api/routes.py` (FastAPI Routers)          |
| Template Export | `backend/app/api/routes.py` (export_csv/export_json)   |
| Model Schema    | `backend/app/models/models.py` (SQLAlchemy Classes)    |

---

*Last Updated: 2026-02-13*
*Status: V1 Core verified. Scaling prioritized for V2.*
