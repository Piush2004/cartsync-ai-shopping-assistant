"""
Integration tests for the rate limiter added in core/rate_limit.py.

Exercises real HTTP requests through TestClient (not the limiter/key function
in isolation), since the thing that actually matters is that FastAPI wires
the decorator + exception handler + middleware together correctly.
"""
import uuid

from conftest import register_and_login


# --- /auth/login and /auth/register: unauthenticated, so keyed by client IP.
# TestClient's default client host is constant ("testclient"), so every call
# within a test lands in the same bucket -- exactly what we want to exercise
# a burst against a single IP.

def test_login_allows_requests_under_threshold(auth_client, db_session):
    register_and_login(auth_client, email="under-threshold@example.com")
    # register_and_login already did 1 register + 1 login; 3 more logins
    # (wrong password, so a fast 400, not a 200) still fit under 5/minute.
    for _ in range(3):
        resp = auth_client.post(
            "/api/v1/auth/login",
            data={"username": "under-threshold@example.com", "password": "wrong-password"},
        )
        assert resp.status_code == 400


def test_login_returns_429_after_threshold(auth_client, db_session):
    email = "burst-login@example.com"
    auth_client.post("/api/v1/auth/register", json={"email": email, "password": "correct-horse-battery"})

    statuses = []
    for _ in range(7):
        resp = auth_client.post(
            "/api/v1/auth/login",
            data={"username": email, "password": "wrong-password"},
        )
        statuses.append(resp.status_code)

    # 1 register call already used part of... no, register and login are
    # separate limiter keys per-route (slowapi scopes by function+key), so
    # login's own 5/minute budget applies fresh: first 5 are 400 (bad creds),
    # the rest are 429.
    assert statuses[:5] == [400] * 5
    assert all(s == 429 for s in statuses[5:])


def test_register_returns_429_after_threshold(auth_client, db_session):
    statuses = []
    for i in range(7):
        resp = auth_client.post(
            "/api/v1/auth/register",
            json={"email": f"burst-register-{i}@example.com", "password": "correct-horse-battery"},
        )
        statuses.append(resp.status_code)

    assert statuses[:5] == [200] * 5
    assert all(s == 429 for s in statuses[5:])


def test_rate_limit_429_response_shape(auth_client, db_session):
    for i in range(6):
        resp = auth_client.post(
            "/api/v1/auth/register",
            json={"email": f"shape-check-{i}@example.com", "password": "correct-horse-battery"},
        )
    assert resp.status_code == 429
    body = resp.json()
    assert "detail" in body or "error" in body


# --- /measurement/extract, /conversation/chat, /product-intelligence/recommendations:
# authenticated, so keyed by the JWT's `sub` claim -- one user's usage must
# never affect another user's quota.

def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_measurement_extract_allows_requests_under_threshold(auth_client, db_session):
    token = register_and_login(auth_client, email="measure-normal@example.com")
    for _ in range(5):  # well under the 10/minute limit
        resp = auth_client.post(
            "/api/v1/measurement/extract",
            json={"source_type": "manual", "raw_data": {"chest": 96.0}},
            headers=_auth_headers(token),
        )
        assert resp.status_code == 200


def test_measurement_extract_returns_429_after_threshold(auth_client, db_session):
    token = register_and_login(auth_client, email="measure-burst@example.com")
    statuses = []
    for _ in range(12):
        resp = auth_client.post(
            "/api/v1/measurement/extract",
            json={"source_type": "manual", "raw_data": {"chest": 96.0}},
            headers=_auth_headers(token),
        )
        statuses.append(resp.status_code)

    assert statuses[:10] == [200] * 10
    assert all(s == 429 for s in statuses[10:])


def test_measurement_extract_rate_limit_is_isolated_per_user(auth_client, db_session):
    token_a = register_and_login(auth_client, email="measure-user-a@example.com")
    token_b = register_and_login(auth_client, email="measure-user-b@example.com")

    # Exhaust user A's quota.
    for _ in range(10):
        resp = auth_client.post(
            "/api/v1/measurement/extract",
            json={"source_type": "manual", "raw_data": {"chest": 96.0}},
            headers=_auth_headers(token_a),
        )
        assert resp.status_code == 200

    # User A is now rate-limited...
    blocked = auth_client.post(
        "/api/v1/measurement/extract",
        json={"source_type": "manual", "raw_data": {"chest": 96.0}},
        headers=_auth_headers(token_a),
    )
    assert blocked.status_code == 429

    # ...but user B, who hasn't made any requests yet, is unaffected.
    unaffected = auth_client.post(
        "/api/v1/measurement/extract",
        json={"source_type": "manual", "raw_data": {"chest": 96.0}},
        headers=_auth_headers(token_b),
    )
    assert unaffected.status_code == 200


def test_measurement_extract_without_token_is_401_not_429(auth_client, db_session):
    # No Authorization header at all -> the auth dependency rejects the
    # request before the endpoint (and its rate-limit check) ever runs.
    resp = auth_client.post(
        "/api/v1/measurement/extract",
        json={"source_type": "manual", "raw_data": {"chest": 96.0}},
    )
    assert resp.status_code == 401


def test_conversation_chat_rate_limit_isolated_per_user(auth_client, db_session):
    token_a = register_and_login(auth_client, email="chat-user-a@example.com")
    token_b = register_and_login(auth_client, email="chat-user-b@example.com")

    for _ in range(20):
        resp = auth_client.post(
            "/api/v1/conversation/chat",
            json={"question": "What size should I buy?"},
            headers=_auth_headers(token_a),
        )
        assert resp.status_code == 200

    blocked = auth_client.post(
        "/api/v1/conversation/chat",
        json={"question": "What size should I buy?"},
        headers=_auth_headers(token_a),
    )
    assert blocked.status_code == 429

    unaffected = auth_client.post(
        "/api/v1/conversation/chat",
        json={"question": "What size should I buy?"},
        headers=_auth_headers(token_b),
    )
    assert unaffected.status_code == 200


def _seed_effective_measurement(db_session, user_id):
    from models.measurement import EffectiveMeasurement
    db_session.add(EffectiveMeasurement(
        id=str(uuid.uuid4()),
        user_id=user_id,
        chest_circumference=95.0,
        waist_circumference=82.0,
        hip_circumference=100.0,
        inseam=80.0,
        shoulder_width=45.0,
        confidence_score=0.92,
    ))
    db_session.commit()


def test_product_intelligence_recommendations_rate_limit(auth_client, db_session):
    token = register_and_login(auth_client, email="pi-burst@example.com")
    from database import get_db
    from main import app
    from models.user import User
    user = db_session.query(User).filter(User.email == "pi-burst@example.com").first()
    _seed_effective_measurement(db_session, user.id)

    statuses = []
    for _ in range(32):
        resp = auth_client.get(
            "/api/v1/product-intelligence/recommendations",
            headers=_auth_headers(token),
        )
        statuses.append(resp.status_code)

    assert statuses[:30] == [200] * 30
    assert all(s == 429 for s in statuses[30:])


def test_rate_limit_resets_after_window(auth_client, db_session, monkeypatch):
    # Verify the limiter is time-windowed, not a permanent lockout: fast-forward
    # slowapi's own clock past the 1-minute window and confirm requests succeed
    # again, instead of sleeping the test for 60 real seconds.
    from core.rate_limit import limiter
    import time as time_module

    email = "reset-check@example.com"
    auth_client.post("/api/v1/auth/register", json={"email": email, "password": "correct-horse-battery"})

    for _ in range(5):
        resp = auth_client.post(
            "/api/v1/auth/login",
            data={"username": email, "password": "wrong-password"},
        )
        assert resp.status_code == 400

    exhausted = auth_client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "wrong-password"},
    )
    assert exhausted.status_code == 429

    real_time = time_module.time
    monkeypatch.setattr(time_module, "time", lambda: real_time() + 61)

    recovered = auth_client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "wrong-password"},
    )
    assert recovered.status_code == 400  # allowed through again, just bad creds
