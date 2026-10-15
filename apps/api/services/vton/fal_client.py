import base64
import time
from typing import Optional

import httpx

from core.config import settings

# FASHN v1.6 via fal.ai's hosted queue -- runs in fal's cloud, not on this
# machine's GPU. Chosen because local IDM-VTON/SMPL inference is blocked on
# this laptop's hardware (RTX 5060 / Blackwell CUDA ecosystem immaturity,
# confirmed earlier this session); a cloud API sidesteps that entirely.
FAL_MODEL_ID = "fal-ai/fashn/tryon/v1.6"
FAL_QUEUE_BASE_URL = "https://queue.fal.run"

DEFAULT_POLL_INTERVAL_SECONDS = 2.0
DEFAULT_TIMEOUT_SECONDS = 60.0


class FalApiError(Exception):
    """
    Raised for any fal.ai failure -- missing API key, a rejected request
    (e.g. content moderation), a failed generation, or a timeout. Callers
    must surface the real message to the user, never substitute a
    fabricated try-on result.
    """


class FalClient:
    def __init__(self, transport: Optional[httpx.BaseTransport] = None):
        # transport is exposed purely so tests can inject httpx.MockTransport
        # instead of hitting the real fal.ai API (which costs real money per
        # call) -- production code never passes it, so it always gets
        # httpx.Client's real default transport.
        if not settings.FAL_API_KEY:
            raise FalApiError("Virtual Try-On is not configured (FAL_API_KEY is not set)")
        self._client = httpx.Client(
            headers={"Authorization": f"Key {settings.FAL_API_KEY}"},
            timeout=30.0,
            transport=transport,
        )

    def close(self) -> None:
        self._client.close()

    def try_on(
        self,
        person_image_bytes: bytes,
        person_content_type: str,
        garment_image_bytes: bytes,
        garment_content_type: str,
        poll_interval_seconds: float = DEFAULT_POLL_INTERVAL_SECONDS,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
    ) -> str:
        """
        Submits a try-on job and blocks until it completes, following fal's
        own documented "subscribe" pattern (their recommended approach for
        fast inference models, as opposed to the async queue+webhook pattern
        meant for slow training jobs). Returns the result image's URL.
        """
        submission = self._submit(person_image_bytes, person_content_type, garment_image_bytes, garment_content_type)
        self._await_completion(submission["status_url"], poll_interval_seconds, timeout_seconds)
        return self._fetch_result_image_url(submission["response_url"])

    def _submit(
        self,
        person_image_bytes: bytes,
        person_content_type: str,
        garment_image_bytes: bytes,
        garment_content_type: str,
    ) -> dict:
        response = self._client.post(
            f"{FAL_QUEUE_BASE_URL}/{FAL_MODEL_ID}",
            json={
                "model_image": _to_data_uri(person_image_bytes, person_content_type),
                "garment_image": _to_data_uri(garment_image_bytes, garment_content_type),
            },
        )
        _raise_for_fal_error(response)
        return response.json()

    def _await_completion(self, status_url: str, poll_interval_seconds: float, timeout_seconds: float) -> None:
        deadline = time.monotonic() + timeout_seconds
        while True:
            response = self._client.get(status_url)
            _raise_for_fal_error(response)
            status_data = response.json()
            status = status_data.get("status")

            # fal.ai reports a failed generation (e.g. content moderation, no
            # person detected) as status COMPLETED *with* an `error` field --
            # per their docs, `error` is "present only if the request
            # failed (only when COMPLETED)". Checking status == COMPLETED
            # first, before checking for error, would treat that failure as
            # a success and go on to fetch a result that was never produced.
            if status_data.get("error"):
                raise FalApiError(status_data["error"])
            if status == "COMPLETED":
                return
            if time.monotonic() > deadline:
                raise FalApiError("Try-on generation timed out")
            time.sleep(poll_interval_seconds)

    def _fetch_result_image_url(self, response_url: str) -> str:
        response = self._client.get(response_url)
        _raise_for_fal_error(response)
        images = response.json().get("images") or []
        if not images:
            raise FalApiError("fal.ai returned no result image")
        return images[0]["url"]


def _to_data_uri(image_bytes: bytes, content_type: str) -> str:
    encoded = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{content_type};base64,{encoded}"


def _raise_for_fal_error(response: httpx.Response) -> None:
    if response.status_code >= 400:
        try:
            detail = response.json().get("detail") or response.text
        except Exception:
            detail = response.text
        raise FalApiError(f"fal.ai request failed ({response.status_code}): {detail}")
