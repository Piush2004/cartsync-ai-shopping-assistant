# `client`/`db_session` come from tests/conftest.py: an isolated in-memory
# database and a properly torn-down get_current_user override, so this file
# no longer reads/writes the real apps/api/cartsync.db (the old version of
# this file mutated app.dependency_overrides at *module import time* and
# never cleaned it up, leaking a stale override into every test that ran
# after it in the same session, and used get_db unoverridden against the
# real dev database).

def test_get_brands(client):
    response = client.get("/api/v1/stylist/brands")
    assert response.status_code == 200
    assert "Nike" in response.json()

def test_stylist_recommendation_missing_measurements(client):
    # If DB doesn't have EffectiveMeasurement for this user, it should 400
    response = client.get("/api/v1/stylist/recommendation?brand_name=Nike")
    assert response.status_code == 400
    assert "Missing effective measurements" in response.json()["detail"]
