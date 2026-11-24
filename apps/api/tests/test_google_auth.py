"""
Google sign-in. No real Google is contacted: the tests make their own signing
key, publish its public half as "Google's keys", and sign tokens with it.
"""
import time

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jose import jwk, jwt

from core.config import settings
from models.user import User
from services import google_auth

CLIENT_ID = "1234-web.apps.googleusercontent.com"
OTHER_APP = "9999-other.apps.googleusercontent.com"


def _make_key(kid):
    private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()
    public_pem = private.public_key().public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()
    public_jwk = jwk.construct(public_pem, "RS256").to_dict()
    public_jwk.update({"kid": kid, "use": "sig", "alg": "RS256"})
    return private_pem, public_jwk


GOOGLE_PRIVATE, GOOGLE_JWK = _make_key("google-key-1")
ATTACKER_PRIVATE, _ = _make_key("google-key-1")  # same kid, different key


def make_token(
    *,
    sub="1100001",
    email="maya@gmail.com",
    aud=CLIENT_ID,
    iss="https://accounts.google.com",
    email_verified=True,
    exp_in=3600,
    name="Maya Rao",
    key=GOOGLE_PRIVATE,
    kid="google-key-1",
    algorithm="RS256",
):
    claims = {
        "iss": iss,
        "aud": aud,
        "sub": sub,
        "email": email,
        "email_verified": email_verified,
        "name": name,
        "picture": "https://lh3.example/photo.jpg",
        "iat": int(time.time()),
        "exp": int(time.time()) + exp_in,
    }
    return jwt.encode(claims, key, algorithm=algorithm, headers={"kid": kid})


@pytest.fixture(autouse=True)
def fake_google(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_IDS", CLIENT_ID)
    monkeypatch.setattr(google_auth, "_fetch_keys", lambda: [GOOGLE_JWK])
    google_auth.clear_key_cache()
    yield
    google_auth.clear_key_cache()


def sign_in(client, token):
    return client.post("/api/v1/auth/google", json={"id_token": token})


# ---------- the happy path ----------

def test_a_new_person_gets_an_account_and_a_working_token(auth_client, db_session):
    resp = sign_in(auth_client, make_token())
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]

    me = auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "maya@gmail.com"

    user = db_session.query(User).filter(User.email == "maya@gmail.com").one()
    assert user.google_sub == "1100001"
    assert user.first_name == "Maya"
    assert user.avatar == "https://lh3.example/photo.jpg"


def test_the_same_person_signing_in_again_gets_the_same_account(auth_client, db_session):
    sign_in(auth_client, make_token())
    sign_in(auth_client, make_token())
    assert db_session.query(User).count() == 1


def test_a_changed_google_email_still_finds_the_same_account(auth_client, db_session):
    sign_in(auth_client, make_token(email="old@gmail.com"))
    resp = sign_in(auth_client, make_token(email="new@gmail.com"))
    assert resp.status_code == 200
    assert db_session.query(User).count() == 1


def test_a_google_only_account_cannot_be_opened_with_a_password(auth_client):
    sign_in(auth_client, make_token())
    resp = auth_client.post(
        "/api/v1/auth/login", data={"username": "maya@gmail.com", "password": "anything-at-all-1"}
    )
    assert resp.status_code == 400


def test_the_email_is_lowercased(auth_client, db_session):
    sign_in(auth_client, make_token(email="Maya.Rao@Gmail.com"))
    assert db_session.query(User).one().email == "maya.rao@gmail.com"


# ---------- tokens that must be refused ----------

def test_a_token_made_for_another_app_is_refused(auth_client, db_session):
    resp = sign_in(auth_client, make_token(aud=OTHER_APP))
    assert resp.status_code == 401
    assert "different app" in resp.json()["detail"]
    assert db_session.query(User).count() == 0


def test_an_expired_token_is_refused(auth_client):
    assert sign_in(auth_client, make_token(exp_in=-60)).status_code == 401


def test_a_token_from_the_wrong_issuer_is_refused(auth_client):
    assert sign_in(auth_client, make_token(iss="https://evil.example.com")).status_code == 401


def test_an_unverified_google_email_is_refused(auth_client, db_session):
    resp = sign_in(auth_client, make_token(email_verified=False))
    assert resp.status_code == 401
    assert db_session.query(User).count() == 0


def test_a_token_signed_with_someone_elses_key_is_refused(auth_client, db_session):
    forged = make_token(key=ATTACKER_PRIVATE)  # claims the real kid, wrong key
    assert sign_in(auth_client, forged).status_code == 401
    assert db_session.query(User).count() == 0


def test_a_token_with_an_unknown_key_id_is_refused(auth_client):
    assert sign_in(auth_client, make_token(kid="not-a-google-key")).status_code == 401


def test_an_hmac_token_using_the_public_key_trick_is_refused(auth_client):
    # The classic attack: sign with HS256 using public key text as the secret.
    token = jwt.encode(
        {"iss": "accounts.google.com", "aud": CLIENT_ID, "sub": "1", "email": "a@b.co",
         "email_verified": True, "exp": int(time.time()) + 600},
        "public-key-text", algorithm="HS256", headers={"kid": "google-key-1"},
    )
    resp = sign_in(auth_client, token)
    assert resp.status_code == 401


def test_garbage_is_refused_not_a_crash(auth_client):
    assert sign_in(auth_client, "this-is-not-a-jwt-at-all").status_code == 401


def test_too_short_a_token_is_rejected_by_validation(auth_client):
    assert auth_client.post("/api/v1/auth/google", json={"id_token": "x"}).status_code == 422


def test_a_token_missing_the_email_is_refused(auth_client):
    token = jwt.encode(
        {"iss": "accounts.google.com", "aud": CLIENT_ID, "sub": "5", "email_verified": True,
         "exp": int(time.time()) + 600},
        GOOGLE_PRIVATE, algorithm="RS256", headers={"kid": "google-key-1"},
    )
    assert sign_in(auth_client, token).status_code == 401


def test_both_google_issuer_spellings_are_accepted(auth_client):
    assert sign_in(auth_client, make_token(iss="accounts.google.com", sub="7", email="a@gmail.com")).status_code == 200


# ---------- accounts made with a password ----------

def test_an_existing_password_account_is_not_taken_over(auth_client, db_session):
    auth_client.post(
        "/api/v1/auth/register", json={"email": "maya@gmail.com", "password": "correct-horse-battery"}
    )
    resp = sign_in(auth_client, make_token())
    assert resp.status_code == 409
    assert "password" in resp.json()["detail"]
    # Not linked, and the password still works.
    assert db_session.query(User).one().google_sub is None
    ok = auth_client.post(
        "/api/v1/auth/login", data={"username": "maya@gmail.com", "password": "correct-horse-battery"}
    )
    assert ok.status_code == 200


# ---------- server state ----------

def test_google_sign_in_is_off_until_a_client_id_is_set(auth_client, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_IDS", "")
    resp = sign_in(auth_client, make_token())
    assert resp.status_code == 503
    assert "not set up" in resp.json()["detail"]


def test_if_google_cannot_be_reached_the_answer_is_try_again(auth_client, monkeypatch):
    def down():
        raise google_auth.GoogleUnavailableError("offline")

    monkeypatch.setattr(google_auth, "_fetch_keys", down)
    google_auth.clear_key_cache()
    resp = sign_in(auth_client, make_token())
    assert resp.status_code == 503
    assert "Try again" in resp.json()["detail"]


def test_a_key_google_just_rotated_in_is_found(auth_client, monkeypatch):
    new_private, new_jwk = _make_key("google-key-2")
    calls = {"n": 0}

    def fetch():
        calls["n"] += 1
        return [GOOGLE_JWK] if calls["n"] == 1 else [GOOGLE_JWK, new_jwk]

    monkeypatch.setattr(google_auth, "_fetch_keys", fetch)
    google_auth.clear_key_cache()
    sign_in(auth_client, make_token(sub="1", email="a@gmail.com"))  # primes the cache
    google_auth._cache["fetched_at"] -= 120  # the cached copy is now older than the refresh limit
    resp = sign_in(auth_client, make_token(sub="2", email="b@gmail.com", key=new_private, kid="google-key-2"))
    assert resp.status_code == 200


def test_an_unknown_key_id_does_not_refetch_keys_again_and_again(auth_client, monkeypatch):
    calls = {"n": 0}

    def fetch():
        calls["n"] += 1
        return [GOOGLE_JWK]

    monkeypatch.setattr(google_auth, "_fetch_keys", fetch)
    google_auth.clear_key_cache()
    other_private, _ = _make_key("made-up")
    for i in range(5):
        resp = sign_in(auth_client, make_token(sub=str(i), email=f"x{i}@gmail.com", key=other_private, kid=f"made-up-{i}"))
        assert resp.status_code == 401
    assert calls["n"] == 1


def test_the_keys_are_cached_between_sign_ins(auth_client, monkeypatch):
    calls = {"n": 0}

    def fetch():
        calls["n"] += 1
        return [GOOGLE_JWK]

    monkeypatch.setattr(google_auth, "_fetch_keys", fetch)
    google_auth.clear_key_cache()
    sign_in(auth_client, make_token(sub="1", email="a@gmail.com"))
    sign_in(auth_client, make_token(sub="2", email="b@gmail.com"))
    assert calls["n"] == 1


# ---------- the config the app reads ----------

def test_config_gives_the_app_the_client_id(auth_client):
    resp = auth_client.get("/api/v1/auth/config")
    assert resp.status_code == 200
    assert resp.json() == {"google_client_id": CLIENT_ID}


def test_config_says_none_when_google_is_off(auth_client, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_IDS", "")
    assert auth_client.get("/api/v1/auth/config").json() == {"google_client_id": None}


def test_config_gives_the_first_of_several_ids(auth_client, monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_IDS", f" {CLIENT_ID} , {OTHER_APP} ")
    assert auth_client.get("/api/v1/auth/config").json()["google_client_id"] == CLIENT_ID
    # And a token for the second ID is accepted too.
    assert sign_in(auth_client, make_token(aud=OTHER_APP)).status_code == 200


def test_the_audience_can_be_a_list(auth_client):
    token = make_token(aud=[OTHER_APP, CLIENT_ID])
    assert sign_in(auth_client, token).status_code == 200
