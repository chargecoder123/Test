from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models import Task, User
from app.schemas.task import TaskCreate, TaskList, TaskRead, TaskUpdate
from app.services.task_service import create_task, get_task, list_tasks, update_task


router = APIRouter(prefix="/admin/tasks", tags=["Tasks"])
AdminUser = Annotated[User, Depends(require_role("ADMIN"))]


@router.get("", response_model=TaskList)
def all_tasks(
    admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    status_filter: str | None = Query(default=None, alias="status", pattern="^(PENDING|IN_PROGRESS|COMPLETED|CANCELLED)$"),
    search: str | None = None,
    daily_only: bool = False,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    assigned_to: int | None = None,
) -> TaskList:
    return list_tasks(db, actor=admin, page=page, page_size=page_size, status_filter=status_filter, search=search, daily_only=daily_only, assigned_to=assigned_to)


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_admin_task(
    payload: TaskCreate,
    admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    return create_task(db, payload, admin, require_reporting_line=False)


@router.get("/{task_id}", response_model=TaskRead)
def task_detail(
    task_id: int,
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    task = get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return task


@router.put("/{task_id}", response_model=TaskRead)
def update_admin_task(
    task_id: int,
    payload: TaskUpdate,
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    task = get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return update_task(db, task, payload, allow_status=True)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_task(
    task_id: int,
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    task = get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    db.delete(task)
    db.commit()
