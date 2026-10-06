from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.dependencies.permissions import require_role_permission
from app.models import AttendanceEvent, Task, User
from app.schemas.attendance import AttendanceRead
from app.schemas.task import TaskList, TaskNoteCreate, TaskRead, TaskStatusUpdate
from app.schemas.user import UserRead
from app.services.task_service import append_employee_note, employee_tasks, get_task, update_employee_task_status
from app.services.user_service import build_user_read


router = APIRouter(prefix="/employee", tags=["Employees"])


def _owned_task(db: Session, employee: User, task_id: int) -> Task:
    task = get_task(db, task_id)
    if task is None or task.assigned_to != employee.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return task


@router.get("/profile", response_model=UserRead)
def profile(
    employee: Annotated[User, Depends(require_role_permission("EMPLOYEE", "profile", "view"))],
) -> UserRead:
    return build_user_read(employee)


@router.get("/tasks", response_model=TaskList)
def tasks(
    employee: Annotated[User, Depends(require_role_permission("EMPLOYEE", "my_tasks", "view"))],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=100),
) -> TaskList:
    return employee_tasks(db, employee, page=page, page_size=page_size)


@router.get("/daily-jobs", response_model=TaskList)
def daily_jobs(
    employee: Annotated[User, Depends(require_role_permission("EMPLOYEE", "daily_jobs", "view"))],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=100),
) -> TaskList:
    return employee_tasks(db, employee, page=page, page_size=page_size, daily_only=True)


@router.get("/tasks/history", response_model=TaskList)
def task_history(
    employee: Annotated[User, Depends(require_role_permission("EMPLOYEE", "task_history", "view"))],
    db: Annotated[Session, Depends(get_db)],
    status_filter: str | None = Query(default=None, alias="status", pattern="^(PENDING|IN_PROGRESS|COMPLETED|CANCELLED)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=100),
) -> TaskList:
    return employee_tasks(db, employee, page=page, page_size=page_size, status_filter=status_filter)


@router.get("/tasks/{task_id}", response_model=TaskRead)
def task_detail(
    task_id: int,
    employee: Annotated[User, Depends(require_role_permission("EMPLOYEE", "my_tasks", "view"))],
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    return _owned_task(db, employee, task_id)


@router.put("/tasks/{task_id}/start", response_model=TaskRead)
def start_task(
    task_id: int,
    employee: Annotated[User, Depends(require_role_permission("EMPLOYEE", "my_tasks", "update"))],
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    task = _owned_task(db, employee, task_id)
    return update_employee_task_status(db, task, employee, "IN_PROGRESS")


@router.put("/tasks/{task_id}/complete", response_model=TaskRead)
def complete_task(
    task_id: int,
    employee: Annotated[User, Depends(require_role_permission("EMPLOYEE", "my_tasks", "update"))],
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    task = _owned_task(db, employee, task_id)
    return update_employee_task_status(db, task, employee, "COMPLETED")


@router.put("/tasks/{task_id}/status", response_model=TaskRead)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    employee: Annotated[User, Depends(require_role_permission("EMPLOYEE", "my_tasks", "update"))],
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    task = _owned_task(db, employee, task_id)
    return update_employee_task_status(db, task, employee, payload.status.value)


@router.post("/tasks/{task_id}/notes", response_model=TaskRead)
def add_task_note(
    task_id: int,
    payload: TaskNoteCreate,
    employee: Annotated[User, Depends(require_role_permission("EMPLOYEE", "my_tasks", "update"))],
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    task = _owned_task(db, employee, task_id)
    return append_employee_note(db, task, employee, payload.note)


@router.get("/activity", response_model=list[AttendanceRead])
def activity(
    employee: Annotated[User, Depends(require_role_permission("EMPLOYEE", "task_history", "view"))],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> list[AttendanceEvent]:
    statement = select(AttendanceEvent).options(joinedload(AttendanceEvent.user).joinedload(User.role))
    return list(db.scalars(statement.where(AttendanceEvent.user_id == employee.id).order_by(AttendanceEvent.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all())
