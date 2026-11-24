from sqlalchemy import Column, String, Integer, DateTime, Enum
from database import Base
from datetime import datetime
import enum

class AccountStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BANNED = "banned"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    # Google's stable id for this person (the token's `sub`). Set only for
    # accounts created through Google sign-in.
    google_sub = Column(String, unique=True, index=True, nullable=True)
    account_status = Column(String, default=AccountStatus.ACTIVE.value)
    created_at = Column(DateTime, default=datetime.utcnow)

    # --- User tracking (who signed up, how, and when they last signed in) ---
    # How the account was first made: "password" or "google". Never changes.
    signup_method = Column(String, nullable=True, default="password")
    # Set on each successful sign-in. NULL = has not signed in since tracking
    # began. A token lasts days, so this is "last sign-in", not "last seen".
    last_login_at = Column(DateTime, nullable=True)
    last_login_method = Column(String, nullable=True)
    login_count = Column(Integer, nullable=False, default=0, server_default="0")
