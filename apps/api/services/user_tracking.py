"""
Keeps track of users: when each one last signed in, how, and how many times.

Tracking must never stop someone from signing in, so a failure here is logged
and swallowed. It stores no IP address and no device details.
"""
import logging
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models.user import User

logger = logging.getLogger("cartsync")

PASSWORD = "password"
GOOGLE = "google"


def record_login(db: Session, user_id: str, method: str) -> None:
    """Note one successful sign-in. One atomic UPDATE, so two sign-ins at the
    same moment both count."""
    try:
        db.query(User).filter(User.id == user_id).update(
            {
                User.last_login_at: datetime.utcnow(),
                User.last_login_method: method,
                User.login_count: func.coalesce(User.login_count, 0) + 1,
            },
            synchronize_session=False,
        )
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        logger.warning("Could not record sign-in", exc_info=True)
