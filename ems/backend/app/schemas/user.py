from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.permission import PermissionGrantCreate, PermissionGrantRead


class UserSummary(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: str

    model_config = ConfigDict(from_attributes=True)

    @field_validator("role", mode="before")
    @classmethod
    def resolve_role_name(cls, value):
        return value.name if hasattr(value, "name") else value


class UserCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    password: str = Field(min_length=8, max_length=72)
    manager_id: int | None = None
    is_active: bool = True
    permissions: list[PermissionGrantCreate] = Field(default_factory=list)

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 bytes or fewer")
        return value


class UserUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    manager_id: int | None = None
    is_active: bool | None = None
    role: Literal["MANAGER", "EMPLOYEE"] | None = None
    password: str | None = Field(default=None, min_length=8, max_length=72)


class StatusUpdate(BaseModel):
    is_active: bool


class ManagerAssignment(BaseModel):
    manager_id: int | None


class UserRead(BaseModel):
    id: int
    first_name: str
    last_name: str
    full_name: str
    email: EmailStr
    phone: str | None = None
    role: str
    manager_id: int | None = None
    manager: UserSummary | None = None
    is_active: bool
    profile_image: str | None = None
    created_at: datetime
    updated_at: datetime
    permissions: list[PermissionGrantRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ManagedEmployeeRead(BaseModel):
    id: int
    first_name: str
    last_name: str
    full_name: str
    email: EmailStr
    phone: str | None = None
    manager_id: int | None = None
    is_active: bool
    created_at: datetime
    total_tasks: int = 0
    pending_tasks: int = 0
    in_progress_tasks: int = 0
    completed_tasks: int = 0
    overdue_tasks: int = 0


class ManagedEmployeeList(BaseModel):
    items: list[ManagedEmployeeRead]
    total: int
    page: int
    page_size: int


class UserList(BaseModel):
    items: list[UserRead]
    total: int
    page: int
    page_size: int
