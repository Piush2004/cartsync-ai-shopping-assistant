from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    # Upper bound of 72 matches bcrypt's hard limit (core/security.py raises
    # ValueError -> unhandled 500 past that instead of truncating) so oversized
    # passwords are rejected with a clean 422 before ever reaching bcrypt.
    password: str = Field(min_length=8, max_length=72)

class UserResponse(UserBase):
    id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar: Optional[str] = None
    account_status: Optional[str] = "active"
    created_at: datetime

    class Config:
        from_attributes = True
