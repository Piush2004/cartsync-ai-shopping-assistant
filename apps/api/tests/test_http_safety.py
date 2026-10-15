"""
Unit tests for services/http_safety.py. socket.getaddrinfo is monkeypatched
throughout so these tests are deterministic and don't depend on real DNS --
"does this hostname map to an unsafe IP" is exactly the thing being tested,
so the mapping needs to be under test control, not whatever a real resolver
returns today.
"""
import socket

import httpx
import pytest

from services.http_safety import UnsafeUrlError, check_url_is_safe, fetch_safely


def _fake_addrinfo(ip: str):
    family = socket.AF_INET6 if ":" in ip else socket.AF_INET
    return [(family, socket.SOCK_STREAM, 6, "", (ip, 443))]


def _patch_dns(monkeypatch, mapping: dict):
    def fake_getaddrinfo(host, *args, **kwargs):
        if host not in mapping:
            raise socket.gaierror(f"no fake DNS entry for {host}")
        return _fake_addrinfo(mapping[host])

    monkeypatch.setattr(socket, "getaddrinfo", fake_getaddrinfo)


def test_blocks_loopback(monkeypatch):
    _patch_dns(monkeypatch, {"evil.example": "127.0.0.1"})
    with pytest.raises(UnsafeUrlError, match="disallowed address"):
        check_url_is_safe("http://evil.example/")


def test_blocks_cloud_metadata_endpoint(monkeypatch):
    _patch_dns(monkeypatch, {"evil.example": "169.254.169.254"})
    with pytest.raises(UnsafeUrlError, match="disallowed address"):
        check_url_is_safe("http://evil.example/latest/meta-data/")


@pytest.mark.parametrize("ip", ["10.0.0.5", "192.168.1.1", "172.16.0.1"])
def test_blocks_rfc1918_private_ranges(monkeypatch, ip):
    _patch_dns(monkeypatch, {"evil.example": ip})
    with pytest.raises(UnsafeUrlError, match="disallowed address"):
        check_url_is_safe("http://evil.example/")


def test_blocks_ipv6_loopback(monkeypatch):
    _patch_dns(monkeypatch, {"evil.example": "::1"})
    with pytest.raises(UnsafeUrlError, match="disallowed address"):
        check_url_is_safe("http://evil.example/")


@pytest.mark.parametrize("scheme", ["ftp", "file", "gopher", "javascript"])
def test_blocks_non_http_schemes(scheme):
    with pytest.raises(UnsafeUrlError, match="Unsupported URL scheme"):
        check_url_is_safe(f"{scheme}://example.com/")


def test_blocks_unresolvable_host(monkeypatch):
    _patch_dns(monkeypatch, {})
    with pytest.raises(UnsafeUrlError, match="Could not resolve"):
        check_url_is_safe("http://does-not-exist.example/")


def test_allows_real_public_host(monkeypatch):
    _patch_dns(monkeypatch, {"shop.example": "93.184.216.34"})
    check_url_is_safe("https://shop.example/product/123")  # must not raise


def test_allowlist_rejects_host_not_in_list(monkeypatch):
    _patch_dns(monkeypatch, {"amazon.com": "93.184.216.34"})
    with pytest.raises(UnsafeUrlError, match="Host not allowed"):
        check_url_is_safe("https://amazon.com/", allowed_hosts=["flipkart.com"])


def test_allowlist_accepts_exact_and_subdomain_match(monkeypatch):
    _patch_dns(monkeypatch, {
        "flipkart.com": "93.184.216.34",
        "www.flipkart.com": "93.184.216.34",
    })
    check_url_is_safe("https://flipkart.com/p/x", allowed_hosts=["flipkart.com"])
    check_url_is_safe("https://www.flipkart.com/p/x", allowed_hosts=["flipkart.com"])


def test_allowlist_rejects_lookalike_domain(monkeypatch):
    # "notflipkart.com" must not match an allowlist entry of "flipkart.com"
    # via a naive substring/suffix check.
    _patch_dns(monkeypatch, {"notflipkart.com": "93.184.216.34"})
    with pytest.raises(UnsafeUrlError, match="Host not allowed"):
        check_url_is_safe("https://notflipkart.com/", allowed_hosts=["flipkart.com"])


def test_fetch_safely_returns_response_for_safe_url(monkeypatch):
    _patch_dns(monkeypatch, {"shop.example": "93.184.216.34"})

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, text="<html>ok</html>")

    client = httpx.Client(transport=httpx.MockTransport(handler))
    response = fetch_safely("https://shop.example/product/123", client=client)
    assert response.status_code == 200
    assert response.text == "<html>ok</html>"


def test_fetch_safely_follows_safe_redirect(monkeypatch):
    _patch_dns(monkeypatch, {
        "shop.example": "93.184.216.34",
        "cdn.example": "93.184.216.35",
    })

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "shop.example":
            return httpx.Response(302, headers={"location": "https://cdn.example/final"})
        return httpx.Response(200, text="final page")

    client = httpx.Client(transport=httpx.MockTransport(handler))
    response = fetch_safely("https://shop.example/product/123", client=client)
    assert response.status_code == 200
    assert response.text == "final page"


def test_fetch_safely_rejects_redirect_into_private_ip(monkeypatch):
    # This is the exact bypass fetch_safely exists to close: the *initial*
    # URL is safe, but the server 302s somewhere unsafe. A plain
    # follow_redirects=True client would sail right through this.
    _patch_dns(monkeypatch, {
        "shop.example": "93.184.216.34",
        "internal.example": "127.0.0.1",
    })

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "shop.example":
            return httpx.Response(302, headers={"location": "http://internal.example/secrets"})
        raise AssertionError("must never reach the redirect target")

    client = httpx.Client(transport=httpx.MockTransport(handler))
    with pytest.raises(UnsafeUrlError, match="disallowed address"):
        fetch_safely("https://shop.example/product/123", client=client)
