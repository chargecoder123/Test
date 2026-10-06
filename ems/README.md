# Northstar EMS

A full-stack Employee Management System for organization administration, manager-led work, and employee task execution. The React client is integrated with the FastAPI API; every listed page and workflow reads or writes live API data (there are no mock API responses).

## Features

- Three primary roles: **ADMIN**, **MANAGER**, and **EMPLOYEE**.
- Short-lived JWT access tokens and rotating, revocable refresh sessions; bcrypt password hashing.
- Admin-managed page permissions with independent view/create/update/delete grants, stored in MySQL.
- Responsive dashboards, employee and manager directories, account administration, reports, activity timeline, and settings.
- Manager-to-employee reporting lines, scoped employee visibility, task assignment, daily jobs, task review, and feedback.
- Employee self-service profile, assigned task list, daily jobs, work notes, start/complete workflow, and task history.
- Server-side role/permission checks in addition to frontend protected routes and hidden unauthorized navigation/actions.
- Pydantic input validation, SQLAlchemy models, API error handling, CORS configuration, OpenAPI, and workflow tests.

## Tech stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2, MySQL / PyMySQL, Pydantic Settings, python-jose, passlib + bcrypt.
- **Frontend:** Vite, React, TypeScript, Tailwind CSS, React Router, TanStack Query, Axios, Lucide React, Sonner.
- **Database:** MySQL 8+ (SQLite may be selected for local development/tests).

## Project structure

```text
ems/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, JWT/password security, SQLAlchemy sessions
│   │   ├── models/        # User, Role, Permission, Task, Attendance, refresh sessions
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── dependencies/  # Current user, role, and permission guards
│   │   ├── services/      # Auth, user, permission, and task business logic
│   │   └── routers/       # Versioned FastAPI endpoints
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI, forms, task tables, feedback and charts
│   │   ├── context/       # Auth/session context
│   │   ├── layouts/       # Admin, Manager, Employee shells
│   │   ├── pages/         # Role-specific pages
│   │   ├── routes/        # Protected, role, and page-permission routes
│   │   ├── services/      # Central Axios client and API modules
│   │   └── types/
│   ├── package.json
│   └── .env.example
└── README.md
```

## MySQL setup

Create the database (the application creates its tables, roles, and built-in permission records on first startup):

```sql
CREATE DATABASE ems CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Configure a dedicated MySQL user and grant it access to `ems`. Then follow the backend setup below. `Base.metadata.create_all` bootstraps a new database; it is not a replacement for Alembic migrations on an existing production schema.

## Environment variables

### Backend

```bash
cd backend
cp .env.example .env
```

Set at least:

```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/ems
SECRET_KEY=use-a-unique-random-secret-of-at-least-32-characters
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-unique-password-of-at-least-12-characters
```

The admin is created only when no administrator exists. There is no hardcoded production password; the configured bootstrap password is hashed immediately and never returned. Change it before using a real environment. `CORS_ORIGINS` accepts a comma-separated list.

For a no-MySQL local run only, you can use `DATABASE_URL=sqlite:///./ems-dev.db`.

### Frontend

```bash
cd frontend
cp .env.example .env
```

The default `VITE_API_URL=/api/v1` keeps browser calls same-origin. Vite proxies `/api` to the backend at `http://127.0.0.1:8000` during development; override the proxy destination with `EMS_API_PROXY` if needed. In production, route `/api` and `/health` to FastAPI at the reverse proxy, or set `VITE_API_URL` to the API's public HTTPS origin.

## Install and run

Start the backend in one terminal:

```bash
cd ems/backend
python -m venv .venv
source .venv/bin/activate             # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                  # edit the MySQL URL and secrets before first run
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Start the frontend in another terminal:

```bash
cd ems/frontend
npm install
cp .env.example .env
npm run dev
```

The initial administrator signs in at `/login` with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` values from the backend environment. Admins create users, assign employees to managers, and grant pages/actions in **Permissions**. Manager and Employee landing pages are selected from the permissions actually granted to that account.

## Role and permission system

- **Admin**: manages accounts, reporting lines, permissions, tasks, settings, reports, and activity.
- **Manager**: only sees employees in their reporting line unless `employee_directory` access is explicitly granted. Task create/edit/delete/review and daily-job actions require their specific grants.
- **Employee**: reads their own profile and task records, can start/complete assigned work, and can add work notes. Assignment, creator, manager, and permission fields cannot be changed through employee task endpoints.

Permission grants are database-backed and expose `can_view`, `can_create`, `can_update`, and `can_delete`. Admin has full access; Manager/Employee roles do not imply access. React Router and the sidebar use the same grants for navigation and affordances, while FastAPI independently validates every protected request.

## API documentation and tests

With the backend running:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health: `http://localhost:8000/health`

Run backend workflow tests:

```bash
cd backend
source .venv/bin/activate
python -m pytest -q
```

Check/build the frontend:

```bash
cd frontend
npm run typecheck
npm run build
```

## Production deployment checklist

1. Use managed MySQL over TLS, private networking, least-privilege DB credentials, backups, and versioned Alembic migrations.
2. Store the database URL, secret key, and bootstrap credentials in a secret manager; use unique values per environment and rotate bootstrap credentials.
3. Serve the frontend and API over HTTPS. Set exact trusted `CORS_ORIGINS` and reverse-proxy `/api` and `/health` correctly.
4. Run Uvicorn with production workers (no `--reload`) behind a trusted proxy. Add rate limiting for login, structured audit logs, metrics, and monitoring.
5. Keep `.env`, database files, build outputs, and user uploads out of source control.
