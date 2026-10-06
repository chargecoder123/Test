from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies.auth import get_current_user
from app.models import User
from app.schemas.user import UserRead
from app.services.user_service import build_user_read


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
def current_account(current_user: Annotated[User, Depends(get_current_user)]) -> UserRead:
    """Return the authenticated user's own account; never resolves another user's ID."""
    return build_user_read(current_user)
