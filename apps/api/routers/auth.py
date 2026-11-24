from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserResponse
from schemas.auth import AuthConfig, GoogleLoginRequest, Token
from core.config import settings
from services.google_auth import (
    GoogleAuthError,
    GoogleUnavailableError,
    verify_google_id_token,
)
from services.user_tracking import GOOGLE, PASSWORD, record_login
from core.security import verify_password, get_password_hash, create_access_token
from core.deps import get_current_user
from core.rate_limit import limiter
import secrets
import uuid

router = APIRouter()

# Both endpoints run before a user is authenticated, so the limiter falls back
# to IP-based keying (see core/rate_limit.py) -- this is what actually caps
# credential-stuffing / registration-spam attempts.
@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
def register(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = User(
        id=str(uuid.uuid4()),
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        signup_method=PASSWORD,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    user_id = user.id
    record_login(db, user_id, PASSWORD)
    return {
        "access_token": create_access_token(user_id),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


def _google_client_ids() -> list:
    return [c.strip() for c in settings.GOOGLE_CLIENT_IDS.split(",") if c.strip()]


@router.get("/config", response_model=AuthConfig)
def auth_config():
    """
    What the app needs to know before sign-in. The Google client ID is public
    (it is in every Google sign-in screen); serving it here means the app
    needs no rebuild when it changes.
    """
    ids = _google_client_ids()
    return {"google_client_id": ids[0] if ids else None}


@router.post("/google", response_model=Token)
@limiter.limit("10/minute")
def login_with_google(request: Request, body: GoogleLoginRequest, db: Session = Depends(get_db)):
    ids = _google_client_ids()
    if not ids:
        raise HTTPException(status_code=503, detail="Google sign-in is not set up on this server.")

    try:
        identity = verify_google_id_token(body.id_token, ids)
    except GoogleUnavailableError:
        raise HTTPException(
            status_code=503,
            detail="Could not reach Google to check your sign-in. Try again in a moment.",
        )
    except GoogleAuthError as exc:
        raise HTTPException(status_code=401, detail=f"Google sign-in failed: {exc}.")

    user = db.query(User).filter(User.google_sub == identity.sub).first()
    if user is None:
        existing = db.query(User).filter(User.email == identity.email).first()
        if existing is not None:
            # Same email, but an account made with a password. Do NOT merge
            # them automatically: passwords are not email-verified here, so
            # someone could have registered a stranger's address in advance
            # and would keep access after the real owner signs in with Google.
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists. Sign in with your email and password instead.",
            )
        first_name = (identity.name or "").split(" ")[0] or None
        user = User(
            id=str(uuid.uuid4()),
            email=identity.email,
            # Nobody knows this password, so password login is impossible
            # for a Google-only account.
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            google_sub=identity.sub,
            signup_method=GOOGLE,
            first_name=first_name,
            avatar=identity.picture,
        )
        db.add(user)
        try:
            db.commit()
        except IntegrityError:
            # Two first sign-ins for the same person arrived together; the
            # other one won. Use the account it made.
            db.rollback()
            user = db.query(User).filter(User.google_sub == identity.sub).first()
            if user is None:
                raise HTTPException(status_code=409, detail="Could not create your account. Try again.")
        else:
            db.refresh(user)

    user_id = user.id
    record_login(db, user_id, GOOGLE)
    return {
        "access_token": create_access_token(user_id),
        "token_type": "bearer",
    }
