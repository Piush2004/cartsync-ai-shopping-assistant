"""
Print who has signed up, how, and when they last signed in.

    cd apps/api
    venv\\Scripts\\python users_report.py            (all users, newest first)
    venv\\Scripts\\python users_report.py --limit 20

Reads the database this machine's backend uses, so it needs no login and works
before Google sign-in is set up. It never prints password hashes. Times are UTC.
"""
import argparse
from datetime import datetime, timedelta

from sqlalchemy import func

from database import SessionLocal
from models.user import User


def _fmt(value):
    return value.strftime("%Y-%m-%d %H:%M") if value else "-"


def build_report(db, limit=None):
    week_ago = datetime.utcnow() - timedelta(days=7)
    total = db.query(func.count(User.id)).scalar() or 0
    by_method = dict(
        db.query(func.coalesce(User.signup_method, "password"), func.count(User.id))
        .group_by(func.coalesce(User.signup_method, "password"))
        .all()
    )
    new_week = db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar() or 0
    active_week = db.query(func.count(User.id)).filter(User.last_login_at >= week_ago).scalar() or 0

    query = db.query(User).order_by(User.created_at.desc(), User.id)
    if limit:
        query = query.limit(limit)

    lines = [
        f"Users: {total}   ({', '.join(f'{k}: {v}' for k, v in sorted(by_method.items())) or 'none'})",
        f"New in last 7 days: {new_week}   Signed in during last 7 days: {active_week}",
        "",
        f"{'EMAIL':<36} {'HOW':<9} {'SIGNED UP':<17} {'LAST SIGN-IN':<17} {'TIMES':>5}",
    ]
    for u in query.all():
        lines.append(
            f"{(u.email or '')[:36]:<36} {(u.signup_method or 'password'):<9} "
            f"{_fmt(u.created_at):<17} {_fmt(u.last_login_at):<17} {u.login_count or 0:>5}"
        )
    return "\n".join(lines)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--limit", type=int, default=None, help="show only the newest N users")
    args = parser.parse_args()
    session = SessionLocal()
    try:
        print(build_report(session, args.limit))
    finally:
        session.close()
