from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models import AttendanceEvent, Role, User
from app.schemas.attendance import AttendanceRead
from app.schemas.role import RoleRead
from app.schemas.user import ManagerAssignment, StatusUpdate, UserCreate, UserList, UserRead, UserUpdate
from app.services.user_service import build_user_read, create_user, get_user, list_users, set_user_active, update_user


router = APIRouter(prefix="/admin", tags=["Admin"])
AdminUser = Annotated[User, Depends(require_role("ADMIN"))]


def _require_account_role(db: Session, user_id: int, expected: str) -> User:
    user = get_user(db, user_id)
    if user is None or user.role.name != expected:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{expected.title()} not found.")
    return user


def _protect_admin_deactivation(db: Session, actor: User, target: User, is_active: bool) -> None:
    if is_active:
        return
    if actor.id == target.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You cannot deactivate your own administrator account.")
    if target.role.name == "ADMIN":
        active_admins = db.scalar(select(func.count(User.id)).where(User.role_id == target.role_id, User.is_active.is_(True))) or 0
        if active_admins <= 1:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The last active administrator cannot be deactivated.")


@router.get("/roles", response_model=list[RoleRead])
def roles(_admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[Role]:
    return list(db.scalars(select(Role).order_by(Role.id)).all())


@router.get("/users", response_model=UserList)
def users(
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    search: str | None = None,
    role: str | None = Query(default=None, pattern="^(ADMIN|MANAGER|EMPLOYEE)$"),
    is_active: bool | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> UserList:
    return list_users(db, role_name=role, search=search, is_active=is_active, page=page, page_size=page_size)


@router.get("/users/{user_id}", response_model=UserRead)
def get_any_user(user_id: int, _admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> UserRead:
    user = get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return build_user_read(user)


@router.post("/employees", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_employee(payload: UserCreate, _admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> UserRead:
    return build_user_read(create_user(db, payload, "EMPLOYEE"))


@router.get("/employees", response_model=UserList)
def employees(
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    search: str | None = None,
    is_active: bool | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> UserList:
    return list_users(db, role_name="EMPLOYEE", search=search, is_active=is_active, page=page, page_size=page_size)


@router.get("/employees/{user_id}", response_model=UserRead)
def employee_detail(user_id: int, _admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> UserRead:
    return build_user_read(_require_account_role(db, user_id, "EMPLOYEE"))


@router.put("/employees/{user_id}", response_model=UserRead)
def update_employee(user_id: int, payload: UserUpdate, _admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> UserRead:
    if payload.role not in (None, "EMPLOYEE"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Use the users endpoint to change this account's role.")
    user = _require_account_role(db, user_id, "EMPLOYEE")
    return build_user_read(update_user(db, user, payload))


@router.delete("/employees/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_employee(user_id: int, admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> None:
    user = _require_account_role(db, user_id, "EMPLOYEE")
    set_user_active(db, user, False)


@router.post("/managers", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_manager(payload: UserCreate, _admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> UserRead:
    return build_user_read(create_user(db, payload, "MANAGER"))


@router.get("/managers", response_model=UserList)
def managers(
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    search: str | None = None,
    is_active: bool | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> UserList:
    return list_users(db, role_name="MANAGER", search=search, is_active=is_active, page=page, page_size=page_size)


@router.get("/managers/{user_id}", response_model=UserRead)
def manager_detail(user_id: int, _admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> UserRead:
    return build_user_read(_require_account_role(db, user_id, "MANAGER"))


@router.put("/managers/{user_id}", response_model=UserRead)
def update_manager(user_id: int, payload: UserUpdate, _admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> UserRead:
    if payload.role not in (None, "MANAGER"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Use the users endpoint to change this account's role.")
    user = _require_account_role(db, user_id, "MANAGER")
    return build_user_read(update_user(db, user, payload))


@router.delete("/managers/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_manager(user_id: int, admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> None:
    user = _require_account_role(db, user_id, "MANAGER")
    # Employees remain linked to the inactive manager until an admin reassigns them.
    set_user_active(db, user, False)


@router.put("/users/{user_id}", response_model=UserRead)
def update_any_user(user_id: int, payload: UserUpdate, _admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> UserRead:
    user = get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.role.name == "ADMIN" and user.is_active and payload.role is not None:
        active_admins = db.scalar(select(func.count(User.id)).where(User.role_id == user.role_id, User.is_active.is_(True))) or 0
        if active_admins <= 1:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The last active administrator cannot be demoted.")
    return build_user_read(update_user(db, user, payload))


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_any_user(user_id: int, admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> None:
    user = get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    _protect_admin_deactivation(db, admin, user, False)
    set_user_active(db, user, False)


@router.put("/users/{user_id}/status", response_model=UserRead)
def set_user_status(
    user_id: int,
    payload: StatusUpdate,
    admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> UserRead:
    user = get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    _protect_admin_deactivation(db, admin, user, payload.is_active)
    return build_user_read(set_user_active(db, user, payload.is_active))


@router.put("/users/{user_id}/manager", response_model=UserRead)
def assign_manager(
    user_id: int,
    payload: ManagerAssignment,
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> UserRead:
    employee = _require_account_role(db, user_id, "EMPLOYEE")
    return build_user_read(update_user(db, employee, UserUpdate(manager_id=payload.manager_id)))


@router.get("/attendance", response_model=list[AttendanceRead])
def attendance(
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    user_id: int | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> list[AttendanceEvent]:
    statement = select(AttendanceEvent).options(joinedload(AttendanceEvent.user).joinedload(User.role))
    if user_id is not None:
        statement = statement.where(AttendanceEvent.user_id == user_id)
    return list(db.scalars(statement.order_by(AttendanceEvent.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all())
