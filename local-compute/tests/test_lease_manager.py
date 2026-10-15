import time
from unittest.mock import MagicMock

from config.settings import settings
from job_queue.lease_manager import LeaseManager


def test_lease_manager_heartbeats_the_job_periodically(monkeypatch):
    monkeypatch.setattr(settings, "HEARTBEAT_INTERVAL_SECONDS", 0.05)
    monkeypatch.setattr(settings, "LEASE_EXTENSION_MINUTES", 1)

    backend = MagicMock()
    manager = LeaseManager(backend, worker_id="worker-1")

    manager.start("job-123")
    time.sleep(0.22)  # long enough for several heartbeat ticks at 0.05s
    manager.stop()

    assert backend.heartbeat_job.call_count >= 2
    backend.heartbeat_job.assert_called_with("job-123", "worker-1", settings.LEASE_EXTENSION_MINUTES)


def test_lease_manager_stops_heartbeating_after_stop(monkeypatch):
    monkeypatch.setattr(settings, "HEARTBEAT_INTERVAL_SECONDS", 0.05)

    backend = MagicMock()
    manager = LeaseManager(backend, worker_id="worker-1")

    manager.start("job-123")
    time.sleep(0.12)
    manager.stop()
    call_count_after_stop = backend.heartbeat_job.call_count

    time.sleep(0.15)  # would have ticked again if the thread were still alive
    assert backend.heartbeat_job.call_count == call_count_after_stop


def test_lease_manager_survives_a_heartbeat_call_raising(monkeypatch):
    monkeypatch.setattr(settings, "HEARTBEAT_INTERVAL_SECONDS", 0.05)

    backend = MagicMock()
    backend.heartbeat_job.side_effect = Exception("network blip")
    manager = LeaseManager(backend, worker_id="worker-1")

    manager.start("job-123")
    time.sleep(0.15)
    manager.stop()  # must not raise / hang despite every heartbeat failing

    assert backend.heartbeat_job.call_count >= 1
