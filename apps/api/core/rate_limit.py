"""
Rate limiting for CartSync's abuse-prone endpoints.

Uses an in-memory (per-process) limiter via `slowapi`/`limits` -- no Redis is
configured anywhere in this stack today, and a single-process FastAPI
deployment doesn't need one yet. If CartSync moves to multiple worker
processes/instances, swap `storage_uri` below for a Redis URL; the
`Limiter`/`@limiter.limit(...)` call sites do not need to change.

Limits are keyed by authenticated user ID when a valid-looking bearer token
is present (so one user can't starve another user's quota), and fall back to
client IP for unauthenticated requests (login/register, or a request with no/
garbage token). The token's signature is verified before it picks a bucket, so a
forged or expired token just falls back to the IP-based bucket.
"""
import ipaddress

from jose import jwt

from core.config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

# The address a request really came from, as seen by this process.
_LOOPBACK_PEERS = {"127.0.0.1", "::1"}


def client_ip(request: Request) -> str:
    """
    The caller's address for rate limiting.

    Behind a Cloudflare tunnel (`cloudflared` running on this machine) every
    request reaches us from 127.0.0.1, so without this, every stranger shares
    one bucket and two people logging in at once would block each other.
    Cloudflare puts the real address in `CF-Connecting-IP` and overwrites any
    value a caller tries to send.

    That header is trusted ONLY when the direct caller is loopback, i.e. the
    local tunnel program. From any other direct caller it is ignored, so
    nobody can dodge the limits by making up a header. A value that is not a
    valid IP address is ignored too.
    """
    peer = get_remote_address(request)
    if peer in _LOOPBACK_PEERS:
        forwarded = request.headers.get("CF-Connecting-IP", "").strip()
        if forwarded:
            try:
                return str(ipaddress.ip_address(forwarded))
            except ValueError:
                pass
    return peer


def rate_limit_key(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):]
        try:
            # Signature is checked so a made-up token cannot pick another
            # user's bucket or dodge the per-IP limit on login/register.
            claims = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            sub = claims.get("sub")
            if sub:
                return f"user:{sub}"
        except Exception:
            pass
    return f"ip:{client_ip(request)}"


limiter = Limiter(key_func=rate_limit_key)
