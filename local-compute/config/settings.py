import socket
import uuid
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # apps/api's base URL, API v1 prefix included.
    BACKEND_API_URL: str = "http://localhost:8000/api/v1"

    # Must match apps/api's WORKER_API_KEY (core/config.py). No safe local
    # default exists here the way apps/api's own dev-secret does -- this
    # value has to match a specific remote server, so an empty key just
    # means every backend call 401s until it's set in .env.
    WORKER_API_KEY: str = ""

    WORKER_ID: str = Field(default_factory=lambda: f"worker-{socket.gethostname()}-{uuid.uuid4().hex[:6]}")
    WORKER_CAPABILITIES: List[str] = ["LLM", "VTON", "MEASUREMENT", "AVATAR"]

    POLL_INTERVAL_SECONDS: float = 2.0
    LEASE_MINUTES: int = 3
    LEASE_EXTENSION_MINUTES: int = 1
    HEARTBEAT_INTERVAL_SECONDS: float = 30.0

    # This RTX 5060 has 8GB VRAM total; only one heavy GPU job (LLM
    # inference, IDM-VTON) may run at a time -- see runtime/vram_manager.py.
    MAX_VRAM_GB: int = 8
    HEAVY_JOB_TYPES: List[str] = ["LLM", "VTON"]

    # How long to let an in-flight job finish on SIGINT/SIGTERM before
    # deregistering and exiting anyway.
    SHUTDOWN_GRACE_PERIOD_SECONDS: float = 30.0


settings = Settings()
