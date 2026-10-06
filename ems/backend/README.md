# Northstar EMS API

FastAPI service for Northstar EMS. The API owns authentication, role and page authorization, users, reporting lines, task workflows, and activity records. OpenAPI docs are available at `/docs` and `/redoc` while the API is running.

## Requirements

- Python 3.11+
- MySQL 8+ (or MariaDB with compatible InnoDB behavior)
- A MySQL database created before first startup

SQLite is supported for local tests and lightweight development by setting `DATABASE_URL=sqlite:///./ems-dev.db`.

## Install and run

```bash
cd ems/backend
python -m venv .venv
source .venv/bin/activate             # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set the MySQL URL, a random SECRET_KEY, CORS_ORIGINS, and admin credentials.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Create the database and grant the configured database user access before starting FastAPI:

```sql
CREATE DATABASE ems CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

On first startup, SQLAlchemy creates the tables, seeds the three roles and built-in permission catalog, then creates the administrator specified by `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The admin password must be at least 12 characters. Credentials are not returned by the API. If an admin already exists, bootstrap credentials do not overwrite it.

For a local SQLite-only run, use a `.env` like:

```env
DATABASE_URL=sqlite:///./ems-dev.db
SECRET_KEY=make-this-a-unique-random-value-with-at-least-32-characters
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-admin-password
```

## Architecture

- `app/core`: Pydantic settings, SQLAlchemy engine/session, password and JWT utilities.
- `app/models`: users, roles, page permissions, refresh sessions, tasks, and activity events.
- `app/schemas`: request validation and response models.
- `app/dependencies`: authenticated user, role, and permission dependencies.
- `app/services`: authentication, user, task, and permission business rules.
- `app/routers`: versioned REST endpoints grouped by feature.

The first deployment creates tables with `Base.metadata.create_all`. For an established production database, introduce and run Alembic migrations before changing model schemas; `create_all` is not a schema migration tool.

## Authentication and authorization

- `POST /api/v1/auth/login` accepts `{ "email", "password" }` and returns an access JWT, a refresh JWT, and the signed-in user.
- `POST /api/v1/auth/refresh` rotates a one-use refresh session. Reusing a rotated token is rejected.
- `GET /api/v1/auth/me` returns the current account and explicitly assigned permissions.
- `POST /api/v1/auth/logout` revokes the supplied refresh session.
- Passwords are bcrypt-hashed. Access tokens are short-lived; refresh sessions are stored server-side and revoked on account deactivation.
- Every manager/employee API checks the role and database-backed permission grants. The admin role has full access; Manager and Employee access is never inferred from the role alone.
- A manager sees employees in their reporting line. `employee_directory` is an explicit additional grant for wider visibility. Employees can read and update only their own task/work data.

Each `UserPermission` grant stores `can_view`, `can_create`, `can_update`, and `can_delete` separately. Built-in page keys include `dashboard`, `employees`, `employee_details`, `employee_directory`, `tasks`, `task_management`, `daily_jobs`, `my_tasks`, `task_history`, `profile`, `reports`, `attendance`, `users`, and `settings`. Admins can also create custom permission catalog entries for future modules. Built-in keys cannot be deleted or renamed.

## API groups

All business endpoints use `/api/v1`.

- **Authentication**: `/auth/login`, `/auth/refresh`, `/auth/me`, `/auth/logout`
- **Admin**: `/admin/users`, `/admin/employees`, `/admin/managers`, `/admin/users/{id}/status`, `/admin/users/{id}/manager`, `/admin/dashboard`, `/admin/attendance`
- **Manager**: `/manager/dashboard`, `/manager/employees`, `/manager/tasks`, `/manager/daily-jobs`, `/manager/tasks/{id}/review`
- **Employee**: `/employee/dashboard`, `/employee/profile`, `/employee/tasks`, `/employee/daily-jobs`, `/employee/tasks/history`, `/employee/activity`
- **Permissions**: `/permissions`, `/permissions/user/{user_id}`
- **Admin tasks**: `/admin/tasks`

Use `/docs` for the complete request/response schemas and generated interactive API client.

## Tests

```bash
cd ems/backend
source .venv/bin/activate
python -m pytest -q
```

The end-to-end test uses a disposable SQLite database and exercises bootstrap login, role and permission checks, manager-to-employee scoping, daily task creation, employee task state transitions, refresh-token rotation, and custom permission CRUD.

## Deployment notes

- Use a managed MySQL service, TLS, least-privilege database credentials, and a unique secret key stored in a deployment secret manager.
- Set `CORS_ORIGINS` to exact trusted frontend origins; the value accepts comma-separated origins.
- Terminate HTTPS at a trusted reverse proxy and run Uvicorn workers behind it. Do not use `--reload` in production.
- Back up MySQL, add Alembic migrations, rate-limit sign-in, and configure centralized logs/metrics before internet exposure.
- Do not commit `.env` files or expose the initial administrator password in a build artifact.
