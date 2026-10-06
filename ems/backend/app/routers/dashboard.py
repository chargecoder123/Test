from calendar import month_abbr
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import and_, extract, func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.dependencies.permissions import require_role_permission
from app.models import Role, Task, User
from app.schemas.task import TaskRead
from app.services.task_service import list_tasks
from app.services.user_service import list_users


router = APIRouter(tags=["Dashboard"])


def _task_count(db: Session, *filters) -> int:
    return db.scalar(select(func.count(Task.id)).where(*filters)) or 0


def _status_chart(db: Session) -> list[dict[str, int | str]]:
    counts = dict(db.execute(select(Task.status, func.count(Task.id)).group_by(Task.status)).all())
    statuses = (("PENDING", "Pending"), ("IN_PROGRESS", "In progress"), ("COMPLETED", "Completed"), ("CANCELLED", "Cancelled"))
    return [{"key": key, "label": label, "value": counts.get(key, 0)} for key, label in statuses]


def _monthly_chart(db: Session) -> list[dict[str, int | str]]:
    now = datetime.now(timezone.utc)
    cursor = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    for _ in range(5):
        cursor = (cursor.replace(day=1) - timedelta(days=1)).replace(day=1)
    rows = db.execute(
        select(extract("year", Task.created_at), extract("month", Task.created_at), func.count(Task.id))
        .where(Task.created_at >= cursor)
        .group_by(extract("year", Task.created_at), extract("month", Task.created_at))
    ).all()
    counts = {(int(year), int(month)): int(count) for year, month, count in rows}
    months = []
    for offset in range(6):
        current = cursor.replace(day=1)
        months.append({"month": month_abbr[current.month], "value": counts.get((current.year, current.month), 0)})
        cursor = (cursor.replace(day=28) + timedelta(days=4)).replace(day=1)
    return months


def _daily_chart(db: Session) -> list[dict[str, int | str]]:
    today = datetime.now(timezone.utc).date()
    start = datetime.combine(today - timedelta(days=6), datetime.min.time(), tzinfo=timezone.utc)
    date_expression = func.date(Task.created_at)
    rows = db.execute(
        select(date_expression, func.count(Task.id))
        .where(Task.created_at >= start)
        .group_by(date_expression)
    ).all()
    counts = {str(day): int(count) for day, count in rows}
    return [
        {"day": (today - timedelta(days=offset)).strftime("%a"), "date": str(today - timedelta(days=offset)), "value": counts.get(str(today - timedelta(days=offset)), 0)}
        for offset in range(6, -1, -1)
    ]


def _employee_performance(db: Session) -> list[dict[str, int | str]]:
    rows = db.execute(
        select(User.first_name, User.last_name, func.count(Task.id))
        .join(Task, Task.assigned_to == User.id)
        .where(User.role.has(name="EMPLOYEE"), Task.status == "COMPLETED")
        .group_by(User.id, User.first_name, User.last_name)
        .order_by(func.count(Task.id).desc())
        .limit(6)
    ).all()
    return [{"name": f"{first} {last}", "completed": count} for first, last, count in rows]


def _today_window() -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=1)


def _manager_filters(db: Session, manager: User) -> list:
    from app.services.permission_service import has_permission
    if has_permission(db, manager, "employee_directory", "view"):
        return []
    return [Task.assigned_employee.has(User.manager_id == manager.id)]


@router.get("/admin/dashboard")
def admin_dashboard(
    _admin: Annotated[User, Depends(require_role("ADMIN"))],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    now = datetime.now(timezone.utc)
    employee_role = db.scalar(select(Role).where(Role.name == "EMPLOYEE"))
    manager_role = db.scalar(select(Role).where(Role.name == "MANAGER"))
    employees = db.scalar(select(func.count(User.id)).where(User.role_id == employee_role.id)) if employee_role else 0
    managers = db.scalar(select(func.count(User.id)).where(User.role_id == manager_role.id)) if manager_role else 0
    active_employees = db.scalar(select(func.count(User.id)).where(User.role_id == employee_role.id, User.is_active.is_(True))) if employee_role else 0
    active_managers = db.scalar(select(func.count(User.id)).where(User.role_id == manager_role.id, User.is_active.is_(True))) if manager_role else 0
    overdue = _task_count(db, Task.due_date < now, Task.status.notin_(["COMPLETED", "CANCELLED"]))
    return {
        "stats": {
            "employees": employees or 0,
            "managers": managers or 0,
            "active_employees": active_employees or 0,
            "active_managers": active_managers or 0,
            "pending_tasks": _task_count(db, Task.status == "PENDING"),
            "in_progress_tasks": _task_count(db, Task.status == "IN_PROGRESS"),
            "completed_tasks": _task_count(db, Task.status == "COMPLETED"),
            "overdue_tasks": overdue,
        },
        "task_status": _status_chart(db),
        "monthly_tasks": _monthly_chart(db),
        "daily_tasks": _daily_chart(db),
        "employee_performance": _employee_performance(db),
    }


@router.get("/manager/dashboard")
def manager_dashboard(
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "dashboard", "view"))],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    from app.services.permission_service import has_permission
    employee_filter = [] if has_permission(db, manager, "employee_directory", "view") else [User.manager_id == manager.id]
    employee_count = db.scalar(select(func.count(User.id)).where(User.role.has(name="EMPLOYEE"), *employee_filter)) or 0
    task_scope = _manager_filters(db, manager)
    today_start, tomorrow = _today_window()
    today_filter = or_(Task.due_date.between(today_start, tomorrow), and_(Task.is_daily_job.is_(True), Task.due_date.is_(None)))
    tasks_today = [*task_scope, today_filter]
    pending = _task_count(db, *task_scope, Task.status == "PENDING")
    in_progress = _task_count(db, *task_scope, Task.status == "IN_PROGRESS")
    completed = _task_count(db, *task_scope, Task.status == "COMPLETED")
    overdue = _task_count(db, *task_scope, Task.due_date < datetime.now(timezone.utc), Task.status.notin_(["COMPLETED", "CANCELLED"]))
    todays_count = _task_count(db, *tasks_today)
    can_view_task_page = has_permission(db, manager, "tasks", "view")
    recent = list_tasks(db, actor=manager, page=1, page_size=5, scope="manager").items if can_view_task_page else []
    return {
        "stats": {
            "employees": employee_count,
            "today_tasks": todays_count,
            "pending_tasks": pending,
            "in_progress_tasks": in_progress,
            "completed_tasks": completed,
            "overdue_tasks": overdue,
        },
        "task_status": [
            {"key": "PENDING", "label": "Pending", "value": pending},
            {"key": "IN_PROGRESS", "label": "In progress", "value": in_progress},
            {"key": "COMPLETED", "label": "Completed", "value": completed},
        ],
        "recent_tasks": [task.model_dump(mode="json") for task in recent],
    }


@router.get("/employee/dashboard")
def employee_dashboard(
    employee: Annotated[User, Depends(require_role_permission("EMPLOYEE", "dashboard", "view"))],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    from app.services.permission_service import has_permission

    now = datetime.now(timezone.utc)
    today_start, tomorrow = _today_window()
    base = [Task.assigned_to == employee.id]
    pending = _task_count(db, *base, Task.status == "PENDING")
    in_progress = _task_count(db, *base, Task.status == "IN_PROGRESS")
    completed = _task_count(db, *base, Task.status == "COMPLETED")
    overdue = _task_count(db, *base, Task.due_date < now, Task.status.notin_(["COMPLETED", "CANCELLED"]))
    today_filter = or_(Task.due_date.between(today_start, tomorrow), and_(Task.is_daily_job.is_(True), Task.due_date.is_(None)))
    today_count = _task_count(db, *base, today_filter)
    can_view_tasks = has_permission(db, employee, "my_tasks", "view")
    recent = list_tasks(db, actor=employee, page=1, page_size=5, scope="employee").items if can_view_tasks else []
    return {
        "stats": {
            "my_tasks": pending + in_progress + completed,
            "today_jobs": today_count,
            "pending_tasks": pending,
            "in_progress_tasks": in_progress,
            "completed_tasks": completed,
            "overdue_tasks": overdue,
        },
        "task_status": [
            {"key": "PENDING", "label": "Pending", "value": pending},
            {"key": "IN_PROGRESS", "label": "In progress", "value": in_progress},
            {"key": "COMPLETED", "label": "Completed", "value": completed},
        ],
        "recent_tasks": [task.model_dump(mode="json") for task in recent],
    }
