from typing import Optional, Tuple

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from core.deps import get_current_user
from core.rate_limit import limiter
from models.user import User
from schemas.vton import VTONResponse
from services.http_safety import UnsafeUrlError, fetch_safely
from services.vton import FalClient, FalApiError

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8MB -- generous for a phone photo, cheap to reject before paying for a fal.ai call


def _read_validated_image(upload: UploadFile, field_name: str) -> bytes:
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=422, detail=f"{field_name} must be a JPEG, PNG, or WebP image")
    # .file (not the async .read()) -- this endpoint is a plain `def`, like
    # every other router in this codebase, so FastAPI runs it in a
    # threadpool rather than on the event loop. That matters here
    # specifically: FalClient.try_on() below blocks synchronously for the
    # entire generation (often 10-20s), and an `async def` handler calling a
    # blocking function directly would freeze every other concurrent request
    # on this single-process backend for that whole duration.
    data = upload.file.read()
    if not data:
        raise HTTPException(status_code=422, detail=f"{field_name} is empty")
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=422, detail=f"{field_name} exceeds the 8MB limit")
    return data


def _fetch_validated_image_from_url(url: str, field_name: str) -> Tuple[bytes, str]:
    # No hostname allowlist here (unlike link_import's page_fetcher) --
    # product images from a link-import preview live on CDN domains (e.g.
    # m.media-amazon.com) that don't match the product page's own domain.
    # http_safety's IP-range/scheme checks still apply, which is the part
    # that actually matters for SSRF: this endpoint is fetching a
    # user-supplied URL server-side, same risk class as link_import.
    try:
        response = fetch_safely(url)
    except UnsafeUrlError as exc:
        raise HTTPException(status_code=422, detail=f"{field_name}_url is not a fetchable image URL: {exc}")
    except httpx.HTTPError as exc:
        # Same gap link_import's page_fetcher had: timeouts/connection
        # errors from fetch_safely aren't UnsafeUrlError and must not
        # escape as an unhandled 500.
        raise HTTPException(status_code=422, detail=f"Could not fetch {field_name}_url: {exc}")

    if response.status_code >= 400:
        raise HTTPException(status_code=422, detail=f"Could not fetch {field_name}_url (HTTP {response.status_code})")

    content_type = (response.headers.get("content-type") or "").split(";")[0].strip()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=422, detail=f"{field_name}_url did not point to a JPEG, PNG, or WebP image")

    data = response.content
    if not data:
        raise HTTPException(status_code=422, detail=f"{field_name}_url returned an empty image")
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=422, detail=f"{field_name}_url's image exceeds the 8MB limit")

    return data, content_type


@router.post("/try-on", response_model=VTONResponse)
@limiter.limit("5/minute")
def try_on(
    request: Request,
    person_image: UploadFile = File(...),
    garment_image: Optional[UploadFile] = File(None),
    garment_image_url: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
):
    person_bytes = _read_validated_image(person_image, "person_image")

    # Garment image comes from exactly one of: a direct upload (the
    # original flow), or a URL (from the link-import preview flow, so the
    # user doesn't have to download-then-reupload a product photo they
    # just saw extracted on screen).
    if garment_image is not None and garment_image_url:
        raise HTTPException(status_code=422, detail="Provide either garment_image or garment_image_url, not both")
    if garment_image is not None:
        garment_bytes = _read_validated_image(garment_image, "garment_image")
        garment_content_type = garment_image.content_type
    elif garment_image_url:
        garment_bytes, garment_content_type = _fetch_validated_image_from_url(garment_image_url, "garment_image")
    else:
        raise HTTPException(status_code=422, detail="Provide either garment_image or garment_image_url")

    # FalClient() itself raises FalApiError when FAL_API_KEY isn't configured
    # (see services/vton/fal_client.py), so it has to be inside the try too --
    # constructing it before the try block let that specific failure escape
    # as an unhandled 500 instead of the intended honest 502.
    client = None
    try:
        client = FalClient()
        image_url = client.try_on(
            person_bytes, person_image.content_type,
            garment_bytes, garment_content_type,
        )
    except FalApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    finally:
        if client is not None:
            client.close()

    return VTONResponse(image_url=image_url)
