"""
Regression tests for bugs found during the production-hardening QA pass.

Each test documents the concrete bug it guards against so the reason for its
existence survives future refactors.
"""
import math
import uuid

from fastapi.testclient import TestClient

from main import app
from core.deps import get_current_user
from database import get_db
from models.user import User
from models.measurement import EffectiveMeasurement


def _seed_measurements(db_session, user_id="fixture-test-user"):
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


# --- BUG: routers/product_intelligence.py and routers/conversation.py built
# StylistContext(measurements=..., preferences=..., brand_name=...) instead of
# the real (chest, waist, brand_name, fit_preference) fields, and called a
# non-existent StylistEngine.generate(). Both endpoints 500'd on every request.

def test_product_intelligence_recommendations_does_not_500(client, db_session):
    _seed_measurements(db_session)
    response = client.get("/api/v1/product-intelligence/recommendations")
    assert response.status_code == 200
    body = response.json()
    assert "products" in body


def test_conversation_chat_sizing_intent_does_not_500(client, db_session):
    _seed_measurements(db_session)
    response = client.post("/api/v1/conversation/chat", json={"question": "What size should I buy?"})
    assert response.status_code == 200
    assert "size" in response.json()["answer"].lower()


def test_conversation_chat_product_intent_does_not_500(client, db_session):
    _seed_measurements(db_session)
    response = client.post("/api/v1/conversation/chat", json={"question": "Can you recommend a good shirt?"})
    assert response.status_code == 200


def test_conversation_chat_brand_intent_does_not_500(client, db_session):
    _seed_measurements(db_session)
    response = client.post("/api/v1/conversation/chat", json={"question": "Does Zara fit me?"})
    assert response.status_code == 200


# --- BUG: MeasurementUpload.raw_data was Dict[str, Any] with zero validation.
# Negative, non-finite (NaN/Infinity), and absurd values were silently stored
# with a hardcoded confidence_score of 0.92 regardless of input sanity.

def test_measurement_extract_rejects_negative_value(client, db_session):
    response = client.post(
        "/api/v1/measurement/extract",
        json={"source_type": "manual", "raw_data": {"chest": -50}},
    )
    assert response.status_code == 422


def test_measurement_extract_rejects_absurd_value(client, db_session):
    response = client.post(
        "/api/v1/measurement/extract",
        json={"source_type": "manual", "raw_data": {"chest": 999999}},
    )
    assert response.status_code == 422


def test_measurement_extract_rejects_non_numeric_value(client, db_session):
    response = client.post(
        "/api/v1/measurement/extract",
        json={"source_type": "manual", "raw_data": {"chest": "abc"}},
    )
    assert response.status_code == 422


def test_measurement_extract_rejects_nan_without_crashing(client, db_session):
    # Regression for a second bug: a NaN anywhere in the body used to crash the
    # *error response* itself (json.dumps(allow_nan=False)), turning a 422 into
    # an unhandled 500. Must stay a clean 422.
    response = client.post(
        "/api/v1/measurement/extract",
        content=b'{"source_type":"manual","raw_data":{"chest": NaN}}',
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422


def test_measurement_extract_accepts_plausible_value(client, db_session):
    response = client.post(
        "/api/v1/measurement/extract",
        json={"source_type": "manual", "raw_data": {"chest": 96.5, "waist": 80.0}},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["chest_circumference"] == 96.5
    assert math.isfinite(body["confidence_score"])


# --- BUG: CORS allowed allow_origins=["*"] with allow_credentials=True, which
# Starlette turns into reflecting any Origin back — any site could make
# credentialed requests. Must now be an explicit allowlist.

def test_cors_does_not_wildcard_with_credentials():
    for middleware in app.user_middleware:
        if middleware.cls.__name__ == "CORSMiddleware":
            kwargs = middleware.kwargs
            assert kwargs.get("allow_credentials") is True
            assert "*" not in kwargs.get("allow_origins", []), (
                "allow_origins must never be '*' while allow_credentials=True"
            )
            return
    raise AssertionError("CORSMiddleware not registered")


# --- BUG: UserCreate.password had no length bounds. Empty passwords were
# accepted (200), and passwords over bcrypt's 72-byte limit crashed
# get_password_hash with an unhandled ValueError -> 500 instead of a 422.
# core/security.py also needed a fix since login (OAuth2PasswordRequestForm)
# isn't covered by the UserCreate schema at all.

def test_register_rejects_empty_password(client, db_session):
    response = client.post("/api/v1/auth/register", json={"email": "empty-pw@example.com", "password": ""})
    assert response.status_code == 422


def test_register_rejects_oversized_password(client, db_session):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "long-pw@example.com", "password": "a" * 100000},
    )
    assert response.status_code == 422


def test_login_with_oversized_password_does_not_500(client, db_session):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "nonexistent@example.com", "password": "a" * 10000},
    )
    assert response.status_code == 400


# --- IDOR / BOLA: user A must never be able to read user B's knowledge graph
# or measurements. All routers scope queries by the JWT-derived current_user.id,
# so this is a regression guard on that invariant, not a fix for a found hole.

def test_user_cannot_read_another_users_measurements(db_session):
    user_a = User(id="user-a", email="a@example.com")
    user_b = User(id="user-b", email="b@example.com")
    _seed_measurements(db_session, user_id="user-a")

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        app.dependency_overrides[get_current_user] = lambda: user_b
        with TestClient(app) as c:
            response = c.get("/api/v1/graph/me")
        assert response.status_code == 200
        assert response.json()["effective_measurements"] is None, (
            "user-b must not see user-a's measurements"
        )
    finally:
        del app.dependency_overrides[get_db]
        app.dependency_overrides.pop(get_current_user, None)
