from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models import Permission, User, UserPermission
from app.schemas.permission import PermissionBatch, PermissionCreate, PermissionGrantRead, PermissionRead, PermissionUpdate
from app.services.permission_service import serialize_permission_grants
from app.services.user_service import get_user, replace_user_permissions


router = APIRouter(prefix="/permissions", tags=["Permissions"])
AdminUser = Annotated[User, Depends(require_role("ADMIN"))]


@router.get("", response_model=list[PermissionRead])
def list_permissions(_admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[Permission]:
    return list(db.scalars(select(Permission).order_by(Permission.name)).all())


@router.post("", response_model=PermissionRead, status_code=status.HTTP_201_CREATED)
def create_permission(payload: PermissionCreate, _admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> Permission:
    if db.scalar(select(Permission.id).where(Permission.key == payload.key)) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A permission with this key already exists.")
    permission = Permission(name=payload.name.strip(), key=payload.key, description=payload.description, is_system=False)
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission


@router.put("/{permission_id}", response_model=PermissionRead)
def update_permission(
    permission_id: int,
    payload: PermissionUpdate,
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> Permission:
    permission = db.get(Permission, permission_id)
    if permission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found.")
    changes = payload.model_dump(exclude_unset=True)
    new_key = changes.get("key")
    if new_key and new_key != permission.key:
        if permission.is_system:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="System permission keys are reserved and cannot be changed.")
        if db.scalar(select(Permission.id).where(Permission.key == new_key, Permission.id != permission.id)) is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A permission with this key already exists.")
    for field in ("name", "key", "description"):
        if field in changes:
            value = changes[field]
            setattr(permission, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(permission)
    return permission


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_permission(permission_id: int, _admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> None:
    permission = db.get(Permission, permission_id)
    if permission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found.")
    if permission.is_system:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Built-in permissions cannot be deleted.")
    db.delete(permission)
    db.commit()


@router.get("/user/{user_id}", response_model=list[PermissionGrantRead])
def get_user_permissions(user_id: int, _admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[PermissionGrantRead]:
    user = db.scalar(
        select(User)
        .options(selectinload(User.user_permissions).selectinload(UserPermission.permission))
        .where(User.id == user_id)
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return serialize_permission_grants(user)


@router.post("/user/{user_id}", response_model=list[PermissionGrantRead])
def create_user_permissions(
    user_id: int,
    payload: PermissionBatch,
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[PermissionGrantRead]:
    user = get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    replace_user_permissions(db, user, payload.permissions)
    db.commit()
    return serialize_permission_grants(get_user(db, user_id))  # type: ignore[arg-type]


@router.put("/user/{user_id}", response_model=list[PermissionGrantRead])
def update_user_permissions(
    user_id: int,
    payload: PermissionBatch,
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[PermissionGrantRead]:
    return create_user_permissions(user_id, payload, _admin, db)


@router.delete("/user/{user_id}/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_permission(
    user_id: int,
    permission_id: int,
    _admin: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    assignment = db.scalar(
        select(UserPermission).where(UserPermission.user_id == user_id, UserPermission.permission_id == permission_id)
    )
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission grant not found.")
    db.delete(assignment)
    db.commit()
