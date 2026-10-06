from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.models import AttendanceEvent, Permission, RefreshSession, Role, Task, User, UserPermission  # noqa: F401
from app.routers import admin, auth, dashboard, employees, managers, permissions, tasks, users
from app.services.permission_service import seed_catalog, seed_initial_admin


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if len(settings.secret_key) < 32:
        raise RuntimeError("SECRET_KEY must be set to at least 32 characters before the API starts.")
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_catalog(db)
        seed_initial_admin(
            db,
            email=settings.admin_email,
            password=settings.admin_password,
            first_name=settings.admin_first_name,
            last_name=settings.admin_last_name,
        )
        db.commit()
        has_admin = db.scalar(select(User.id).join(Role, User.role_id == Role.id).where(Role.name == "ADMIN"))
        if has_admin is None:
            raise RuntimeError("No administrator exists. Set ADMIN_EMAIL and ADMIN_PASSWORD to bootstrap the first account.")
    yield


app = FastAPI(
    title=settings.app_name,
    description="A role-aware employee, task, and attendance management API.",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

for api_router in (auth.router, admin.router, managers.router, employees.router, users.router, tasks.router, permissions.router, dashboard.router):
    app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["System"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ems-api"}
