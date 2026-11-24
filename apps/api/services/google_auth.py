"""
Checks a Google ID token (the signed "who you are" proof that Google's
sign-in gives the app) without trusting anything the client says.

A token is accepted only if ALL of these hold:
  - it is signed by one of Google's published keys (RS256, key found by `kid`)
  - it is made for one of OUR client IDs (`aud`), so a token Google issued to
    some other app cannot be replayed here
  - it comes from Google (`iss`) and has not expired (`exp`)
  - Google says the email address is verified

Nothing is stored here except a short-lived copy of Google's public keys.
"""
import threading
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx
from jose import JWTError, jwt

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
VALID_ISSUERS = {"https://accounts.google.com", "accounts.google.com"}
KEY_CACHE_SECONDS = 60 * 60


class GoogleAuthError(Exception):
    """The token is not acceptable (bad signature, wrong app, expired, ...)."""


class GoogleUnavailableError(Exception):
    """Google's keys could not be fetched, so the token could not be checked."""


@dataclass(frozen=True)
class GoogleIdentity:
    sub: str
    email: str
    name: Optional[str]
    picture: Optional[str]


_lock = threading.Lock()
_cache: Dict[str, Any] = {"keys": None, "fetched_at": 0.0}


def _fetch_keys() -> List[Dict[str, Any]]:
    try:
        response = httpx.get(GOOGLE_CERTS_URL, timeout=5.0)
        response.raise_for_status()
        keys = response.json().get("keys")
    except (httpx.HTTPError, ValueError) as exc:
        raise GoogleUnavailableError(f"Could not fetch Google's keys: {exc}") from exc
    if not isinstance(keys, list) or not keys:
        raise GoogleUnavailableError("Google's key list was empty")
    return keys


def _keys(force_refresh: bool = False) -> List[Dict[str, Any]]:
    with _lock:
        fresh = _cache["keys"] is not None and time.time() - _cache["fetched_at"] < KEY_CACHE_SECONDS
        if force_refresh or not fresh:
            _cache["keys"] = _fetch_keys()
            _cache["fetched_at"] = time.time()
        return _cache["keys"]


def clear_key_cache() -> None:
    with _lock:
        _cache["keys"] = None
        _cache["fetched_at"] = 0.0


def _find_key(kid: str) -> Optional[Dict[str, Any]]:
    for force in (False, True):  # a key Google just rotated in shows up on refresh
        for key in _keys(force_refresh=force):
            if key.get("kid") == kid:
                return key
    return None


def verify_google_id_token(token: str, audiences: List[str]) -> GoogleIdentity:
    if not audiences:
        raise GoogleAuthError("Google sign-in is not set up")
    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise GoogleAuthError("Not a valid Google token") from exc

    # Only RS256. Refusing everything else closes the "alg: none" and
    # "sign it with the public key as an HMAC secret" tricks.
    if header.get("alg") != "RS256":
        raise GoogleAuthError("Unexpected token type")
    kid = header.get("kid")
    if not kid:
        raise GoogleAuthError("Token has no key id")

    key = _find_key(kid)
    if key is None:
        raise GoogleAuthError("Token was not signed by a known Google key")

    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            # aud is checked by hand below, because we accept a list of IDs.
            options={"verify_aud": False, "verify_at_hash": False},
        )
    except JWTError as exc:  # bad signature, expired, malformed
        raise GoogleAuthError("Token is invalid or expired") from exc

    if claims.get("iss") not in VALID_ISSUERS:
        raise GoogleAuthError("Token did not come from Google")

    aud = claims.get("aud")
    token_audiences = aud if isinstance(aud, list) else [aud]
    if not any(a in audiences for a in token_audiences):
        raise GoogleAuthError("Token was made for a different app")

    # Google sends a real boolean, but older tokens used the string "true".
    if claims.get("email_verified") not in (True, "true"):
        raise GoogleAuthError("Your Google email address is not verified")

    sub = claims.get("sub")
    email = claims.get("email")
    if not sub or not email:
        raise GoogleAuthError("Token is missing who you are")

    return GoogleIdentity(
        sub=str(sub),
        email=str(email).strip().lower(),
        name=claims.get("name"),
        picture=claims.get("picture"),
    )
