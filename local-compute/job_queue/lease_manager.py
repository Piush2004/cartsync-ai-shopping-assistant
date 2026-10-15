import threading
from typing import Optional

from clients.backend_client import BackendClient
from config.settings import settings
from utils.logging import get_logger

logger = get_logger(__name__)


class LeaseManager:
    """
    Keeps a claimed job's lease alive on a background thread while it
    executes. Without this, any execute() call that runs longer than the
    initial lease (settings.LEASE_MINUTES) would look abandoned to another
    worker polling apps/api and get reclaimed out from under it mid-run.
    """

    def __init__(self, backend: BackendClient, worker_id: str):
        self._backend = backend
        self._worker_id = worker_id
        self._stop_event: Optional[threading.Event] = None
        self._thread: Optional[threading.Thread] = None

    def start(self, job_id: str) -> None:
        self._stop_event = threading.Event()

        def _loop():
            while not self._stop_event.wait(settings.HEARTBEAT_INTERVAL_SECONDS):
                try:
                    self._backend.heartbeat_job(job_id, self._worker_id, settings.LEASE_EXTENSION_MINUTES)
                except Exception:
                    logger.warning("lease heartbeat failed for job %s", job_id, exc_info=True)

        self._thread = threading.Thread(target=_loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        if self._stop_event:
            self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)
        self._stop_event = None
        self._thread = None
