from datetime import datetime, timedelta, timezone
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return password_context.verify(plain_password, password_hash)
    except (ValueError, TypeError):
        return False


def create_access_token(*, user_id: int, role: str) -> tuple[str, str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    token_id = str(uuid4())
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "jti": token_id,
        "iat": datetime.now(timezone.utc),
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm), token_id, expires_at


def create_refresh_token(*, user_id: int, role: str) -> tuple[str, str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    token_id = str(uuid4())
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "refresh",
        "jti": token_id,
        "iat": datetime.now(timezone.utc),
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm), token_id, expires_at


def decode_token(token: str) -> dict[str, object]:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


def token_error() -> type[JWTError]:
    return JWTError
