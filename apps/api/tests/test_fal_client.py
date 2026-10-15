"""
Unit tests for services/vton/fal_client.py against a mocked HTTP transport
(httpx.MockTransport) -- never the real fal.ai API, which bills per call.
"""
import httpx
import pytest

from core.config import settings
from services.vton import FalApiError, FalClient

SUBMIT_URL = "https://queue.fal.run/fal-ai/fashn/tryon/v1.6"
STATUS_URL = "https://queue.fal.run/fal-ai/fashn/tryon/v1.6/requests/req-1/status"
RESPONSE_URL = "https://queue.fal.run/fal-ai/fashn/tryon/v1.6/requests/req-1/response"

SUBMIT_RESPONSE = {
    "request_id": "req-1",
    "status_url": STATUS_URL,
    "response_url": RESPONSE_URL,
    "cancel_url": "https://queue.fal.run/fal-ai/fashn/tryon/v1.6/requests/req-1/cancel",
    "queue_position": 0,
}


@pytest.fixture(autouse=True)
def fal_api_key(monkeypatch):
    monkeypatch.setattr(settings, "FAL_API_KEY", "test-fal-key")


def _client_with_handler(handler) -> FalClient:
    return FalClient(transport=httpx.MockTransport(handler))


def test_missing_api_key_raises_before_any_http_call(monkeypatch):
    monkeypatch.setattr(settings, "FAL_API_KEY", "")
    with pytest.raises(FalApiError, match="not configured"):
        FalClient()


def test_try_on_success_returns_result_image_url():
    call_log = []

    def handler(request: httpx.Request) -> httpx.Response:
        call_log.append(str(request.url))
        if str(request.url) == SUBMIT_URL:
            assert request.headers["Authorization"] == "Key test-fal-key"
            return httpx.Response(200, json=SUBMIT_RESPONSE)
        if str(request.url) == STATUS_URL:
            return httpx.Response(200, json={"status": "COMPLETED", "request_id": "req-1"})
        if str(request.url) == RESPONSE_URL:
            return httpx.Response(200, json={"images": [{"url": "https://cdn.fal.ai/result.png"}]})
        raise AssertionError(f"unexpected URL {request.url}")

    client = _client_with_handler(handler)
    try:
        result = client.try_on(b"person-bytes", "image/jpeg", b"garment-bytes", "image/png", poll_interval_seconds=0.01)
    finally:
        client.close()

    assert result == "https://cdn.fal.ai/result.png"
    assert call_log == [SUBMIT_URL, STATUS_URL, RESPONSE_URL]


def test_try_on_polls_through_in_queue_and_in_progress():
    statuses = iter(["IN_QUEUE", "IN_PROGRESS", "COMPLETED"])

    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == SUBMIT_URL:
            return httpx.Response(200, json=SUBMIT_RESPONSE)
        if str(request.url) == STATUS_URL:
            return httpx.Response(200, json={"status": next(statuses), "request_id": "req-1"})
        if str(request.url) == RESPONSE_URL:
            return httpx.Response(200, json={"images": [{"url": "https://cdn.fal.ai/result.png"}]})
        raise AssertionError(f"unexpected URL {request.url}")

    client = _client_with_handler(handler)
    try:
        result = client.try_on(b"p", "image/jpeg", b"g", "image/png", poll_interval_seconds=0.01)
    finally:
        client.close()

    assert result == "https://cdn.fal.ai/result.png"
    with pytest.raises(StopIteration):
        next(statuses)  # confirms all three statuses were actually consumed


def test_try_on_raises_on_generation_error():
    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == SUBMIT_URL:
            return httpx.Response(200, json=SUBMIT_RESPONSE)
        if str(request.url) == STATUS_URL:
            return httpx.Response(200, json={
                "status": "COMPLETED", "request_id": "req-1",
                "error": "NSFW content detected in garment_image",
            })
        raise AssertionError(f"unexpected URL {request.url}")

    client = _client_with_handler(handler)
    try:
        with pytest.raises(FalApiError, match="NSFW content detected"):
            client.try_on(b"p", "image/jpeg", b"g", "image/png", poll_interval_seconds=0.01)
    finally:
        client.close()


def test_try_on_raises_on_submit_http_error():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(400, json={"detail": "invalid image data"})

    client = _client_with_handler(handler)
    try:
        with pytest.raises(FalApiError, match="invalid image data"):
            client.try_on(b"p", "image/jpeg", b"g", "image/png", poll_interval_seconds=0.01)
    finally:
        client.close()


def test_try_on_raises_on_timeout():
    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == SUBMIT_URL:
            return httpx.Response(200, json=SUBMIT_RESPONSE)
        if str(request.url) == STATUS_URL:
            return httpx.Response(200, json={"status": "IN_PROGRESS", "request_id": "req-1"})
        raise AssertionError(f"unexpected URL {request.url}")

    client = _client_with_handler(handler)
    try:
        with pytest.raises(FalApiError, match="timed out"):
            client.try_on(b"p", "image/jpeg", b"g", "image/png", poll_interval_seconds=0.01, timeout_seconds=0.03)
    finally:
        client.close()


def test_try_on_raises_when_no_images_in_result():
    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == SUBMIT_URL:
            return httpx.Response(200, json=SUBMIT_RESPONSE)
        if str(request.url) == STATUS_URL:
            return httpx.Response(200, json={"status": "COMPLETED", "request_id": "req-1"})
        if str(request.url) == RESPONSE_URL:
            return httpx.Response(200, json={"images": []})
        raise AssertionError(f"unexpected URL {request.url}")

    client = _client_with_handler(handler)
    try:
        with pytest.raises(FalApiError, match="no result image"):
            client.try_on(b"p", "image/jpeg", b"g", "image/png", poll_interval_seconds=0.01)
    finally:
        client.close()
