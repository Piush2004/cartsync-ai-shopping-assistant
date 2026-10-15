import threading
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

from clients.backend_client import BackendClient
from config.settings import settings
from health.health_service import build_registration_payload
from job_queue.queue_client import QueueClient
from runtime.process_manager import ProcessManager
from runtime.vram_manager import VRAMManager
from utils.logging import get_logger
from workers.worker_manager import WorkerManager

logger = get_logger("local_compute")

backend = BackendClient()
vram_manager = VRAMManager()
queue_client = QueueClient(backend)
worker_manager = WorkerManager(backend, settings.WORKER_ID, vram_manager)
process_manager = ProcessManager()

_active_jobs_count = 0
_active_jobs_lock = threading.Lock()


def _poll_loop() -> None:
    logger.info("poll loop starting for worker %s", settings.WORKER_ID)
    global _active_jobs_count
    while not process_manager.is_shutting_down():
        try:
            job = queue_client.claim_next_job(settings.WORKER_ID, settings.WORKER_CAPABILITIES, settings.LEASE_MINUTES)
        except Exception:
            logger.warning("poll/claim attempt failed", exc_info=True)
            process_manager.shutdown_event.wait(settings.POLL_INTERVAL_SECONDS)
            continue

        if job is None:
            process_manager.shutdown_event.wait(settings.POLL_INTERVAL_SECONDS)
            continue

        with _active_jobs_lock:
            _active_jobs_count += 1
        try:
            worker_manager.run_job(job)
        finally:
            with _active_jobs_lock:
                _active_jobs_count -= 1
    logger.info("poll loop stopped")


def _worker_heartbeat_loop() -> None:
    while not process_manager.is_shutting_down():
        try:
            with _active_jobs_lock:
                active = _active_jobs_count
            backend.heartbeat_worker(settings.WORKER_ID, active)
        except Exception:
            logger.warning("worker heartbeat failed", exc_info=True)
        process_manager.shutdown_event.wait(settings.HEARTBEAT_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    process_manager.install_signal_handlers()
    backend.register_worker(build_registration_payload(settings.WORKER_ID))
    logger.info("worker %s registered", settings.WORKER_ID)

    threading.Thread(target=_poll_loop, daemon=True).start()
    threading.Thread(target=_worker_heartbeat_loop, daemon=True).start()

    yield

    process_manager.shutdown_event.set()
    deadline = time.time() + settings.SHUTDOWN_GRACE_PERIOD_SECONDS
    while _active_jobs_count > 0 and time.time() < deadline:
        time.sleep(0.5)
    try:
        backend.deregister_worker(settings.WORKER_ID)
        logger.info("worker %s deregistered", settings.WORKER_ID)
    except Exception:
        logger.warning("worker deregistration failed", exc_info=True)
    backend.close()


app = FastAPI(title="CartSyncAI Local Compute Node", version="0.1.0", lifespan=lifespan)


@app.get("/health")
def health_check():
    with _active_jobs_lock:
        active = _active_jobs_count
    return {
        "worker_id": settings.WORKER_ID,
        "status": "SHUTTING_DOWN" if process_manager.is_shutting_down() else "ONLINE",
        "active_jobs": active,
        "capabilities": settings.WORKER_CAPABILITIES,
        "vram_state": vram_manager.get_state(),
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
