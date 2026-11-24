"""
The rate limiter must see each real caller behind the Cloudflare tunnel, and
must not let a caller fake their address.
"""
from starlette.requests import Request

from core.rate_limit import client_ip, rate_limit_key


def make_request(peer: str, headers: dict | None = None) -> Request:
    raw = [(k.lower().encode(), v.encode()) for k, v in (headers or {}).items()]
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/",
        "headers": raw,
        "client": (peer, 5000),
        "query_string": b"",
    }
    return Request(scope)


def test_without_a_tunnel_the_direct_address_is_used():
    assert client_ip(make_request("203.0.113.9")) == "203.0.113.9"


def test_behind_the_local_tunnel_the_real_caller_is_used():
    req = make_request("127.0.0.1", {"CF-Connecting-IP": "198.51.100.7"})
    assert client_ip(req) == "198.51.100.7"
    assert rate_limit_key(req) == "ip:198.51.100.7"


def test_two_callers_behind_the_tunnel_get_separate_buckets():
    a = make_request("127.0.0.1", {"CF-Connecting-IP": "198.51.100.7"})
    b = make_request("127.0.0.1", {"CF-Connecting-IP": "198.51.100.8"})
    assert rate_limit_key(a) != rate_limit_key(b)


def test_ipv6_loopback_peer_is_also_the_tunnel():
    req = make_request("::1", {"CF-Connecting-IP": "2001:db8::1"})
    assert client_ip(req) == "2001:db8::1"


def test_a_made_up_header_from_a_non_local_caller_is_ignored():
    # Someone reaching the server directly cannot pick their own bucket.
    req = make_request("203.0.113.9", {"CF-Connecting-IP": "198.51.100.7"})
    assert client_ip(req) == "203.0.113.9"


def test_a_garbage_header_falls_back_to_the_peer():
    req = make_request("127.0.0.1", {"CF-Connecting-IP": "not-an-ip"})
    assert client_ip(req) == "127.0.0.1"


def test_no_header_behind_loopback_uses_loopback():
    assert client_ip(make_request("127.0.0.1")) == "127.0.0.1"


def test_a_signed_in_user_is_still_keyed_by_user_not_address():
    from jose import jwt

    from core.config import settings

    token = jwt.encode({"sub": "user-42"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    req = make_request("127.0.0.1", {"Authorization": f"Bearer {token}", "CF-Connecting-IP": "198.51.100.7"})
    assert rate_limit_key(req) == "user:user-42"


def test_a_forged_token_falls_back_to_the_address():
    from jose import jwt

    token = jwt.encode({"sub": "user-42"}, "not-the-real-secret", algorithm="HS256")
    req = make_request("127.0.0.1", {"Authorization": f"Bearer {token}", "CF-Connecting-IP": "198.51.100.7"})
    assert rate_limit_key(req) == "ip:198.51.100.7"
