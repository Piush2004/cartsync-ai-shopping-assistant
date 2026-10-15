import ipaddress
import socket
from typing import Iterable, Optional
from urllib.parse import urlparse

import httpx

ALLOWED_SCHEMES = {"http", "https"}
DEFAULT_MAX_REDIRECTS = 5
DEFAULT_TIMEOUT_SECONDS = 10.0
# A realistic browser UA -- some sites serve stripped-down/blocked content
# to requests that don't send one, though this is not a bot-detection
# bypass and isn't meant to be; see link_import's honest-failure design.
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


class UnsafeUrlError(Exception):
    """
    Raised when a user-supplied URL fails SSRF safety validation: not
    http(s), resolves to a private/loopback/reserved/link-local address
    (e.g. 127.0.0.1, 169.254.169.254's cloud metadata endpoint, 10.x/
    192.168.x internal ranges), or isn't on an allowed hostname list when
    one is required. link_import and vton's garment-from-URL path both
    fetch a URL the user supplies directly -- this is the shared guard
    against pointing this backend at itself or at internal infrastructure.
    """


def _hostname_matches_allowlist(hostname: str, allowed_hosts: Iterable[str]) -> bool:
    hostname = hostname.lower()
    for allowed in allowed_hosts:
        allowed = allowed.lower()
        if hostname == allowed or hostname.endswith("." + allowed):
            return True
    return False


def _is_unsafe_ip(ip_str: str) -> bool:
    ip = ipaddress.ip_address(ip_str)
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    )


def check_url_is_safe(url: str, allowed_hosts: Optional[Iterable[str]] = None) -> None:
    """
    Raises UnsafeUrlError if `url` isn't safe to fetch server-side on
    behalf of user-supplied input.

    Known residual limitation: this resolves the hostname and validates
    the result, then a separate connection is made moments later that
    re-resolves DNS itself -- a DNS-rebinding attacker controlling both
    the domain and a very short TTL could theoretically return a
    different (unsafe) IP between the two lookups. Full protection would
    mean pinning the validated IP and connecting to it directly (bypassing
    httpx's own resolution), which is meaningfully more complex than this
    feature's risk level (a shopping-assistant link importer, not a
    high-value target) justifies right now. This closes off the realistic,
    common SSRF payloads (localhost, cloud metadata endpoints, RFC1918
    ranges) that a hostile input would actually try.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ALLOWED_SCHEMES:
        raise UnsafeUrlError(f"Unsupported URL scheme: {parsed.scheme!r}")
    if not parsed.hostname:
        raise UnsafeUrlError("URL has no hostname")

    if allowed_hosts is not None and not _hostname_matches_allowlist(parsed.hostname, allowed_hosts):
        raise UnsafeUrlError(f"Host not allowed: {parsed.hostname}")

    try:
        addrinfo = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror as exc:
        raise UnsafeUrlError(f"Could not resolve host: {parsed.hostname}") from exc

    resolved_ips = {info[4][0] for info in addrinfo}
    if not resolved_ips:
        raise UnsafeUrlError(f"Could not resolve host: {parsed.hostname}")
    for ip_str in resolved_ips:
        if _is_unsafe_ip(ip_str):
            raise UnsafeUrlError(f"Host resolves to a disallowed address: {ip_str}")


def fetch_safely(
    url: str,
    *,
    allowed_hosts: Optional[Iterable[str]] = None,
    max_redirects: int = DEFAULT_MAX_REDIRECTS,
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
    client: Optional[httpx.Client] = None,
) -> httpx.Response:
    """
    GETs `url`, re-validating SSRF safety on every redirect hop. Plain
    httpx `follow_redirects=True` would happily follow a 30x response
    straight into a private IP after only the *initial* URL passed
    validation -- exactly the bypass this exists to close, so redirects
    are followed manually here instead, one hop at a time.
    """
    owns_client = client is None
    http_client = client or httpx.Client(timeout=timeout_seconds)
    try:
        current_url = url
        for _ in range(max_redirects + 1):
            check_url_is_safe(current_url, allowed_hosts=allowed_hosts)
            response = http_client.get(
                current_url,
                headers={"User-Agent": DEFAULT_USER_AGENT},
                follow_redirects=False,
            )
            if response.is_redirect:
                location = response.headers.get("location")
                if not location:
                    return response
                current_url = str(httpx.URL(current_url).join(location))
                continue
            return response
        raise UnsafeUrlError("Too many redirects")
    finally:
        if owns_client:
            http_client.close()
