"""
Unit tests for services/link_import/page_fetcher.py. fetch_safely is
mocked at this module's import site -- no real network calls.
"""
import httpx
import pytest

import services.link_import.page_fetcher as page_fetcher
from services.link_import import FetchError
from services.http_safety import UnsafeUrlError


def test_fetch_product_page_returns_html_on_success(monkeypatch):
    monkeypatch.setattr(page_fetcher, "fetch_safely", lambda url, allowed_hosts=None: httpx.Response(200, text="<html>ok</html>"))
    assert page_fetcher.fetch_product_page("https://www.myntra.com/p/1") == "<html>ok</html>"


def test_fetch_product_page_raises_fetch_error_on_http_error_status(monkeypatch):
    monkeypatch.setattr(page_fetcher, "fetch_safely", lambda url, allowed_hosts=None: httpx.Response(404))
    with pytest.raises(FetchError, match="HTTP 404"):
        page_fetcher.fetch_product_page("https://www.myntra.com/p/1")


def test_fetch_product_page_raises_fetch_error_on_unsafe_url(monkeypatch):
    def raise_unsafe(url, allowed_hosts=None):
        raise UnsafeUrlError("Host not allowed: evil.example")

    monkeypatch.setattr(page_fetcher, "fetch_safely", raise_unsafe)
    with pytest.raises(FetchError, match="Host not allowed"):
        page_fetcher.fetch_product_page("https://evil.example/p/1")


def test_fetch_product_page_raises_fetch_error_on_network_timeout(monkeypatch):
    # Regression test: found live, not in a mock -- a real Myntra listing
    # page read-timed out, and fetch_safely's httpx.ReadTimeout propagated
    # as an unhandled 500 instead of the intended honest FetchError,
    # because only UnsafeUrlError was caught here, not real network
    # failures (timeouts, connection resets, DNS failures mid-request).
    def raise_timeout(url, allowed_hosts=None):
        raise httpx.ReadTimeout("The read operation timed out")

    monkeypatch.setattr(page_fetcher, "fetch_safely", raise_timeout)
    with pytest.raises(FetchError, match="Could not reach the page"):
        page_fetcher.fetch_product_page("https://www.myntra.com/p/1")


def test_fetch_product_page_raises_fetch_error_on_connect_error(monkeypatch):
    def raise_connect_error(url, allowed_hosts=None):
        raise httpx.ConnectError("Connection refused")

    monkeypatch.setattr(page_fetcher, "fetch_safely", raise_connect_error)
    with pytest.raises(FetchError, match="Could not reach the page"):
        page_fetcher.fetch_product_page("https://www.myntra.com/p/1")
