from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models import AttendanceEvent, Task, User
from app.schemas.task import TaskCreate, TaskList, TaskRead, TaskUpdate
from app.services.permission_service import has_permission


def task_query():
    return select(Task).options(
        joinedload(Task.assigned_employee).joinedload(User.role),
        joinedload(Task.assigner).joinedload(User.role),
    )


def get_task(db: Session, task_id: int) -> Task | None:
    return db.scalar(task_query().where(Task.id == task_id))


def _active_employee(db: Session, employee_id: int) -> User:
    employee = db.scalar(select(User).options(joinedload(User.role)).where(User.id == employee_id, User.is_active.is_(True)))
    if employee is None or employee.role.name != "EMPLOYEE":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Select an active employee account.")
    return employee


def can_manager_access_employee(db: Session, manager: User, employee: User) -> bool:
    return employee.manager_id == manager.id or has_permission(db, manager, "employee_directory", "view")


def assert_manager_can_access_task(db: Session, manager: User, task: Task) -> None:
    if can_manager_access_employee(db, manager, task.assigned_employee):
        return
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")


def create_task(db: Session, payload: TaskCreate, actor: User, *, require_reporting_line: bool = True) -> Task:
    employee = _active_employee(db, payload.assigned_to)
    if require_reporting_line and actor.role.name == "MANAGER" and not can_manager_access_employee(db, actor, employee):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only assign tasks to employees in your reporting line.")
    task = Task(
        title=payload.title.strip(),
        description=payload.description,
        assigned_to=employee.id,
        assigned_by=actor.id,
        priority=payload.priority.value,
        status="PENDING",
        due_date=payload.due_date,
        is_daily_job=payload.is_daily_job,
        manager_notes=payload.manager_notes,
    )
    db.add(task)
    db.flush()
    db.add(AttendanceEvent(user_id=employee.id, event_type="TASK_ASSIGNED", note=f"Task assigned: {task.title}"))
    db.commit()
    return get_task(db, task.id)  # type: ignore[return-value]


def update_task(db: Session, task: Task, payload: TaskUpdate, *, allow_status: bool) -> Task:
    changes = payload.model_dump(exclude_unset=True)
    if "status" in changes and not allow_status:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task status is controlled by the employee workflow.")
    if "assigned_to" in changes and changes["assigned_to"] is not None:
        employee = _active_employee(db, changes["assigned_to"])
        task.assigned_to = employee.id
    for field in ("title", "description", "priority", "status", "due_date", "is_daily_job", "manager_notes"):
        if field in changes:
            value = changes[field]
            if field == "title" and value is not None:
                value = value.strip()
            if field == "priority" and value is not None:
                value = value.value
            if field == "status" and value is not None:
                value = value.value
            setattr(task, field, value)
    if task.status == "COMPLETED" and task.completed_at is None:
        task.completed_at = datetime.now(timezone.utc)
    elif task.status != "COMPLETED":
        task.completed_at = None
    db.commit()
    return get_task(db, task.id)  # type: ignore[return-value]


def list_tasks(
    db: Session,
    *,
    actor: User,
    page: int = 1,
    page_size: int = 20,
    status_filter: str | None = None,
    search: str | None = None,
    daily_only: bool = False,
    scope: str = "all",
    assigned_to: int | None = None,
) -> TaskList:
    filters = []
    if status_filter:
        filters.append(Task.status == status_filter)
    if search:
        term = f"%{search.strip()}%"
        filters.append(or_(Task.title.ilike(term), Task.description.ilike(term)))
    if daily_only:
        filters.append(Task.is_daily_job.is_(True))
    if assigned_to is not None:
        filters.append(Task.assigned_to == assigned_to)
    if scope == "employee":
        filters.append(Task.assigned_to == actor.id)
    elif scope == "manager":
        if not has_permission(db, actor, "employee_directory", "view"):
            filters.append(Task.assigned_employee.has(User.manager_id == actor.id))
    query = select(Task).where(*filters)
    total = db.scalar(select(func.count(Task.id)).where(*filters)) or 0
    rows = db.scalars(
        task_query().where(*filters)
        .order_by(case((Task.due_date.is_(None), 1), else_=0), Task.due_date.asc(), Task.created_at.desc(), Task.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).unique().all()
    return TaskList(items=[TaskRead.model_validate(task) for task in rows], total=total, page=page, page_size=page_size)


def employee_tasks(
    db: Session,
    actor: User,
    *,
    page: int = 1,
    page_size: int = 100,
    daily_only: bool = False,
    status_filter: str | None = None,
) -> TaskList:
    return list_tasks(
        db, actor=actor, page=page, page_size=page_size, daily_only=daily_only,
        status_filter=status_filter, scope="employee",
    )


def append_employee_note(db: Session, task: Task, employee: User, note: str) -> Task:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    line = f"[{timestamp}] {note.strip()}"
    task.employee_notes = f"{task.employee_notes}\n{line}" if task.employee_notes else line
    db.add(AttendanceEvent(user_id=employee.id, event_type="TASK_NOTE_ADDED", note=f"Note added to task: {task.title}"))
    db.commit()
    return get_task(db, task.id)  # type: ignore[return-value]


def update_employee_task_status(db: Session, task: Task, employee: User, new_status: str) -> Task:
    allowed = {"PENDING": {"IN_PROGRESS"}, "IN_PROGRESS": {"COMPLETED"}}
    if new_status not in allowed.get(task.status, set()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A task in {task.status.replace('_', ' ').lower()} status cannot be moved to {new_status.replace('_', ' ').lower()}.",
        )
    task.status = new_status
    if new_status == "COMPLETED":
        task.completed_at = datetime.now(timezone.utc)
    event_type = "TASK_STARTED" if new_status == "IN_PROGRESS" else "TASK_COMPLETED"
    db.add(AttendanceEvent(user_id=employee.id, event_type=event_type, note=f"{task.title} — {new_status.replace('_', ' ').lower()}"))
    db.commit()
    return get_task(db, task.id)  # type: ignore[return-value]


def add_manager_review(db: Session, task: Task, manager: User, notes: str) -> Task:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    entry = f"[{stamp}] {notes.strip()}"
    task.manager_notes = f"{task.manager_notes}\n{entry}" if task.manager_notes else entry
    db.add(AttendanceEvent(user_id=task.assigned_to, event_type="TASK_REVIEWED", note=f"Task reviewed: {task.title}"))
    db.commit()
    return get_task(db, task.id)  # type: ignore[return-value]
