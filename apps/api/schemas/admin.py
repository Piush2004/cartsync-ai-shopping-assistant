from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel


class AdminUser(BaseModel):
    """One row of the user list. Never includes the password hash or Google id."""
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    signup_method: Optional[str] = None
    account_status: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    last_login_method: Optional[str] = None
    login_count: int = 0

    class Config:
        from_attributes = True


class AdminSummary(BaseModel):
    total_users: int
    by_signup_method: Dict[str, int]
    new_last_7_days: int
    # Signed in at least once in the last 7 days.
    active_last_7_days: int


class AdminUsersResponse(BaseModel):
    summary: AdminSummary
    limit: int
    offset: int
    users: List[AdminUser]
