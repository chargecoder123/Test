from datetime import datetime, timezone

from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.security import create_access_token, create_refresh_token, decode_token, verify_password
from app.models import AttendanceEvent, RefreshSession, User
from app.schemas.auth import TokenResponse
from app.services.user_service import build_user_read, get_user


def _issue_pair(db: Session, user: User) -> TokenResponse:
    access_token, _access_jti, _access_expiry = create_access_token(user_id=user.id, role=user.role.name)
    refresh_token, refresh_jti, refresh_expiry = create_refresh_token(user_id=user.id, role=user.role.name)
    db.add(RefreshSession(user_id=user.id, jti=refresh_jti, expires_at=refresh_expiry))
    db.commit()
    refreshed_user = get_user(db, user.id, include_inactive=False)
    if refreshed_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="This account is not available.")
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=build_user_read(refreshed_user),
    )


def authenticate(db: Session, email: str, password: str) -> TokenResponse:
    user = db.scalar(
        select(User)
        .options(selectinload(User.role))
        .where(User.email == email.strip().lower())
    )
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email or password is incorrect.")
    db.add(AttendanceEvent(user_id=user.id, event_type="USER_LOGIN", note="Signed in"))
    return _issue_pair(db, user)


def refresh_session(db: Session, token: str) -> TokenResponse:
    try:
        claims = decode_token(token)
        if claims.get("type") != "refresh":
            raise ValueError("Wrong token type")
        user_id = int(str(claims.get("sub")))
        jti = str(claims.get("jti"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is invalid or expired.")
    session = db.scalar(select(RefreshSession).where(RefreshSession.jti == jti, RefreshSession.user_id == user_id).with_for_update())
    user = get_user(db, user_id, include_inactive=False)
    if session is None or session.revoked_at is not None or user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is invalid or expired.")
    session.revoked_at = datetime.now(timezone.utc)
    db.flush()
    return _issue_pair(db, user)


def revoke_refresh_session(db: Session, token: str | None) -> None:
    if not token:
        return
    try:
        claims = decode_token(token)
        if claims.get("type") != "refresh":
            return
        jti = str(claims.get("jti"))
        user_id = int(str(claims.get("sub")))
    except (JWTError, ValueError, TypeError):
        return
    session = db.scalar(select(RefreshSession).where(RefreshSession.jti == jti, RefreshSession.user_id == user_id))
    if session is not None and session.revoked_at is None:
        session.revoked_at = datetime.now(timezone.utc)
        db.add(AttendanceEvent(user_id=user_id, event_type="USER_SIGNED_OUT", note="Signed out"))
        db.commit()
