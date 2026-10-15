from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserResponse
from schemas.auth import Token
from core.security import verify_password, get_password_hash, create_access_token
from core.deps import get_current_user
from core.rate_limit import limiter
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
    
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

