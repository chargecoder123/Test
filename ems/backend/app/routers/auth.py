from typing import Annotated

from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models import User
from app.schemas.auth import LoginRequest, MessageResponse, RefreshRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.auth_service import authenticate, refresh_session, revoke_refresh_session
from app.services.user_service import build_user_read


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    return authenticate(db, str(payload.email), payload.password)


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    return refresh_session(db, payload.refresh_token)


@router.get("/me", response_model=UserRead)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> UserRead:
    return build_user_read(current_user)


@router.post("/logout", response_model=MessageResponse)
def logout(
    db: Annotated[Session, Depends(get_db)],
    payload: Annotated[RefreshRequest | None, Body()] = None,
) -> MessageResponse:
    if payload:
        revoke_refresh_session(db, payload.refresh_token)
    return MessageResponse(message="You have been signed out.")
