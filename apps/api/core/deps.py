import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from core.config import settings
from database import get_db
from models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

worker_api_key_header = APIKeyHeader(name="X-Worker-Api-Key", auto_error=False)


def verify_worker_api_key(api_key: str = Depends(worker_api_key_header)) -> None:
    """
    Gates apps/api/routers/compute.py's endpoints -- local compute node
    processes are not logged-in users, so they authenticate with a shared
    key (core/config.py's WORKER_API_KEY) instead of a JWT.
    secrets.compare_digest avoids a timing side-channel on the comparison.
    """
    if not api_key or not secrets.compare_digest(api_key, settings.WORKER_API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing worker API key",
        )

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user
