"""
Integration tests for /link-import/preview. fetch_product_page and
extract_product are replaced at routers.link_import's import site via
monkeypatch -- these tests exercise auth, the fit-guide wiring, and error
mapping through real HTTP, never a real network fetch.
"""
import uuid

import routers.link_import as link_import_router
from conftest import register_and_login
from models.graph import UserPreference
from models.measurement import EffectiveMeasurement
from models.user import User
from services.link_import import ExtractedProduct, ExtractionError, FetchError


def _seed_measurements_and_preference(db_session, user_id, fit_preference="Regular"):
    db_session.add(EffectiveMeasurement(
        id=str(uuid.uuid4()),
        user_id=user_id,
        chest_circumference=95.0,
        waist_circumference=82.0,
        confidence_score=0.92,
    ))
    db_session.add(UserPreference(id=str(uuid.uuid4()), user_id=user_id, fit_preference=fit_preference))
    db_session.commit()


def _register_and_get_user_id(auth_client, db_session, email):
    token = register_and_login(auth_client, email=email)
    user = db_session.query(User).filter(User.email == email).first()
    return token, user.id


def _install_success(monkeypatch, product: ExtractedProduct):
    monkeypatch.setattr(link_import_router, "fetch_product_page", lambda url: "<html>fake</html>")
    monkeypatch.setattr(link_import_router, "extract_product", lambda html, source_url: product)


def _preview(auth_client, token, url="https://www.flipkart.com/product/123"):
    return auth_client.post(
        "/api/v1/link-import/preview",
        headers={"Authorization": f"Bearer {token}"},
        json={"url": url},
    )


SAMPLE_PRODUCT = ExtractedProduct(
    name="Van Heusen Slim Fit Shirt",
    brand="Van Heusen",
    image_url="https://cdn.example.com/shirt.jpg",
    price=1299.0,
)


def test_preview_requires_auth(auth_client):
    resp = auth_client.post("/api/v1/link-import/preview", json={"url": "https://www.flipkart.com/x"})
    assert resp.status_code == 401


def test_preview_success_with_fit_guide(auth_client, db_session, monkeypatch):
    _install_success(monkeypatch, SAMPLE_PRODUCT)
    token, user_id = _register_and_get_user_id(auth_client, db_session, "link-import-with-fit@example.com")
    _seed_measurements_and_preference(db_session, user_id)

    resp = _preview(auth_client, token)

    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["name"] == "Van Heusen Slim Fit Shirt"
    assert body["brand"] == "Van Heusen"
    assert body["image_url"] == "https://cdn.example.com/shirt.jpg"
    assert body["price"] == 1299.0
    assert body["fit_guide"] is not None
    assert "recommended_size" in body["fit_guide"]


def test_preview_success_without_measurements_returns_null_fit_guide(auth_client, db_session, monkeypatch):
    _install_success(monkeypatch, SAMPLE_PRODUCT)
    token, _ = _register_and_get_user_id(auth_client, db_session, "link-import-no-measurements@example.com")

    resp = _preview(auth_client, token)

    assert resp.status_code == 200, resp.text
    assert resp.json()["fit_guide"] is None
    assert resp.json()["name"] == "Van Heusen Slim Fit Shirt"


def test_preview_without_brand_skips_fit_guide_even_with_measurements(auth_client, db_session, monkeypatch):
    _install_success(monkeypatch, ExtractedProduct(
        name="Mystery Item", brand=None, image_url="https://cdn.example.com/x.jpg", price=None,
    ))
    token, user_id = _register_and_get_user_id(auth_client, db_session, "link-import-no-brand@example.com")
    _seed_measurements_and_preference(db_session, user_id)

    resp = _preview(auth_client, token)

    assert resp.status_code == 200
    assert resp.json()["fit_guide"] is None


def test_preview_returns_422_when_fetch_fails(auth_client, db_session, monkeypatch):
    def raise_fetch_error(url):
        raise FetchError("Could not fetch page (HTTP 403)")

    monkeypatch.setattr(link_import_router, "fetch_product_page", raise_fetch_error)
    token, _ = _register_and_get_user_id(auth_client, db_session, "link-import-fetch-fail@example.com")

    resp = _preview(auth_client, token)

    assert resp.status_code == 422
    assert "403" in resp.json()["detail"]


def test_preview_returns_422_when_extraction_fails(auth_client, db_session, monkeypatch):
    monkeypatch.setattr(link_import_router, "fetch_product_page", lambda url: "<html>no product data</html>")

    def raise_extraction_error(html, source_url):
        raise ExtractionError("Could not find product details (name/image) on this page")

    monkeypatch.setattr(link_import_router, "extract_product", raise_extraction_error)
    token, _ = _register_and_get_user_id(auth_client, db_session, "link-import-extract-fail@example.com")

    resp = _preview(auth_client, token)

    assert resp.status_code == 422
    assert "Could not find product details" in resp.json()["detail"]


def test_preview_returns_429_after_rate_limit_threshold(auth_client, db_session, monkeypatch):
    _install_success(monkeypatch, SAMPLE_PRODUCT)
    token, _ = _register_and_get_user_id(auth_client, db_session, "link-import-burst@example.com")

    statuses = [_preview(auth_client, token).status_code for _ in range(12)]

    assert statuses[:10] == [200] * 10
    assert all(s == 429 for s in statuses[10:])
