"""
Shared pytest fixtures.

Provides an isolated in-memory SQLite database for integration tests that go
through TestClient, so running the suite never reads/writes the real
apps/api/cartsync.db dev database (previously every test run mutated it).
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from core.deps import get_current_user
from core.rate_limit import limiter
from models.user import User


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    # The limiter's in-memory storage is a module-level singleton shared by
    # every request the app handles, so without a reset here, request counts
    # from an earlier test would carry over and could 429 an unrelated test.
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture()
def db_session():
    # StaticPool is required for an in-memory sqlite db under test: without it
    # each checkout from the pool opens a fresh connection, and a ':memory:'
    # database only lives as long as the connection that created it, so every
    # query after the first would silently hit a different, table-less db.
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    test_user = User(id="fixture-test-user", email="fixture@example.com")

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    from fastapi.testclient import TestClient
    with TestClient(app) as c:
        yield c

    del app.dependency_overrides[get_db]
    del app.dependency_overrides[get_current_user]


@pytest.fixture()
def auth_client(db_session):
    # Unlike `client`, this does NOT override get_current_user -- real JWTs
    # issued by /auth/register + /auth/login are verified for real. Needed to
    # test per-user rate-limit keying, which reads the bearer token.
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    from fastapi.testclient import TestClient
    with TestClient(app) as c:
        yield c

    del app.dependency_overrides[get_db]


def register_and_login(auth_client, email="ratelimit-user@example.com", password="correct-horse-battery"):
    auth_client.post("/api/v1/auth/register", json={"email": email, "password": password})
    resp = auth_client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    return resp.json()["access_token"]
