"""
User tracking: sign-up method, last sign-in, sign-in count, and the admin
list that reads them. The admin list must stay closed to everyone but an
admin who signed in with Google.
"""
from datetime import datetime, timedelta

import pytest
from sqlalchemy.exc import OperationalError

from core.config import settings
from core.security import create_access_token
from models.user import User
from services import google_auth, user_tracking
from test_google_auth import CLIENT_ID, GOOGLE_JWK, make_token

ADMIN_EMAIL = "boss@gmail.com"


@pytest.fixture(autouse=True)
def google_and_admin(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_IDS", CLIENT_ID)
    monkeypatch.setattr(settings, "ADMIN_EMAILS", ADMIN_EMAIL)
    monkeypatch.setattr(google_auth, "_fetch_keys", lambda: [GOOGLE_JWK])
    google_auth.clear_key_cache()
    yield
    google_auth.clear_key_cache()


def register(client, email="sam@example.com", password="longenough1"):
    return client.post("/api/v1/auth/register", json={"email": email, "password": password})


def login(client, email="sam@example.com", password="longenough1"):
    return client.post("/api/v1/auth/login", data={"username": email, "password": password})


def google(client, **claims):
    return client.post("/api/v1/auth/google", json={"id_token": make_token(**claims)})


def row(db, email):
    db.expire_all()
    return db.query(User).filter(User.email == email).one()


def bearer(user_id):
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}


def make_admin(db, email=ADMIN_EMAIL, google_sub="g-admin"):
    user = User(id="admin-id", email=email, hashed_password="x", google_sub=google_sub, signup_method="google")
    db.add(user)
    db.commit()
    return user


# ---------- sign-up method ----------
def test_password_signup_is_recorded(auth_client, db_session):
    register(auth_client)
    u = row(db_session, "sam@example.com")
    assert u.signup_method == "password"
    assert u.login_count == 0
    assert u.last_login_at is None  # registering is not signing in


def test_google_signup_is_recorded_and_counts_as_a_sign_in(auth_client, db_session):
    assert google(auth_client, email="maya@gmail.com").status_code == 200
    u = row(db_session, "maya@gmail.com")
    assert u.signup_method == "google"
    assert u.last_login_method == "google"
    assert u.login_count == 1
    assert u.last_login_at is not None


# ---------- sign-in tracking ----------
def test_password_login_updates_the_numbers(auth_client, db_session):
    register(auth_client)
    before = datetime.utcnow() - timedelta(seconds=5)
    assert login(auth_client).status_code == 200
    u = row(db_session, "sam@example.com")
    assert u.login_count == 1
    assert u.last_login_method == "password"
    assert u.last_login_at >= before


def test_each_sign_in_adds_one(auth_client, db_session):
    register(auth_client)
    for _ in range(3):
        assert login(auth_client).status_code == 200
    assert row(db_session, "sam@example.com").login_count == 3


def test_google_sign_in_again_adds_one_and_keeps_signup_method(auth_client, db_session):
    google(auth_client, email="maya@gmail.com")
    google(auth_client, email="maya@gmail.com")
    u = row(db_session, "maya@gmail.com")
    assert u.login_count == 2
    assert u.signup_method == "google"


def test_wrong_password_is_not_counted(auth_client, db_session):
    register(auth_client)
    assert login(auth_client, password="wrong-password").status_code == 400
    u = row(db_session, "sam@example.com")
    assert u.login_count == 0
    assert u.last_login_at is None


def test_refused_google_sign_in_is_not_counted(auth_client, db_session):
    register(auth_client, email="maya@gmail.com")
    assert google(auth_client, email="maya@gmail.com").status_code == 409
    assert google(auth_client, email="x@gmail.com", aud="someone-else").status_code == 401
    assert row(db_session, "maya@gmail.com").login_count == 0
    assert db_session.query(User).count() == 1


def test_a_tracking_failure_does_not_stop_sign_in(auth_client, db_session, monkeypatch):
    register(auth_client)  # registering commits, so patch only after it

    def boom():
        raise OperationalError("UPDATE users", {}, Exception("database is locked"))

    # In login, the only commit is the tracking one.
    monkeypatch.setattr(db_session, "commit", boom)
    resp = login(auth_client)
    monkeypatch.undo()

    assert resp.status_code == 200
    assert "access_token" in resp.json()
    assert row(db_session, "sam@example.com").login_count == 0  # nothing half-written


def test_record_login_swallows_a_database_error_and_rolls_back():
    class BrokenSession:
        rolled_back = False

        def query(self, *a, **k):
            raise OperationalError("UPDATE users", {}, Exception("database is locked"))

        def rollback(self):
            self.rolled_back = True

    broken = BrokenSession()
    user_tracking.record_login(broken, "some-id", "password")  # must not raise
    assert broken.rolled_back


# ---------- the admin list: who may open it ----------
def test_admin_list_needs_a_login(auth_client):
    assert auth_client.get("/api/v1/admin/users").status_code == 401


def test_ordinary_user_is_refused(auth_client, db_session):
    register(auth_client)
    u = row(db_session, "sam@example.com")
    assert auth_client.get("/api/v1/admin/users", headers=bearer(u.id)).status_code == 403


def test_google_user_who_is_not_listed_is_refused(auth_client, db_session):
    google(auth_client, email="maya@gmail.com", sub="1")
    u = row(db_session, "maya@gmail.com")
    assert auth_client.get("/api/v1/admin/users", headers=bearer(u.id)).status_code == 403


def test_listed_email_without_google_is_refused(auth_client, db_session):
    # Someone registered the admin's address with a password before the admin
    # ever signed in. Being listed is not enough.
    register(auth_client, email=ADMIN_EMAIL)
    u = row(db_session, ADMIN_EMAIL)
    assert u.google_sub is None
    assert auth_client.get("/api/v1/admin/users", headers=bearer(u.id)).status_code == 403


def test_nobody_is_admin_when_the_list_is_empty(auth_client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_EMAILS", "")
    admin = make_admin(db_session)
    assert auth_client.get("/api/v1/admin/users", headers=bearer(admin.id)).status_code == 403


def test_admin_list_matches_email_in_any_case_and_with_spaces(auth_client, db_session, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_EMAILS", " other@x.com ,  BOSS@Gmail.com ")
    admin = make_admin(db_session)
    assert auth_client.get("/api/v1/admin/users", headers=bearer(admin.id)).status_code == 200


def test_a_real_google_admin_sign_in_end_to_end(auth_client):
    token = google(auth_client, email=ADMIN_EMAIL, sub="boss-1").json()["access_token"]
    resp = auth_client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["summary"]["total_users"] == 1


# ---------- the admin list: what it shows ----------
def test_admin_list_shows_users_and_numbers(auth_client, db_session):
    admin = make_admin(db_session)
    register(auth_client, email="sam@example.com")
    login(auth_client, email="sam@example.com")
    login(auth_client, email="sam@example.com")
    google(auth_client, email="maya@gmail.com", sub="2")

    body = auth_client.get("/api/v1/admin/users", headers=bearer(admin.id)).json()
    assert body["summary"]["total_users"] == 3
    assert body["summary"]["by_signup_method"] == {"google": 2, "password": 1}
    assert body["summary"]["new_last_7_days"] == 3
    assert body["summary"]["active_last_7_days"] == 2

    by_email = {u["email"]: u for u in body["users"]}
    assert by_email["sam@example.com"]["login_count"] == 2
    assert by_email["sam@example.com"]["signup_method"] == "password"
    assert by_email["maya@gmail.com"]["signup_method"] == "google"
    assert by_email["maya@gmail.com"]["last_login_at"] is not None


def test_admin_list_never_leaks_secrets(auth_client, db_session):
    admin = make_admin(db_session)
    register(auth_client)
    text = auth_client.get("/api/v1/admin/users", headers=bearer(admin.id)).text
    assert "hashed_password" not in text
    assert "google_sub" not in text
    assert "g-admin" not in text


def test_old_users_without_tracking_data_still_list(auth_client, db_session):
    admin = make_admin(db_session)
    old = User(id="old", email="old@example.com", hashed_password="x")
    old.signup_method = None
    old.login_count = 0
    db_session.add(old)
    db_session.commit()
    body = auth_client.get("/api/v1/admin/users", headers=bearer(admin.id)).json()
    assert body["summary"]["by_signup_method"]["password"] == 1  # null counts as password
    entry = next(u for u in body["users"] if u["email"] == "old@example.com")
    assert entry["last_login_at"] is None
    assert entry["login_count"] == 0


def test_admin_list_is_newest_first_and_pages(auth_client, db_session):
    admin = make_admin(db_session)
    now = datetime.utcnow()
    for i in range(5):
        db_session.add(
            User(id=f"u{i}", email=f"u{i}@example.com", hashed_password="x", created_at=now - timedelta(days=i))
        )
    db_session.commit()
    h = bearer(admin.id)

    first = auth_client.get("/api/v1/admin/users?limit=2", headers=h).json()
    assert [u["email"] for u in first["users"]][0] in ("boss@gmail.com", "u0@example.com")
    assert len(first["users"]) == 2
    assert first["summary"]["total_users"] == 6  # the summary counts everyone, not the page

    everyone = auth_client.get("/api/v1/admin/users", headers=h).json()["users"]
    second = auth_client.get("/api/v1/admin/users?limit=2&offset=2", headers=h).json()["users"]
    assert [u["id"] for u in second] == [u["id"] for u in everyone[2:4]]
    emails = [u["email"] for u in everyone if u["email"].startswith("u")]
    assert emails == ["u0@example.com", "u1@example.com", "u2@example.com", "u3@example.com", "u4@example.com"]


def test_admin_list_rejects_silly_paging(auth_client, db_session):
    admin = make_admin(db_session)
    h = bearer(admin.id)
    assert auth_client.get("/api/v1/admin/users?limit=0", headers=h).status_code == 422
    assert auth_client.get("/api/v1/admin/users?limit=100000", headers=h).status_code == 422
    assert auth_client.get("/api/v1/admin/users?offset=-1", headers=h).status_code == 422


def test_active_in_last_week_ignores_old_sign_ins(auth_client, db_session):
    admin = make_admin(db_session)
    db_session.add(
        User(
            id="stale", email="stale@example.com", hashed_password="x",
            last_login_at=datetime.utcnow() - timedelta(days=30), login_count=4,
        )
    )
    db_session.commit()
    body = auth_client.get("/api/v1/admin/users", headers=bearer(admin.id)).json()
    assert body["summary"]["active_last_7_days"] == 0


# ---------- the local report ----------
def test_report_script_lists_users_without_secrets(auth_client, db_session):
    import users_report

    register(auth_client)
    login(auth_client)
    google(auth_client, email="maya@gmail.com", sub="3")
    text = users_report.build_report(db_session)
    assert "Users: 2" in text
    assert "sam@example.com" in text and "maya@gmail.com" in text
    assert "google: 1" in text and "password: 1" in text
    assert "$2b$" not in text  # no password hashes
