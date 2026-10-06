from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password
from app.models import Permission, RefreshSession, Role, User, UserPermission
from app.schemas.permission import PermissionGrantCreate, PermissionGrantRead
from app.schemas.user import UserCreate, UserList, UserRead, UserSummary, UserUpdate


def user_query():
    return select(User).options(
        selectinload(User.role),
        selectinload(User.manager).selectinload(User.role),
        selectinload(User.user_permissions).selectinload(UserPermission.permission),
    )


def get_user(db: Session, user_id: int, *, include_inactive: bool = True) -> User | None:
    statement = user_query().where(User.id == user_id)
    if not include_inactive:
        statement = statement.where(User.is_active.is_(True))
    return db.scalar(statement)


def build_user_read(user: User) -> UserRead:
    manager = None
    if user.manager:
        manager = UserSummary(
            id=user.manager.id,
            first_name=user.manager.first_name,
            last_name=user.manager.last_name,
            email=user.manager.email,
            role=user.manager.role.name,
        )
    grants = [
        PermissionGrantRead(
            id=item.id,
            permission_id=item.permission_id,
            name=item.permission.name,
            key=item.permission.key,
            can_view=item.can_view,
            can_create=item.can_create,
            can_update=item.can_update,
            can_delete=item.can_delete,
        )
        for item in sorted(user.user_permissions, key=lambda grant: grant.permission.name.lower())
    ]
    return UserRead(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role.name,
        manager_id=user.manager_id,
        manager=manager,
        is_active=user.is_active,
        profile_image=user.profile_image,
        created_at=user.created_at,
        updated_at=user.updated_at,
        permissions=grants,
    )


def replace_user_permissions(db: Session, user: User, grants: list[PermissionGrantCreate]) -> None:
    permission_ids = [grant.permission_id for grant in grants]
    if len(permission_ids) != len(set(permission_ids)):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A permission can only be listed once.")
    permissions = {}
    if permission_ids:
        permissions = {
            permission.id: permission
            for permission in db.scalars(select(Permission).where(Permission.id.in_(permission_ids))).all()
        }
        if len(permissions) != len(permission_ids):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="One or more permissions do not exist.")
    db.query(UserPermission).filter(UserPermission.user_id == user.id).delete(synchronize_session=False)
    db.flush()
    for grant in grants:
        db.add(UserPermission(
            user_id=user.id,
            permission_id=grant.permission_id,
            can_view=grant.can_view,
            can_create=grant.can_create,
            can_update=grant.can_update,
            can_delete=grant.can_delete,
        ))
    db.flush()
    db.expire(user, ["user_permissions"])


def _manager_for_employee(db: Session, manager_id: int | None) -> User | None:
    if manager_id is None:
        return None
    manager = db.scalar(select(User).options(selectinload(User.role)).where(User.id == manager_id))
    if manager is None or manager.role.name != "MANAGER" or not manager.is_active:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Select an active manager account.")
    return manager


def create_user(db: Session, payload: UserCreate, role_name: str) -> User:
    email = str(payload.email).strip().lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")
    role = db.scalar(select(Role).where(Role.name == role_name))
    if role is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Role catalog is not initialized.")
    manager_id = payload.manager_id if role_name == "EMPLOYEE" else None
    if manager_id is not None:
        _manager_for_employee(db, manager_id)
    user = User(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role_id=role.id,
        manager_id=manager_id,
        is_active=payload.is_active,
    )
    db.add(user)
    db.flush()
    replace_user_permissions(db, user, payload.permissions)
    db.commit()
    return get_user(db, user.id)  # type: ignore[return-value]


def set_user_active(db: Session, user: User, is_active: bool) -> User:
    user.is_active = is_active
    if not is_active:
        db.execute(
            update(RefreshSession)
            .where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None))
            .values(revoked_at=datetime.now(timezone.utc))
        )
    db.commit()
    return get_user(db, user.id)  # type: ignore[return-value]


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    was_active = user.is_active
    password_changed = False
    changes = payload.model_dump(exclude_unset=True)
    if "email" in changes and changes["email"] is not None:
        email = str(changes["email"]).strip().lower()
        existing = db.scalar(select(User.id).where(User.email == email, User.id != user.id))
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")
        user.email = email
    if "password" in changes and changes["password"]:
        password = changes.pop("password")
        if len(password.encode("utf-8")) > 72:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be 72 bytes or fewer.")
        user.password_hash = hash_password(password)
        password_changed = True
    effective_role = user.role.name
    if "role" in changes and changes["role"] is not None:
        role = db.scalar(select(Role).where(Role.name == changes.pop("role")))
        if role is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid role.")
        user.role_id = role.id
        effective_role = role.name
        if role.name == "MANAGER":
            user.manager_id = None
    if "manager_id" in changes:
        manager_id = changes.pop("manager_id")
        if effective_role == "EMPLOYEE":
            if manager_id is not None:
                _manager_for_employee(db, manager_id)
            user.manager_id = manager_id
        elif manager_id is not None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Only employees can be assigned to a manager.")
    for field in ("first_name", "last_name", "phone", "is_active"):
        if field in changes and changes[field] is not None:
            value = changes[field]
            setattr(user, field, value.strip() if isinstance(value, str) else value)
    if password_changed or (was_active and not user.is_active):
        db.execute(
            update(RefreshSession)
            .where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None))
            .values(revoked_at=datetime.now(timezone.utc))
        )
    db.commit()
    return get_user(db, user.id)  # type: ignore[return-value]


def list_users(
    db: Session,
    *,
    role_name: str | None = None,
    search: str | None = None,
    is_active: bool | None = None,
    page: int = 1,
    page_size: int = 20,
) -> UserList:
    filters = []
    if role_name:
        filters.append(User.role.has(Role.name == role_name))
    if is_active is not None:
        filters.append(User.is_active.is_(is_active))
    if search:
        term = f"%{search.strip()}%"
        filters.append(or_(User.first_name.ilike(term), User.last_name.ilike(term), User.email.ilike(term)))
    total = db.scalar(select(func.count(User.id)).where(*filters)) or 0
    rows = db.scalars(
        user_query().where(*filters).order_by(User.created_at.desc(), User.id.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return UserList(items=[build_user_read(row) for row in rows], total=total, page=page, page_size=page_size)
