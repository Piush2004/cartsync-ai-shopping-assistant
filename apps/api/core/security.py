from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
import bcrypt
from core.config import settings

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # bcrypt raises ValueError past 72 bytes instead of truncating; treat an
    # oversized login password as a non-match rather than letting it crash the
    # request (a client can otherwise 500 the login endpoint at will).
    if len(plain_password.encode('utf-8')) > 72:
        return False
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    if len(password.encode('utf-8')) > 72:
        raise ValueError("Password must not exceed 72 bytes")
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

