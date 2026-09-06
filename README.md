# Web Scraper Platform

A comprehensive full-stack web scraping platform for lead generation and data extraction from any website (e-commerce, Google Maps, business directories).

## Overview

This platform enables users to:
- Configure and run web scraping jobs with custom CSS selectors
- Extract structured data from any website
- Save reusable templates for different website types
- View analytics and job history
- Export scraped data to CSV/JSON
- Scale with distributed workers and proxy rotation

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│    Next.js Dashboard - Configure jobs, view results             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API
┌───────────────────────────▼─────────────────────────────────────┐
│                         BACKEND                                 │
│    FastAPI (Python) - Job management, scheduling, API           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Workers     │   │   Database    │   │   Storage     │
│  (Playwright) │   │  (PostgreSQL) │   │  (S3/Files)   │
│  Scrapy       │   │               │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
```

## Tech Stack

| Layer          | Technology                          | Reason                                  |
| -------------- | ----------------------------------- | --------------------------------------- |
| Frontend       | Next.js 14 + Tailwind CSS + Lucide  | Modern, SSR, premium iconography        |
| UI/UX          | Dark Mode + Framer-like transitions | High-end user experience, accessibility |
| Backend        | FastAPI + Python                    | Excellent scraping ecosystem, async     |
| Database       | PostgreSQL / SQLite                 | Structured data, relationships          |
| Task Queue     | Celery + Redis                      | Background scraping jobs                |
| Scraping       | Playwright (Stealth), cloudscraper  | Bypassing bot protection, JS rendering  |
| Infrastructure | Docker + Docker Compose             | Easy deployment                         |

## Project Structure

```
webscraper-app/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/routes.py       # REST API endpoints
│   │   ├── core/               # Config & database
│   │   ├── models/             # SQLAlchemy models
│   │   ├── services/           # Business logic
│   │   └── scraper/            # Scraping engine
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/                # Pages & components
│   │   ├── lib/                # API client
│   │   └── types/              # TypeScript types
│   └── package.json
│
├── knowledge-base/              # Project documentation & artifacts
│   ├── Plan_01.md             # Original project plan
│   ├── scraping-technicalities.md  # Technical deep-dive
│   └── additional-suggestion-&-info.md  # Gaps & improvements
│
├── docker-compose.yml          # Container orchestration
├── README.md                  # This file
└── PROJECT_PLAN.md            # Detailed project plan
```

---

## Types of Web Scraping Supported

| Type             | Description                 | Tools Used               |
| ---------------- | --------------------------- | ------------------------ |
| Static           | Server-rendered HTML        | requests + BeautifulSoup |
| Dynamic          | JavaScript-rendered content | Playwright               |
| API-Based        | Extract from JSON endpoints | httpx                    |
| DOM-Based        | CSS/XPath selectors         | BeautifulSoup, lxml      |
| Headless Browser | Full browser automation     | Playwright, Puppeteer    |
| Distributed      | Multi-machine crawling      | Celery workers           |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)
- Redis (for task queue)

### Installation

#### Option 1: Docker Compose (Recommended)

```bash
# Navigate to project
cd webscraper-app

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

#### Option 2: Manual Setup

**Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## Features

### Dashboard

- [x] Statistics overview (total jobs, completed, failed, records)
- [x] Job status distribution pie chart
- [x] Recent jobs list with quick actions
- [x] Dark Mode support (System/Manual toggle)

### Jobs Management

- [x] Create new scrape job with template selection
- [x] Run job manually (Sync/Async ready)
- [x] View job records in optimized table
- [x] Job status tracking (pending, running, completed, failed, cancelled)
- [x] Edit job configuration with modal
- [x] Delete jobs with cascaded record cleanup
- [x] Robust Restart/Retry for Failed & Cancelled jobs
- [x] Cancel running jobs immediately
- [x] Detailed Error message display with UI alerts

### Templates

- [x] Create scrape templates with JSON selectors
- [x] Store CSS/XPath-ready selectors
- [x] Support for different site types (generic, ecommerce, directory, etc.)
- [x] Scraping method selection (Playwright, Cloudscraper, Requests)
- [x] Edit and Delete template management

### Data & Export

- [x] Export to CSV with automatic filename generation
- [x] Export to JSON (full record dump)
- [x] Data preview table with high-contrast text and dark mode support
- [ ] Field mapping and advanced filtering

---

## API Endpoints

| Method | Endpoint                 | Description             |
| ------ | ------------------------ | ----------------------- |
| GET    | `/api/analytics`         | Get platform statistics |
| GET    | `/api/jobs`              | List all jobs           |
| POST   | `/api/jobs`              | Create new job          |
| GET    | `/api/jobs/{id}`         | Get job details         |
| PUT    | `/api/jobs/{id}`         | Update job              |
| DELETE | `/api/jobs/{id}`         | Delete job              |
| POST   | `/api/jobs/{id}/run`     | Run a job               |
| POST   | `/api/jobs/{id}/cancel`  | Cancel running job      |
| POST   | `/api/jobs/{id}/retry`   | Reset and Restart job   |
| GET    | `/api/jobs/{id}/records` | Get job records         |
| GET    | `/api/jobs/{id}/logs`    | Get job execution logs  |
| GET    | `/api/templates`         | List templates          |
| POST   | `/api/templates`         | Create template         |
| GET    | `/api/templates/{id}`    | Get template            |
| PUT    | `/api/templates/{id}`    | Update template         |
| DELETE | `/api/templates/{id}`    | Delete template         |

---

## Use Case: Costco Scraper

1. Navigate to the **Templates** tab.
2. Click **New Template** and name it "Costco Products".
3. Set Base URL to `https://www.costco.ca`.
4. Set Scraping Method to **Playwright**.
5. Set Selectors (JSON):

   ```json
   {
     "_container": "body",
     "name": "h1[automation-id='productName']",
     "price": "span.value[automation-id='productPriceOutput']"
   }
   ```

6. Save and create a **Job** using this template with a specific product URL.

---

## Technical Details

### Stealth Scraping (Playwright)
The platform includes an advanced implementation for bypasssing anti-bot measures:
- **Realistic Fingerprinting**: Randomized viewports and modern Chrome User-Agents.
- **Session Warm-up**: Automatically visits the base domain to establish cookies before navigating to deep links.
- **Smart Delays**: Waits for `domcontentloaded` with configurable settlement delays to avoid detection and hanging.

---

## Known Limitations

- **IP-Level Blocks**: High-security sites (Akamai, Cloudflare) may require residential proxies for consistent bypass.
- **Headless Detection**: While stealthy, some WAFs can still detect headless browsers in certain server environments.
- **Concurrency**: Large batch jobs should be monitored for CPU/Memory spikes in containerized environments.

---

## License

MIT License

## Contributing

Contributions welcome! Please open an issue or submit a PR.

---

## Documentation

- [Project Plan](./PROJECT_PLAN.md) - Detailed implementation plan
- [Scraping Technicalities](./knowledge-base/scraping-technicalities.md) - Deep dive into scraping methods
- [Additional Suggestions](./knowledge-base/additional-suggestion-&-info.md) - Gaps and improvements
