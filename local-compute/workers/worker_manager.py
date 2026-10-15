from typing import Any, Dict

from clients.backend_client import BackendClient
from job_queue.lease_manager import LeaseManager
from runtime.vram_manager import VRAMManager
from utils.logging import get_logger
from workers.worker_registry import get_worker_for_job_type

logger = get_logger(__name__)


class WorkerManager:
    """
    Owns one claimed job's full lifecycle: acquire a VRAM slot if the job
    type is heavy, keep its lease alive while running, execute it, and
    always report an honest outcome back to apps/api -- COMPLETED only if
    execute() actually returned a result, FAILED with the real exception
    message otherwise (see workers/base_worker.py's WorkerNotImplementedError).
    Never reports a fabricated COMPLETED result.
    """

    def __init__(self, backend: BackendClient, worker_id: str, vram_manager: VRAMManager):
        self._backend = backend
        self._worker_id = worker_id
        self._vram_manager = vram_manager
        self._lease_manager = LeaseManager(backend, worker_id)

    def run_job(self, job: Dict[str, Any]) -> None:
        job_id = job["id"]
        job_type = job["job_type"]
        worker = get_worker_for_job_type(job_type)

        vram_slot_held = False
        if self._vram_manager.is_heavy(job_type):
            if not self._vram_manager.acquire(job_type):
                # Another heavy GPU job is active. Fail this one back to
                # RETRYING (via /fail) rather than holding the claim, so a
                # future poll -- from this worker or another -- can pick it
                # up once the GPU is free.
                logger.info("job %s (%s) deferred: VRAM slot busy", job_id, job_type)
                self._backend.fail_job(job_id, self._worker_id, "VRAM slot unavailable -- another heavy GPU job is active")
                return
            vram_slot_held = True

        self._lease_manager.start(job_id)
        try:
            result = worker.execute(job.get("payload", {}))
            self._backend.complete_job(job_id, self._worker_id, result)
            logger.info("job %s completed", job_id)
        except Exception as exc:
            logger.warning("job %s failed: %s", job_id, exc)
            self._backend.fail_job(job_id, self._worker_id, str(exc))
        finally:
            self._lease_manager.stop()
            if vram_slot_held:
                self._vram_manager.release(job_type)
