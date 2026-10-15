"""
Integration tests for /vton/try-on. FalClient is replaced with a stub at the
router's import site (routers.vton.FalClient) -- these tests exercise auth,
validation, error propagation, and rate limiting through real HTTP, never a
real (billed) fal.ai call. services/vton/fal_client.py's own contract is
covered separately in tests/test_fal_client.py against a mocked transport.
"""
import httpx

import routers.vton as vton_router
from conftest import register_and_login

PERSON_FILE = ("person.jpg", b"fake-person-bytes", "image/jpeg")
GARMENT_FILE = ("garment.png", b"fake-garment-bytes", "image/png")


class _StubFalClient:
    """Replaces routers.vton.FalClient for a single test via monkeypatch."""

    def __init__(self, *, image_url=None, error=None):
        self.image_url = image_url
        self.error = error
        self.calls = []
        self.closed = False

    def try_on(self, person_bytes, person_content_type, garment_bytes, garment_content_type):
        self.calls.append((person_bytes, person_content_type, garment_bytes, garment_content_type))
        if self.error:
            raise self.error
        return self.image_url

    def close(self):
        self.closed = True


def _install_stub(monkeypatch, **kwargs):
    stub = _StubFalClient(**kwargs)
    monkeypatch.setattr(vton_router, "FalClient", lambda: stub)
    return stub


def _try_on(auth_client, token, files=None):
    return auth_client.post(
        "/api/v1/vton/try-on",
        headers={"Authorization": f"Bearer {token}"},
        files=files or {"person_image": PERSON_FILE, "garment_image": GARMENT_FILE},
    )


def test_try_on_requires_auth(auth_client):
    resp = auth_client.post(
        "/api/v1/vton/try-on",
        files={"person_image": PERSON_FILE, "garment_image": GARMENT_FILE},
    )
    assert resp.status_code == 401


def test_try_on_success_returns_result_image_url(auth_client, db_session, monkeypatch):
    stub = _install_stub(monkeypatch, image_url="https://cdn.fal.ai/result.png")
    token = register_and_login(auth_client, email="vton-success@example.com")

    resp = _try_on(auth_client, token)

    assert resp.status_code == 200, resp.text
    assert resp.json() == {"image_url": "https://cdn.fal.ai/result.png"}
    assert len(stub.calls) == 1
    person_bytes, person_ct, garment_bytes, garment_ct = stub.calls[0]
    assert person_bytes == b"fake-person-bytes"
    assert person_ct == "image/jpeg"
    assert garment_bytes == b"fake-garment-bytes"
    assert garment_ct == "image/png"
    assert stub.closed is True


def test_try_on_propagates_fal_error_as_502(auth_client, db_session, monkeypatch):
    _install_stub(monkeypatch, error=vton_router.FalApiError("NSFW content detected"))
    token = register_and_login(auth_client, email="vton-fal-error@example.com")

    resp = _try_on(auth_client, token)

    assert resp.status_code == 502
    assert "NSFW content detected" in resp.json()["detail"]


def test_try_on_returns_502_when_fal_client_construction_itself_fails(auth_client, db_session, monkeypatch):
    # Regression test: FalClient() raises FalApiError directly from its
    # constructor when FAL_API_KEY isn't configured (see
    # services/vton/fal_client.py). An earlier version of this router
    # constructed FalClient() *before* the try block, so that specific
    # failure escaped as an unhandled 500 instead of an honest 502 --
    # caught only by an end-to-end curl request against a real server, not
    # by the other tests here (which all replace an already-constructed
    # stub, never exercising the constructor path itself).
    def _raise_not_configured():
        raise vton_router.FalApiError("Virtual Try-On is not configured (FAL_API_KEY is not set)")

    monkeypatch.setattr(vton_router, "FalClient", _raise_not_configured)
    token = register_and_login(auth_client, email="vton-not-configured@example.com")

    resp = _try_on(auth_client, token)

    assert resp.status_code == 502
    assert "not configured" in resp.json()["detail"]


def test_try_on_rejects_non_image_content_type(auth_client, db_session, monkeypatch):
    _install_stub(monkeypatch, image_url="https://cdn.fal.ai/result.png")
    token = register_and_login(auth_client, email="vton-bad-type@example.com")

    resp = _try_on(auth_client, token, files={
        "person_image": ("person.txt", b"not an image", "text/plain"),
        "garment_image": GARMENT_FILE,
    })

    assert resp.status_code == 422
    assert "person_image" in resp.json()["detail"]


def test_try_on_rejects_oversized_image(auth_client, db_session, monkeypatch):
    _install_stub(monkeypatch, image_url="https://cdn.fal.ai/result.png")
    monkeypatch.setattr(vton_router, "MAX_IMAGE_BYTES", 10)
    token = register_and_login(auth_client, email="vton-oversized@example.com")

    resp = _try_on(auth_client, token)

    assert resp.status_code == 422
    assert "8MB" in resp.json()["detail"] or "exceeds" in resp.json()["detail"]


def test_try_on_returns_429_after_rate_limit_threshold(auth_client, db_session, monkeypatch):
    _install_stub(monkeypatch, image_url="https://cdn.fal.ai/result.png")
    token = register_and_login(auth_client, email="vton-burst@example.com")

    statuses = [_try_on(auth_client, token).status_code for _ in range(7)]

    assert statuses[:5] == [200] * 5
    assert all(s == 429 for s in statuses[5:])


class _FakeImageResponse:
    def __init__(self, status_code=200, content_type="image/jpeg", content=b"fake-remote-image-bytes"):
        self.status_code = status_code
        self.headers = {"content-type": content_type}
        self.content = content


def test_try_on_accepts_garment_image_url_instead_of_upload(auth_client, db_session, monkeypatch):
    stub = _install_stub(monkeypatch, image_url="https://cdn.fal.ai/result.png")
    monkeypatch.setattr(vton_router, "fetch_safely", lambda url: _FakeImageResponse())
    token = register_and_login(auth_client, email="vton-url-garment@example.com")

    resp = auth_client.post(
        "/api/v1/vton/try-on",
        headers={"Authorization": f"Bearer {token}"},
        files={"person_image": PERSON_FILE},
        data={"garment_image_url": "https://cdn.example.com/product.jpg"},
    )

    assert resp.status_code == 200, resp.text
    assert len(stub.calls) == 1
    _, _, garment_bytes, garment_ct = stub.calls[0]
    assert garment_bytes == b"fake-remote-image-bytes"
    assert garment_ct == "image/jpeg"


def test_try_on_rejects_garment_image_url_blocked_by_http_safety(auth_client, db_session, monkeypatch):
    _install_stub(monkeypatch, image_url="https://cdn.fal.ai/result.png")

    def raise_unsafe(url):
        raise vton_router.UnsafeUrlError("Host resolves to a disallowed address: 127.0.0.1")

    monkeypatch.setattr(vton_router, "fetch_safely", raise_unsafe)
    token = register_and_login(auth_client, email="vton-ssrf-attempt@example.com")

    resp = auth_client.post(
        "/api/v1/vton/try-on",
        headers={"Authorization": f"Bearer {token}"},
        files={"person_image": PERSON_FILE},
        data={"garment_image_url": "http://127.0.0.1:8000/api/v1/health"},
    )

    assert resp.status_code == 422
    assert "disallowed address" in resp.json()["detail"]


def test_try_on_rejects_garment_image_url_on_network_timeout(auth_client, db_session, monkeypatch):
    # Regression test: found live -- fetch_safely's real httpx errors
    # (timeouts, connection failures) weren't caught here, only
    # UnsafeUrlError, so a slow/unreachable image URL propagated as an
    # unhandled 500 instead of an honest 422. Same class of bug as
    # link_import's page_fetcher.py (see test_page_fetcher.py).
    def raise_timeout(url):
        raise httpx.ReadTimeout("The read operation timed out")

    _install_stub(monkeypatch, image_url="https://cdn.fal.ai/result.png")
    monkeypatch.setattr(vton_router, "fetch_safely", raise_timeout)
    token = register_and_login(auth_client, email="vton-timeout-garment@example.com")

    resp = auth_client.post(
        "/api/v1/vton/try-on",
        headers={"Authorization": f"Bearer {token}"},
        files={"person_image": PERSON_FILE},
        data={"garment_image_url": "https://slow.example/product.jpg"},
    )

    assert resp.status_code == 422
    assert "Could not fetch garment_image_url" in resp.json()["detail"]


def test_try_on_rejects_garment_image_url_with_non_image_content_type(auth_client, db_session, monkeypatch):
    _install_stub(monkeypatch, image_url="https://cdn.fal.ai/result.png")
    monkeypatch.setattr(vton_router, "fetch_safely", lambda url: _FakeImageResponse(content_type="text/html"))
    token = register_and_login(auth_client, email="vton-non-image-url@example.com")

    resp = auth_client.post(
        "/api/v1/vton/try-on",
        headers={"Authorization": f"Bearer {token}"},
        files={"person_image": PERSON_FILE},
        data={"garment_image_url": "https://example.com/not-an-image"},
    )

    assert resp.status_code == 422
    assert "JPEG, PNG, or WebP" in resp.json()["detail"]


def test_try_on_rejects_when_neither_garment_image_nor_url_given(auth_client, db_session, monkeypatch):
    _install_stub(monkeypatch, image_url="https://cdn.fal.ai/result.png")
    token = register_and_login(auth_client, email="vton-missing-garment@example.com")

    resp = auth_client.post(
        "/api/v1/vton/try-on",
        headers={"Authorization": f"Bearer {token}"},
        files={"person_image": PERSON_FILE},
    )

    assert resp.status_code == 422
    assert "Provide either garment_image or garment_image_url" in resp.json()["detail"]


def test_try_on_rejects_when_both_garment_image_and_url_given(auth_client, db_session, monkeypatch):
    _install_stub(monkeypatch, image_url="https://cdn.fal.ai/result.png")
    token = register_and_login(auth_client, email="vton-both-garment@example.com")

    resp = auth_client.post(
        "/api/v1/vton/try-on",
        headers={"Authorization": f"Bearer {token}"},
        files={"person_image": PERSON_FILE, "garment_image": GARMENT_FILE},
        data={"garment_image_url": "https://cdn.example.com/product.jpg"},
    )

    assert resp.status_code == 422
    assert "not both" in resp.json()["detail"]
