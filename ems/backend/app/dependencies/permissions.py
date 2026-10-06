from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models import User
from app.services.permission_service import has_permission


def require_permission(key: str, action: str = "view"):
    def dependency(
        current_user: Annotated[User, Depends(get_current_user)],
        db: Annotated[Session, Depends(get_db)],
    ) -> User:
        if not has_permission(db, current_user, key, action):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to perform this action.")
        return current_user

    return dependency


def require_role_permission(role: str, key: str, action: str = "view"):
    def dependency(
        role_user: Annotated[User, Depends(require_role(role))],
        _permission_user: Annotated[User, Depends(require_permission(key, action))],
    ) -> User:
        return role_user

    return dependency
