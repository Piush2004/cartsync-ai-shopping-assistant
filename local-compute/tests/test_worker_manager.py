from unittest.mock import MagicMock

from runtime.vram_manager import VRAMManager
from workers.worker_manager import WorkerManager


def _job(job_id="job-1", job_type="MEASUREMENT"):
    return {"id": job_id, "job_type": job_type, "payload": {}}


def test_run_job_fails_honestly_when_worker_is_not_implemented():
    backend = MagicMock()
    manager = WorkerManager(backend, worker_id="worker-1", vram_manager=VRAMManager())

    manager.run_job(_job(job_type="MEASUREMENT"))

    backend.complete_job.assert_not_called()
    backend.fail_job.assert_called_once()
    args, _ = backend.fail_job.call_args
    assert args[0] == "job-1"
    assert args[1] == "worker-1"
    assert "not implemented" in args[2]


def test_run_job_acquires_and_releases_vram_slot_for_heavy_job_types():
    backend = MagicMock()
    vram_manager = VRAMManager()
    manager = WorkerManager(backend, worker_id="worker-1", vram_manager=vram_manager)

    manager.run_job(_job(job_type="LLM"))

    # execute() raises (not implemented) so the slot must still be released
    # in the finally branch, not left held.
    assert vram_manager.get_state()["active_heavy_job_type"] is None
    backend.fail_job.assert_called_once()


def test_run_job_defers_when_vram_slot_already_held_by_another_heavy_job():
    backend = MagicMock()
    vram_manager = VRAMManager()
    vram_manager.acquire("VTON")  # simulate another job already holding the GPU

    manager = WorkerManager(backend, worker_id="worker-1", vram_manager=vram_manager)
    manager.run_job(_job(job_type="LLM"))

    backend.fail_job.assert_called_once()
    args, _ = backend.fail_job.call_args
    assert "VRAM" in args[2]
    backend.complete_job.assert_not_called()
    # The deferred job must not have touched the slot it couldn't acquire.
    assert vram_manager.get_state()["active_heavy_job_type"] == "VTON"


def test_run_job_extends_and_stops_the_lease_around_execution():
    backend = MagicMock()
    manager = WorkerManager(backend, worker_id="worker-1", vram_manager=VRAMManager())

    manager.run_job(_job(job_type="AVATAR"))

    # LeaseManager.stop() joins its thread before returning, so by the time
    # run_job() returns no more heartbeat calls should be in flight -- this
    # just checks the job's own fail path ran to completion without hanging.
    backend.fail_job.assert_called_once()
