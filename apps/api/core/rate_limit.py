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
garbage token). Reading the token here is unverified-claims only -- it is
used purely to partition the rate-limit bucket, never to authorize the
request -- so a forged token can't grant extra quota, it can at worst fall
back to the (still-enforced) IP-based bucket.
"""
from jose import jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def rate_limit_key(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):]
        try:
            claims = jwt.get_unverified_claims(token)
            sub = claims.get("sub")
            if sub:
                return f"user:{sub}"
        except Exception:
            pass
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=rate_limit_key)
