# Implementation Plan

## Overview
Build a Handwerker (craftsman) web application for tracking working hours on projects, managing warehouse/inventory articles assigned to projects, and providing additional features like project overview dashboards, employee management, and reporting.

The existing repository contains a WhatsApp Bot MVP that is unrelated. We will build the Handwerker app as a new, separate application in the `handwerker-app/` directory, keeping the existing code untouched. The app will be a full-stack Node.js application using Express.js for the API server, SQLite (via better-sqlite3) for persistence, and a vanilla HTML/CSS/JavaScript frontend (no build step required). This keeps it simple and deployable without complex tooling.

### Core Features
1. **Projektverwaltung (Project Management)** – Create, edit, delete projects with status tracking
2. **Zeiterfassung (Time Tracking)** – Clock in/out on projects, log hours with descriptions
3. **Lagerverwaltung (Inventory Management)** – Manage warehouse articles (materials), assign them to projects with quantities
4. **Mitarbeiter (Employee Management)** – Simple employee profiles linked to time entries
5. **Dashboard** – Overview with current projects, recent time entries, inventory status
6. **Berichte (Reports)** – Summaries of hours per project, material costs per project

---

## [Types]
Data model definitions for the SQLite database and corresponding JavaScript validation.

### Project
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER | Primary key, autoincrement |
| name | TEXT | NOT NULL |
| description | TEXT | nullable |
| customer_name | TEXT | nullable |
| customer_address | TEXT | nullable |
| status | TEXT | 'active', 'paused', 'completed' – default 'active' |
| start_date | TEXT | ISO date |
| end_date | TEXT | nullable ISO date |
| created_at | TEXT | ISO datetime |
| updated_at | TEXT | ISO datetime |

### Employee
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER | Primary key, autoincrement |
| first_name | TEXT | NOT NULL |
| last_name | TEXT | NOT NULL |
| email | TEXT | nullable, unique |
| role | TEXT | 'Meister', 'Geselle', 'Lehrling', 'Helfer' |
| hourly_rate | REAL | default 0 |
| active | INTEGER | boolean, default 1 |
| created_at | TEXT | ISO datetime |

### TimeEntry
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER | Primary key, autoincrement |
| project_id | INTEGER | FK → Project |
| employee_id | INTEGER | FK → Employee |
| date | TEXT | ISO date |
| start_time | TEXT | HH:MM |
| end_time | TEXT | HH:MM, nullable (running) |
| hours | REAL | computed or manual |
| description | TEXT | nullable |
| created_at | TEXT | ISO datetime |

### Article (Lagerartikel)
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER | Primary key, autoincrement |
| name | TEXT | NOT NULL |
| article_number | TEXT | unique |
| unit | TEXT | 'Stück', 'Meter', 'Liter', 'kg', 'Paket' |
| price_per_unit | REAL | default 0 |
| stock_quantity | REAL | current warehouse stock |
| min_stock | REAL | reorder threshold, default 0 |
| category | TEXT | nullable |
| created_at | TEXT | ISO datetime |

### ProjectArticle (Materialzuweisung)
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER | Primary key, autoincrement |
| project_id | INTEGER | FK → Project |
| article_id | INTEGER | FK → Article |
| quantity | REAL | amount used |
| date_used | TEXT | ISO date |
| notes | TEXT | nullable |
| created_at | TEXT | ISO datetime |

---

## [Files]
Files to be created for the Handwerker app.

### New Directory Structure
```
handwerker-app/
├── package.json
├── server.js                  # Express entry point
├── db/
│   ├── database.js            # SQLite connection & init
│   └── seed.js                # Optional seed data
├── routes/
│   ├── projects.js            # CRUD for projects
│   ├── employees.js           # CRUD for employees
│   ├── timeEntries.js         # CRUD for time entries
│   ├── articles.js            # CRUD for articles
│   ├── projectArticles.js     # Assign articles to projects
│   └── reports.js             # Reporting endpoints
├── public/
│   ├── index.html             # Main SPA shell
│   ├── css/
│   │   └── style.css          # Application styles
│   └── js/
│       ├── app.js             # Main app router/controller
│       ├── api.js             # Fetch wrapper for API calls
│       ├── pages/
│       │   ├── dashboard.js   # Dashboard view
│       │   ├── projects.js    # Projects list & detail
│       │   ├── timeTracking.js # Time tracking view
│       │   ├── inventory.js   # Inventory management
│       │   ├── employees.js   # Employee management
│       │   └── reports.js     # Reports view
│       └── components/
│           ├── modal.js       # Reusable modal component
│           └── toast.js       # Notification toasts
└── tests/
    └── api.test.js            # API integration tests
```

### Existing files NOT modified
- `index.js`, `src/*`, `tests/*`, `whatsapp_bot/*`, `package.json` – all untouched

---

## [Functions]
Key functions organized by module.

### db/database.js
- `getDb()` – Returns singleton SQLite connection, creates tables on first call
- `initTables(db)` – Creates all tables with IF NOT EXISTS

### routes/projects.js
- `GET /api/projects` – List all projects (with optional status filter)
- `POST /api/projects` – Create project
- `GET /api/projects/:id` – Get project with summary (total hours, material cost)
- `PUT /api/projects/:id` – Update project
- `DELETE /api/projects/:id` – Delete project (cascade)

### routes/employees.js
- `GET /api/employees` – List all employees
- `POST /api/employees` – Create employee
- `PUT /api/employees/:id` – Update employee
- `DELETE /api/employees/:id` – Soft-delete (set active=0)

### routes/timeEntries.js
- `GET /api/time-entries?project_id=&employee_id=&date=` – List with filters
- `POST /api/time-entries` – Create time entry
- `POST /api/time-entries/:id/stop` – Stop a running timer (set end_time, compute hours)
- `PUT /api/time-entries/:id` – Update time entry
- `DELETE /api/time-entries/:id` – Delete time entry

### routes/articles.js
- `GET /api/articles` – List all articles (with optional low-stock filter)
- `POST /api/articles` – Create article
- `PUT /api/articles/:id` – Update article
- `DELETE /api/articles/:id` – Delete article

### routes/projectArticles.js
- `GET /api/projects/:projectId/articles` – List articles for a project
- `POST /api/projects/:projectId/articles` – Assign article to project (reduce stock)
- `DELETE /api/project-articles/:id` – Remove assignment (restore stock)

### routes/reports.js
- `GET /api/reports/project-hours` – Hours per project summary
- `GET /api/reports/project-costs` – Material + labor costs per project
- `GET /api/reports/employee-hours` – Hours per employee summary

### public/js/app.js
- `navigateTo(page)` – Client-side routing
- `render(page)` – Render page content into main container

### public/js/api.js
- `apiGet(url)`, `apiPost(url, data)`, `apiPut(url, data)`, `apiDelete(url)` – Fetch wrappers

---

## [Classes]
No class-based architecture required. The application uses a functional/modular approach with Express routers and plain JavaScript modules.

---

## [Dependencies]
New dependencies for `handwerker-app/package.json`.

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.0 | HTTP server & routing |
| better-sqlite3 | ^11.0.0 | SQLite database driver |
| cors | ^2.8.5 | CORS support |

Dev dependencies:
| Package | Version | Purpose |
|---------|---------|---------|
| (none – using Node.js built-in test runner) | | |

---

## [Testing]
Tests will be in `handwerker-app/tests/api.test.js` using Node.js built-in test runner.

### Test Coverage
- Project CRUD operations
- Employee CRUD operations
- Time entry creation and stop-timer functionality
- Article CRUD and stock management
- Project-article assignment with stock reduction
- Report endpoint correctness

### Running Tests
```bash
cd handwerker-app && node --test tests/api.test.js
```

---

## [Implementation Order]
Step-by-step implementation sequence to ensure each step builds on the previous.

1. **Initialize project** – Create `handwerker-app/` directory, `package.json`, install dependencies
2. **Database layer** – Create `db/database.js` with table creation, `db/seed.js` with sample data
3. **Express server** – Create `server.js` with middleware and route mounting
4. **API routes** – Implement routes in order: projects → employees → timeEntries → articles → projectArticles → reports
5. **Frontend shell** – Create `public/index.html` with navigation, `css/style.css`
6. **Frontend API layer** – Create `public/js/api.js`
7. **Frontend app router** – Create `public/js/app.js`
8. **Frontend components** – Create modal and toast components
9. **Frontend pages** – Implement pages: dashboard → projects → timeTracking → inventory → employees → reports
10. **Tests** – Write API integration tests
11. **Seed & verify** – Run seed data, start server, verify all features work
