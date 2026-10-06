from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserSummary


class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str | None = None
    assigned_to: int
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: datetime | None = None
    is_daily_job: bool = False
    manager_notes: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = None
    assigned_to: int | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    due_date: datetime | None = None
    is_daily_job: bool | None = None
    manager_notes: str | None = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskNoteCreate(BaseModel):
    note: str = Field(min_length=1, max_length=4000)


class TaskReview(BaseModel):
    manager_notes: str = Field(min_length=1, max_length=4000)


class TaskRead(BaseModel):
    id: int
    title: str
    description: str | None = None
    assigned_to: int
    assigned_by: int
    assigned_employee: UserSummary
    assigner: UserSummary
    priority: TaskPriority
    status: TaskStatus
    due_date: datetime | None = None
    is_daily_job: bool
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None
    employee_notes: str | None = None
    manager_notes: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TaskList(BaseModel):
    items: list[TaskRead]
    total: int
    page: int
    page_size: int
