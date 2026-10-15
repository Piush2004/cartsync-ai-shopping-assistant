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
    account_status = Column(String, default=AccountStatus.ACTIVE.value)
    created_at = Column(DateTime, default=datetime.utcnow)
