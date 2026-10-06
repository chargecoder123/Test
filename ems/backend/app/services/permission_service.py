from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Permission, Role, User, UserPermission
from app.schemas.permission import PermissionGrantRead


PERMISSION_CATALOG: tuple[tuple[str, str, str], ...] = (
    ("dashboard", "Dashboard", "View role-specific dashboard and summary metrics."),
    ("users", "Users", "Browse and manage user accounts."),
    ("employees", "Employees", "View the employee workspace and employee list."),
    ("employee_details", "Employee details", "View employee profiles and task history."),
    ("employee_directory", "All employee directory", "View employees outside a manager's reporting line."),
    ("managers", "Managers", "View the manager workspace and manager list."),
    ("manager_details", "Manager details", "View manager profiles."),
    ("tasks", "Tasks", "View task lists and task details."),
    ("task_management", "Task management", "Create, edit, and delete assigned tasks."),
    ("daily_jobs", "Daily jobs", "Manage or view daily job assignments."),
    ("my_tasks", "My tasks", "View and update tasks assigned to the signed-in employee."),
    ("task_history", "Task history", "View completed and historical task records."),
    ("profile", "My profile", "View and edit the signed-in user's profile."),
    ("reports", "Reports", "View work and performance reports."),
    ("attendance", "Attendance & activity", "View employee activity and attendance events."),
    ("settings", "Settings", "View system and account settings."),
)

ROLE_DEFINITIONS = (
    ("ADMIN", "Full system administrator"),
    ("MANAGER", "Manager with explicitly granted access"),
    ("EMPLOYEE", "Employee with explicitly granted access"),
)


def seed_catalog(db: Session) -> None:
    roles = {role.name: role for role in db.scalars(select(Role)).all()}
    for name, description in ROLE_DEFINITIONS:
        if name not in roles:
            db.add(Role(name=name, description=description))
    permissions = {permission.key: permission for permission in db.scalars(select(Permission)).all()}
    for key, name, description in PERMISSION_CATALOG:
        if key not in permissions:
            db.add(Permission(key=key, name=name, description=description, is_system=True))
    db.flush()


def seed_initial_admin(db: Session, *, email: str | None, password: str | None, first_name: str, last_name: str) -> None:
    if not email or not password:
        return
    email = email.strip().lower()
    if "@" not in email:
        raise RuntimeError("ADMIN_EMAIL must be a valid email address.")
    if len(password) < 12 or len(password.encode("utf-8")) > 72:
        raise RuntimeError("ADMIN_PASSWORD must be at least 12 characters and no more than 72 UTF-8 bytes.")
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        return
    role = db.scalar(select(Role).where(Role.name == "ADMIN"))
    if role is None:
        raise RuntimeError("ADMIN role was not initialized")
    db.add(User(
        first_name=first_name.strip() or "System",
        last_name=last_name.strip() or "Administrator",
        email=email,
        password_hash=hash_password(password),
        role_id=role.id,
        is_active=True,
    ))
    db.flush()


def get_permission_map(db: Session, user: User) -> dict[str, dict[str, bool]]:
    if user.role.name == "ADMIN":
        return {
            key: {"view": True, "create": True, "update": True, "delete": True}
            for key, _name, _description in PERMISSION_CATALOG
        }
    return {
        assignment.permission.key: {
            "view": assignment.can_view,
            "create": assignment.can_create,
            "update": assignment.can_update,
            "delete": assignment.can_delete,
        }
        for assignment in user.user_permissions
    }


def has_permission(db: Session, user: User, key: str, action: str = "view") -> bool:
    if user.role.name == "ADMIN":
        return True
    if action not in {"view", "create", "update", "delete"}:
        return False
    assignment = db.scalar(
        select(UserPermission)
        .join(Permission, Permission.id == UserPermission.permission_id)
        .where(UserPermission.user_id == user.id, Permission.key == key)
    )
    if assignment is None or not assignment.can_view:
        return False
    return bool(getattr(assignment, f"can_{action}"))


def serialize_permission_grants(user: User) -> list[PermissionGrantRead]:
    return [
        PermissionGrantRead(
            id=assignment.id,
            permission_id=assignment.permission_id,
            name=assignment.permission.name,
            key=assignment.permission.key,
            can_view=assignment.can_view,
            can_create=assignment.can_create,
            can_update=assignment.can_update,
            can_delete=assignment.can_delete,
        )
        for assignment in sorted(user.user_permissions, key=lambda item: item.permission.name.lower())
    ]
