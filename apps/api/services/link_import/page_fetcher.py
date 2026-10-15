from typing import Iterable

import httpx

from services.http_safety import UnsafeUrlError, fetch_safely

# Real product-page hosts this feature is meant to support. Restricting to
# an allowlist (rather than "any http(s) URL") narrows the SSRF surface
# significantly for a feature whose whole job is fetching arbitrary
# user-supplied URLs server-side -- see services/http_safety.py.
ALLOWED_PRODUCT_HOSTS = [
    "amazon.com",
    "amazon.in",
    "amazon.co.uk",
    "flipkart.com",
    "myntra.com",
]


class FetchError(Exception):
    """
    Raised when the product page itself couldn't be retrieved: blocked by
    http_safety, a non-2xx response, or a network/timeout failure. Never
    returns partial or garbage HTML for the parser to guess at.
    """


def fetch_product_page(url: str, allowed_hosts: Iterable[str] = ALLOWED_PRODUCT_HOSTS) -> str:
    try:
        response = fetch_safely(url, allowed_hosts=allowed_hosts)
    except UnsafeUrlError as exc:
        raise FetchError(str(exc)) from exc
    except httpx.HTTPError as exc:
        # Covers timeouts, connection resets, DNS failures mid-request, etc.
        # -- real product pages are frequently slow or flaky (found live:
        # a Myntra listing that read-timed out), and this must surface as
        # the same honest FetchError as any other fetch failure, not an
        # unhandled 500.
        raise FetchError(f"Could not reach the page: {exc}") from exc

    if response.status_code >= 400:
        raise FetchError(f"Could not fetch page (HTTP {response.status_code})")
    return response.text
