from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.permissions import require_role_permission
from app.models import Task, User
from app.schemas.task import TaskCreate, TaskList, TaskRead, TaskReview, TaskUpdate
from app.schemas.user import ManagedEmployeeList, ManagedEmployeeRead
from app.services.permission_service import has_permission
from app.services.task_service import (
    add_manager_review,
    assert_manager_can_access_task,
    can_manager_access_employee,
    create_task,
    get_task,
    list_tasks,
    update_task,
)


router = APIRouter(prefix="/manager", tags=["Managers"])


def _employee_page(
    db: Session,
    manager: User,
    *,
    search: str | None,
    page: int,
    page_size: int,
    employee_id: int | None = None,
) -> ManagedEmployeeList:
    filters = [User.role.has(name="EMPLOYEE")]
    if not has_permission(db, manager, "employee_directory", "view"):
        filters.append(User.manager_id == manager.id)
    if employee_id is not None:
        filters.append(User.id == employee_id)
    if search:
        term = f"%{search.strip()}%"
        filters.append(or_(User.first_name.ilike(term), User.last_name.ilike(term), User.email.ilike(term)))
    total = db.scalar(select(func.count(User.id)).where(*filters)) or 0
    people = list(db.scalars(
        select(User).where(*filters).order_by(User.is_active.desc(), User.last_name, User.first_name)
        .offset((page - 1) * page_size).limit(page_size)
    ).all())
    ids = [person.id for person in people]
    aggregates: dict[int, dict[str, int]] = {user_id: {"total": 0, "PENDING": 0, "IN_PROGRESS": 0, "COMPLETED": 0, "overdue": 0} for user_id in ids}
    if ids:
        rows = db.execute(
            select(Task.assigned_to, Task.status, func.count(Task.id))
            .where(Task.assigned_to.in_(ids)).group_by(Task.assigned_to, Task.status)
        ).all()
        for user_id, task_status, count in rows:
            aggregates[user_id]["total"] += count
            if task_status in aggregates[user_id]:
                aggregates[user_id][task_status] = count
        now = datetime.now(timezone.utc)
        overdue_rows = db.execute(
            select(Task.assigned_to, func.count(Task.id))
            .where(Task.assigned_to.in_(ids), Task.due_date < now, Task.status.notin_(["COMPLETED", "CANCELLED"]))
            .group_by(Task.assigned_to)
        ).all()
        for user_id, count in overdue_rows:
            aggregates[user_id]["overdue"] = count
    items = [
        ManagedEmployeeRead(
            id=person.id,
            first_name=person.first_name,
            last_name=person.last_name,
            full_name=person.full_name,
            email=person.email,
            phone=person.phone,
            manager_id=person.manager_id,
            is_active=person.is_active,
            created_at=person.created_at,
            total_tasks=aggregates[person.id]["total"],
            pending_tasks=aggregates[person.id]["PENDING"],
            in_progress_tasks=aggregates[person.id]["IN_PROGRESS"],
            completed_tasks=aggregates[person.id]["COMPLETED"],
            overdue_tasks=aggregates[person.id]["overdue"],
        )
        for person in people
    ]
    return ManagedEmployeeList(items=items, total=total, page=page, page_size=page_size)


def _manager_task_list(
    db: Session,
    manager: User,
    page: int,
    page_size: int,
    status_filter: str | None,
    search: str | None,
    daily_only: bool,
    employee_id: int | None = None,
) -> TaskList:
    if employee_id is not None:
        employee = db.scalar(select(User).where(User.id == employee_id, User.role.has(name="EMPLOYEE")))
        if employee is None or not can_manager_access_employee(db, manager, employee):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
    results = list_tasks(
        db, actor=manager, page=page, page_size=page_size, status_filter=status_filter,
        search=search, daily_only=daily_only, scope="manager", assigned_to=employee_id,
    )
    return results


@router.get("/employees", response_model=ManagedEmployeeList)
def employees(
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "employees", "view"))],
    db: Annotated[Session, Depends(get_db)],
    search: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ManagedEmployeeList:
    return _employee_page(db, manager, search=search, page=page, page_size=page_size)


@router.get("/employees/{employee_id}", response_model=ManagedEmployeeRead)
def employee_detail(
    employee_id: int,
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "employee_details", "view"))],
    db: Annotated[Session, Depends(get_db)],
) -> ManagedEmployeeRead:
    response = _employee_page(db, manager, search=None, page=1, page_size=1, employee_id=employee_id)
    if not response.items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
    return response.items[0]


@router.get("/employees/{employee_id}/tasks", response_model=TaskList)
def employee_task_history(
    employee_id: int,
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "employee_details", "view"))],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=100),
) -> TaskList:
    return _manager_task_list(db, manager, page, page_size, None, None, False, employee_id)


@router.get("/tasks", response_model=TaskList)
def tasks(
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "tasks", "view"))],
    db: Annotated[Session, Depends(get_db)],
    status_filter: str | None = Query(default=None, alias="status", pattern="^(PENDING|IN_PROGRESS|COMPLETED|CANCELLED)$"),
    search: str | None = None,
    daily_only: bool = False,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> TaskList:
    return _manager_task_list(db, manager, page, page_size, status_filter, search, daily_only)


@router.get("/daily-jobs", response_model=TaskList)
def daily_jobs(
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "daily_jobs", "view"))],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=100),
) -> TaskList:
    return _manager_task_list(db, manager, page, page_size, None, None, True)


@router.post("/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_manager_task(
    payload: TaskCreate,
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "task_management", "create"))],
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    if payload.is_daily_job and not has_permission(db, manager, "daily_jobs", "create"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to create daily jobs.")
    return create_task(db, payload, manager)


@router.post("/daily-jobs", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_daily_job(
    payload: TaskCreate,
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "daily_jobs", "create"))],
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    daily_payload = payload.model_copy(update={"is_daily_job": True})
    return create_task(db, daily_payload, manager)


@router.get("/tasks/{task_id}", response_model=TaskRead)
def task_detail(
    task_id: int,
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "tasks", "view"))],
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    task = get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    assert_manager_can_access_task(db, manager, task)
    return task


@router.put("/tasks/{task_id}", response_model=TaskRead)
def update_manager_task(
    task_id: int,
    payload: TaskUpdate,
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "task_management", "update"))],
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    task = get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    assert_manager_can_access_task(db, manager, task)
    if payload.assigned_to is not None:
        assigned_user = db.scalar(select(User).where(User.id == payload.assigned_to, User.role.has(name="EMPLOYEE")))
        if assigned_user is None or not can_manager_access_employee(db, manager, assigned_user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only assign tasks to employees in your reporting line.")
    return update_task(db, task, payload, allow_status=False)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_manager_task(
    task_id: int,
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "task_management", "delete"))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    task = get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    assert_manager_can_access_task(db, manager, task)
    db.delete(task)
    db.commit()


@router.post("/tasks/{task_id}/review", response_model=TaskRead)
def review_task(
    task_id: int,
    payload: TaskReview,
    manager: Annotated[User, Depends(require_role_permission("MANAGER", "task_management", "update"))],
    db: Annotated[Session, Depends(get_db)],
) -> Task:
    task = get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    assert_manager_can_access_task(db, manager, task)
    if task.status != "COMPLETED":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only completed tasks can be reviewed.")
    return add_manager_review(db, task, manager, payload.manager_notes)
