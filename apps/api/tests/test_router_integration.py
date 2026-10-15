"""
Router-level integration tests: HTTP -> router -> dependency -> service ->
database -> response, for every router in the app.

This exists because the QA pass that preceded this file found that
/product-intelligence/recommendations and /conversation/chat 500'd on every
single request despite their underlying services having passing unit tests --
the routers wired the services together incorrectly and nothing exercised
that wiring. Service-level unit tests (test_stylist.py,
test_product_intelligence.py, test_conversation.py) are necessary but not
sufficient; every test in this file goes through TestClient and a real
router, never calling a service class directly.

Coverage matrix: auth, measurement, graph, stylist, product-intelligence,
conversation. Each section covers: a normal/positive path, an unauthorized
(401) path, and at least one negative/malformed-input path where the router
does its own validation beyond what test_regression_qa_hardening.py already
covers (that file owns the specific-bug regressions; this file owns the
router-completeness matrix).
"""
import uuid

from conftest import register_and_login
from models.measurement import EffectiveMeasurement
from models.graph import UserPreference, BrandAffinity


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _seed_measurements(db_session, user_id):
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


# ============================================================
# AUTH
# ============================================================

def test_register_then_login_then_me_round_trip(auth_client, db_session):
    email = "roundtrip@example.com"
    register_resp = auth_client.post("/api/v1/auth/register", json={"email": email, "password": "correct-horse-battery"})
    assert register_resp.status_code == 200
    assert register_resp.json()["email"] == email

    login_resp = auth_client.post("/api/v1/auth/login", data={"username": email, "password": "correct-horse-battery"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert login_resp.json()["token_type"] == "bearer"

    me_resp = auth_client.get("/api/v1/auth/me", headers=_auth_headers(token))
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email


def test_register_rejects_duplicate_email(auth_client, db_session):
    email = "dupe@example.com"
    first = auth_client.post("/api/v1/auth/register", json={"email": email, "password": "correct-horse-battery"})
    assert first.status_code == 200

    second = auth_client.post("/api/v1/auth/register", json={"email": email, "password": "another-password"})
    assert second.status_code == 400


def test_login_rejects_wrong_password(auth_client, db_session):
    email = "wrongpw@example.com"
    auth_client.post("/api/v1/auth/register", json={"email": email, "password": "correct-horse-battery"})
    resp = auth_client.post("/api/v1/auth/login", data={"username": email, "password": "not-the-password"})
    assert resp.status_code == 400


def test_login_rejects_unknown_user(auth_client, db_session):
    resp = auth_client.post("/api/v1/auth/login", data={"username": "nobody@example.com", "password": "whatever123"})
    assert resp.status_code == 400


def test_me_requires_authentication(auth_client, db_session):
    resp = auth_client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_rejects_garbage_token(auth_client, db_session):
    resp = auth_client.get("/api/v1/auth/me", headers=_auth_headers("not-a-real-jwt"))
    assert resp.status_code == 401


def test_register_rejects_malformed_email(auth_client, db_session):
    resp = auth_client.post("/api/v1/auth/register", json={"email": "not-an-email", "password": "correct-horse-battery"})
    assert resp.status_code == 422


# ============================================================
# MEASUREMENT
# ============================================================

def test_measurement_extract_requires_authentication(auth_client, db_session):
    resp = auth_client.post("/api/v1/measurement/extract", json={"source_type": "manual", "raw_data": {}})
    assert resp.status_code == 401


def test_measurement_history_empty_for_new_user(client, db_session):
    resp = client.get("/api/v1/measurement/history")
    assert resp.status_code == 200
    assert resp.json() == []


def test_measurement_history_reflects_prior_extracts(client, db_session):
    client.post("/api/v1/measurement/extract", json={"source_type": "manual", "raw_data": {"chest": 90.0}})
    client.post("/api/v1/measurement/extract", json={"source_type": "manual", "raw_data": {"chest": 91.0}})
    resp = client.get("/api/v1/measurement/history")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_measurement_history_requires_authentication(auth_client, db_session):
    resp = auth_client.get("/api/v1/measurement/history")
    assert resp.status_code == 401


def test_measurement_extract_missing_required_field_is_422(client, db_session):
    # source_type is a required field on MeasurementUpload.
    resp = client.post("/api/v1/measurement/extract", json={"raw_data": {}})
    assert resp.status_code == 422


# --- BUG: extract_measurements silently fabricated any measurement the
# client omitted (chest/waist defaulted to 95.0/82.0 +/- random jitter, hip
# to a fixed 100.0, inseam to 80.0, shoulder to 45.0) instead of leaving them
# null. A user submitting only a chest value would get four measurements
# back that nobody ever provided or computed.

def test_measurement_extract_does_not_fabricate_omitted_fields(client, db_session):
    resp = client.post(
        "/api/v1/measurement/extract",
        json={"source_type": "manual", "raw_data": {"chest": 96.0}},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["chest_circumference"] == 96.0
    assert body["waist_circumference"] is None
    assert body["hip_circumference"] is None
    assert body["inseam"] is None
    assert body["shoulder_width"] is None


def test_measurement_extract_manual_entry_confidence_is_full_not_fabricated(client, db_session):
    resp = client.post(
        "/api/v1/measurement/extract",
        json={"source_type": "manual", "raw_data": {"chest": 96.0}},
    )
    assert resp.status_code == 200
    body = resp.json()
    # Manual entry is the user's own stated value -- fully trusted (1.0), not
    # the old hardcoded 0.92 "AI confidence" that applied even to typed-in numbers.
    assert body["confidence_score"] == 1.0
    assert body["confidence_breakdown"] is None


def test_measurement_extract_camera_source_uses_real_confidence_breakdown(client, db_session):
    resp = client.post(
        "/api/v1/measurement/extract",
        json={
            "source_type": "camera",
            "raw_data": {"chest": 96.4},
            "model_version": "mediapipe-pose-landmarker-full-1",
            "algorithm_version": "geometric-v1",
            "calibration_method": "user_height",
            "confidence_breakdown": {
                "overall": 0.81,
                "pose": 0.9,
                "image_quality": 0.85,
                "calibration": 0.8,
                "geometry": 0.75,
                "front_side_consistency": 0.78,
            },
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["confidence_score"] == 0.81
    assert body["confidence_breakdown"]["pose"] == 0.9
    assert body["model_version"] == "mediapipe-pose-landmarker-full-1"
    assert body["calibration_method"] == "user_height"
    assert body["source_type"] == "camera"


def test_measurement_extract_rejects_confidence_breakdown_missing_overall(client, db_session):
    resp = client.post(
        "/api/v1/measurement/extract",
        json={
            "source_type": "camera",
            "raw_data": {"chest": 96.4},
            "confidence_breakdown": {"pose": 0.9},
        },
    )
    assert resp.status_code == 422


def test_measurement_extract_rejects_out_of_range_confidence(client, db_session):
    resp = client.post(
        "/api/v1/measurement/extract",
        json={
            "source_type": "camera",
            "raw_data": {"chest": 96.4},
            "confidence_breakdown": {"overall": 1.5},
        },
    )
    assert resp.status_code == 422


# ============================================================
# GRAPH
# ============================================================

def test_graph_me_requires_authentication(auth_client, db_session):
    resp = auth_client.get("/api/v1/graph/me")
    assert resp.status_code == 401


def test_graph_me_empty_profile_shape(client, db_session):
    resp = client.get("/api/v1/graph/me")
    assert resp.status_code == 200
    body = resp.json()
    assert body["effective_measurements"] is None
    assert body["brand_affinity"] == []
    assert body["profile_confidence"] == 0.0


def test_graph_me_reflects_seeded_data(client, db_session):
    _seed_measurements(db_session, user_id="fixture-test-user")
    db_session.add(BrandAffinity(id=str(uuid.uuid4()), user_id="fixture-test-user", brand_id="nike", affinity_score=0.8, size_offset=0.0))
    db_session.add(UserPreference(id=str(uuid.uuid4()), user_id="fixture-test-user", fit_preference="Slim"))
    db_session.commit()

    resp = client.get("/api/v1/graph/me")
    assert resp.status_code == 200
    body = resp.json()
    assert body["effective_measurements"]["chest_circumference"] == 95.0
    assert len(body["brand_affinity"]) == 1
    assert body["preferences"]["fit_preference"] == "Slim"
    assert body["profile_confidence"] > 0.0


# ============================================================
# STYLIST
# ============================================================

def test_stylist_recommendation_requires_authentication(auth_client, db_session):
    resp = auth_client.get("/api/v1/stylist/recommendation")
    assert resp.status_code == 401


def test_stylist_recommendation_with_measurements(client, db_session):
    _seed_measurements(db_session, user_id="fixture-test-user")
    resp = client.get("/api/v1/stylist/recommendation?brand_name=Nike")
    assert resp.status_code == 200
    body = resp.json()
    assert "recommended_size" in body


def test_stylist_history_is_empty_stub(client, db_session):
    # services/stylist history isn't implemented yet; the endpoint exists and
    # must not 500 or fabricate data -- it honestly returns an empty list.
    resp = client.get("/api/v1/stylist/history")
    assert resp.status_code == 200
    assert resp.json() == []


# --- BUG: routers/stylist.py's update_preferences created UserPreference(
# user_id=..., fit_preference=...) with no `id`. UserPreference.id has no
# server-side default (every other model-creation call site in this codebase
# supplies id=str(uuid.uuid4()) explicitly), so this crashed with an
# unhandled sqlite3.IntegrityError -> 500 the first time ANY user ever set a
# preference. Found by this test, not by a bug report.

def test_stylist_update_preferences_first_time_does_not_500(client, db_session):
    resp = client.post("/api/v1/stylist/preferences?fit_preference=Slim")
    assert resp.status_code == 200

    pref = db_session.query(UserPreference).filter(UserPreference.user_id == "fixture-test-user").first()
    assert pref is not None
    assert pref.fit_preference == "Slim"


def test_stylist_update_preferences_second_time_updates_existing_row(client, db_session):
    client.post("/api/v1/stylist/preferences?fit_preference=Slim")
    resp = client.post("/api/v1/stylist/preferences?fit_preference=Relaxed")
    assert resp.status_code == 200

    prefs = db_session.query(UserPreference).filter(UserPreference.user_id == "fixture-test-user").all()
    assert len(prefs) == 1
    assert prefs[0].fit_preference == "Relaxed"


# ============================================================
# PRODUCT INTELLIGENCE
# ============================================================

def test_product_intelligence_requires_authentication(auth_client, db_session):
    resp = auth_client.get("/api/v1/product-intelligence/recommendations")
    assert resp.status_code == 401


def test_product_intelligence_without_measurements_is_400(client, db_session):
    resp = client.get("/api/v1/product-intelligence/recommendations")
    assert resp.status_code == 400
    assert "Missing effective measurements" in resp.json()["detail"]


def test_product_intelligence_category_filter(client, db_session):
    _seed_measurements(db_session, user_id="fixture-test-user")
    all_resp = client.get("/api/v1/product-intelligence/recommendations")
    assert all_resp.status_code == 200
    all_products = all_resp.json()["products"]
    assert len(all_products) > 0

    category = all_products[0]["product"]["category"]
    filtered_resp = client.get(f"/api/v1/product-intelligence/recommendations?category={category}")
    assert filtered_resp.status_code == 200
    assert all(p["product"]["category"].lower() == category.lower() for p in filtered_resp.json()["products"])


# ============================================================
# CONVERSATION
# ============================================================

def test_conversation_chat_requires_authentication(auth_client, db_session):
    resp = auth_client.post("/api/v1/conversation/chat", json={"question": "What size should I buy?"})
    assert resp.status_code == 401


def test_conversation_chat_missing_question_is_422(client, db_session):
    resp = client.post("/api/v1/conversation/chat", json={})
    assert resp.status_code == 422


def test_conversation_chat_without_measurements_does_not_500(client, db_session):
    # No EffectiveMeasurement seeded for this user -- the sizing intent must
    # degrade gracefully (e.g. ask the user to provide measurements), not 500.
    resp = client.post("/api/v1/conversation/chat", json={"question": "What size should I buy?"})
    assert resp.status_code == 200


# ============================================================
# TESTING FEEDBACK
# ============================================================

def test_testing_feedback_requires_authentication(auth_client, db_session):
    resp = auth_client.post("/api/v1/testing/feedback", json={"capture_easy": True})
    assert resp.status_code == 401


def test_testing_feedback_submit_and_list_round_trip(client, db_session):
    submit_resp = client.post(
        "/api/v1/testing/feedback",
        json={
            "capture_easy": True,
            "instructions_clear": True,
            "photo_accepted": True,
            "measurements_believable": False,
            "measurement_that_seemed_wrong": "waist",
            "confusing_notes": "Wasn't sure how far to stand from the camera.",
        },
    )
    assert submit_resp.status_code == 200
    body = submit_resp.json()
    assert body["measurements_believable"] is False
    assert body["measurement_that_seemed_wrong"] == "waist"

    list_resp = client.get("/api/v1/testing/feedback")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1


def test_testing_feedback_all_fields_optional(client, db_session):
    resp = client.post("/api/v1/testing/feedback", json={})
    assert resp.status_code == 200


def test_testing_feedback_is_isolated_per_user(auth_client, db_session):
    token_a = register_and_login(auth_client, email="feedback-user-a@example.com")
    token_b = register_and_login(auth_client, email="feedback-user-b@example.com")

    auth_client.post(
        "/api/v1/testing/feedback",
        json={"general_notes": "user A's private feedback"},
        headers=_auth_headers(token_a),
    )

    resp_b = auth_client.get("/api/v1/testing/feedback", headers=_auth_headers(token_b))
    assert resp_b.status_code == 200
    assert resp_b.json() == [], "user B must not see user A's feedback"
