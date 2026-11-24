from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.deps import get_admin_user
from database import get_db
from models.user import User
from schemas.admin import AdminSummary, AdminUsersResponse

router = APIRouter()


@router.get("/users", response_model=AdminUsersResponse)
def list_users(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """
    Who has signed up, how, and when they last signed in. Newest first.
    Times are UTC. Only an admin (see core/deps.get_admin_user) may call this.
    """
    week_ago = datetime.utcnow() - timedelta(days=7)

    by_method = dict(
        db.query(func.coalesce(User.signup_method, "password"), func.count(User.id))
        .group_by(func.coalesce(User.signup_method, "password"))
        .all()
    )
    summary = AdminSummary(
        total_users=db.query(func.count(User.id)).scalar() or 0,
        by_signup_method={k: int(v) for k, v in by_method.items()},
        new_last_7_days=db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar() or 0,
        active_last_7_days=db.query(func.count(User.id)).filter(User.last_login_at >= week_ago).scalar() or 0,
    )

    users = (
        db.query(User)
        .order_by(User.created_at.desc(), User.id)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return AdminUsersResponse(summary=summary, limit=limit, offset=offset, users=users)
