import logging
import secrets
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings

logger = logging.getLogger("cartsync")


def _get_or_create_dev_secret() -> str:
    """
    Used only when SECRET_KEY isn't supplied via the environment (pydantic-settings
    always prefers the env var over this default/factory). A purely random
    per-process secret -- the original fallback here -- invalidated every
    logged-in session on every `uvicorn --reload` restart, since each restart
    re-imported this module and generated a brand-new value. That was found
    this session to be the actual root cause of the dashboard's "temporarily
    unavailable" fallback recurring during normal development (every 401 it
    caused was indistinguishable, in the frontend's error handling, from a
    real outage -- see docs/qa/CURRENT_FULL_SYSTEM_AUDIT.md and the dashboard
    401-handling fix in apps/web/src/app/dashboard/page.tsx).

    Persisting a random secret to a local, gitignored file fixes the dev
    instability (sessions now survive reloads) without reintroducing BUG-03
    (a secret committed to source control, and thus public and identical for
    every clone of the repo) -- this file is unique per machine/checkout and
    never committed (see apps/api/.gitignore).
    """
    secret_path = Path(__file__).resolve().parent.parent / ".dev_secret_key"
    if secret_path.exists():
        existing = secret_path.read_text().strip()
        if existing:
            return existing
    new_secret = secrets.token_hex(32)
    secret_path.write_text(new_secret)
    return new_secret


def _default_sqlite_url() -> str:
    """
    Anchored to this file's location (apps/api/cartsync.db) rather than a
    bare relative "sqlite:///./cartsync.db" -- a relative SQLite path
    resolves against the *process's* working directory, not the project
    directory, so launching uvicorn from anywhere other than apps/api
    (a Procfile, a task runner, an IDE run config with a different cwd)
    silently creates/opens a different, empty database file instead of
    erroring. Only affects the dev default: production always sets
    SQLALCHEMY_DATABASE_URL explicitly to a Postgres URL.
    """
    db_path = Path(__file__).resolve().parent.parent / "cartsync.db"
    return f"sqlite:///{db_path}"


def _get_or_create_dev_worker_api_key() -> str:
    """
    Same persisted-local-file pattern as _get_or_create_dev_secret, for the
    same reason: a fully random per-process value would force the local
    compute node to be reconfigured with a new key every backend restart.
    Used only when WORKER_API_KEY isn't supplied via the environment.
    """
    key_path = Path(__file__).resolve().parent.parent / ".dev_worker_api_key"
    if key_path.exists():
        existing = key_path.read_text().strip()
        if existing:
            return existing
    new_key = secrets.token_hex(32)
    key_path.write_text(new_key)
    return new_key


class Settings(BaseSettings):
    PROJECT_NAME: str = "CartSync AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Must be supplied via the SECRET_KEY env var in any shared/production environment.
    # The dev-only fallback below persists to a local gitignored file so it survives
    # `uvicorn --reload` restarts -- see _get_or_create_dev_secret's docstring.
    SECRET_KEY: str = Field(default_factory=_get_or_create_dev_secret)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

    SQLALCHEMY_DATABASE_URL: str = Field(default_factory=_default_sqlite_url)

    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000"

    # Shared secret for local-compute/ worker processes calling /api/v1/compute/*.
    # These endpoints are worker-to-server, not a logged-in user, so they don't
    # fit the JWT/get_current_user pattern -- a static key checked via
    # APIKeyHeader (see routers/compute.py) is the smallest mechanism that
    # actually gates access, matching this codebase's "simple, appropriate for
    # current scale" pattern elsewhere. Must be supplied via env var in any
    # shared/production environment, same as SECRET_KEY.
    WORKER_API_KEY: str = Field(default_factory=_get_or_create_dev_worker_api_key)

    # fal.ai API key for the Virtual Try-On feature (routers/vton.py). No dev
    # default -- unlike SECRET_KEY/WORKER_API_KEY this isn't a locally
    # generated secret, it authenticates against a real third-party billed
    # API, so an empty value just means try-on requests fail with a clear
    # "not configured" error until a real key is set.
    FAL_API_KEY: str = ""


settings = Settings()

_LEAKED_DEFAULT_SECRET = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
if secrets.compare_digest(settings.SECRET_KEY, _LEAKED_DEFAULT_SECRET):
    logger.warning("SECRET_KEY is set to the old value that was committed to source control. Rotate it immediately.")
