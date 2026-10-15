"""
Integration tests for /compute/* -- the apps/api-hosted job queue and worker
registry that Phase 4's local-compute/ node talks to over HTTP.

Covers the same guarantees functions/src/services/queue.service.ts's Firestore
implementation provided, now backed by SQLAlchemy/SQLite: worker registration/
heartbeat/deregister, atomic claim (a job can never be claimed twice), the
retry-until-max_retries-then-FAILED policy, expired-lease reclaim, and that
every endpoint is gated by X-Worker-Api-Key.
"""
from datetime import datetime, timedelta

from core.config import settings
from models.compute import ComputeJob

WORKER_HEADERS = {"X-Worker-Api-Key": settings.WORKER_API_KEY}


def _register_worker(client, worker_id="worker-1", capabilities=None):
    return client.post(
        "/api/v1/compute/workers/register",
        headers=WORKER_HEADERS,
        json={
            "worker_id": worker_id,
            "hostname": "test-host",
            "platform": "Windows-11",
            "cpu": "Ryzen 7",
            "ram_gb": 24,
            "gpu": "RTX 5060",
            "vram_gb": 8,
            "capabilities": capabilities or ["LLM", "VTON", "MEASUREMENT", "AVATAR"],
        },
    )


def _enqueue_job(client, job_type="LLM", max_retries=3):
    resp = client.post(
        "/api/v1/compute/jobs",
        headers=WORKER_HEADERS,
        json={"job_type": job_type, "payload": {"prompt": "hi"}, "max_retries": max_retries},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["id"]


# ============================================================
# Auth gate
# ============================================================

def test_missing_api_key_is_rejected(client):
    resp = client.get("/api/v1/compute/workers")
    assert resp.status_code == 401


def test_wrong_api_key_is_rejected(client):
    resp = client.get("/api/v1/compute/workers", headers={"X-Worker-Api-Key": "not-the-real-key"})
    assert resp.status_code == 401


# ============================================================
# Worker registry
# ============================================================

def test_register_worker_then_appears_in_list(client):
    resp = _register_worker(client)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["worker_id"] == "worker-1"
    assert body["status"] == "ONLINE"

    listed = client.get("/api/v1/compute/workers", headers=WORKER_HEADERS)
    assert listed.status_code == 200
    assert any(w["worker_id"] == "worker-1" for w in listed.json())


def test_worker_heartbeat_updates_last_heartbeat(client):
    _register_worker(client)
    resp = client.post(
        "/api/v1/compute/workers/worker-1/heartbeat",
        headers=WORKER_HEADERS,
        params={"active_jobs": 1},
    )
    assert resp.status_code == 200
    assert resp.json()["active_jobs"] == 1


def test_heartbeat_for_unregistered_worker_404s(client):
    resp = client.post("/api/v1/compute/workers/ghost/heartbeat", headers=WORKER_HEADERS)
    assert resp.status_code == 404


def test_deregister_marks_worker_offline(client):
    _register_worker(client)
    resp = client.post("/api/v1/compute/workers/worker-1/deregister", headers=WORKER_HEADERS)
    assert resp.status_code == 200

    listed = client.get("/api/v1/compute/workers", headers=WORKER_HEADERS).json()
    worker = next(w for w in listed if w["worker_id"] == "worker-1")
    assert worker["status"] == "OFFLINE"
    assert worker["active_jobs"] == 0


# ============================================================
# Job lifecycle: enqueue -> poll -> claim -> heartbeat -> complete
# ============================================================

def test_enqueue_then_poll_returns_the_job_filtered_by_capability(client):
    job_id = _enqueue_job(client, job_type="LLM")

    matching = client.get("/api/v1/compute/jobs/poll", headers=WORKER_HEADERS, params={"capabilities": "LLM"})
    assert matching.status_code == 200
    assert any(j["id"] == job_id for j in matching.json())

    non_matching = client.get("/api/v1/compute/jobs/poll", headers=WORKER_HEADERS, params={"capabilities": "VTON"})
    assert all(j["id"] != job_id for j in non_matching.json())


def test_claim_succeeds_once_then_second_claim_attempt_fails(client):
    job_id = _enqueue_job(client)

    first = client.post(f"/api/v1/compute/jobs/{job_id}/claim", headers=WORKER_HEADERS, params={"worker_id": "worker-1"})
    assert first.status_code == 200
    assert first.json()["claimed"] is True

    second = client.post(f"/api/v1/compute/jobs/{job_id}/claim", headers=WORKER_HEADERS, params={"worker_id": "worker-2"})
    assert second.status_code == 200
    assert second.json()["claimed"] is False

    job = client.get(f"/api/v1/compute/jobs/{job_id}", headers=WORKER_HEADERS).json()
    assert job["status"] == "PROCESSING"
    assert job["worker_id"] == "worker-1"


def test_claim_nonexistent_job_404s(client):
    resp = client.post("/api/v1/compute/jobs/does-not-exist/claim", headers=WORKER_HEADERS, params={"worker_id": "worker-1"})
    assert resp.status_code == 404


def test_heartbeat_extends_lease_and_rejects_wrong_worker(client):
    job_id = _enqueue_job(client)
    client.post(f"/api/v1/compute/jobs/{job_id}/claim", headers=WORKER_HEADERS, params={"worker_id": "worker-1"})

    ok = client.post(f"/api/v1/compute/jobs/{job_id}/heartbeat", headers=WORKER_HEADERS, params={"worker_id": "worker-1"})
    assert ok.status_code == 200

    wrong_worker = client.post(f"/api/v1/compute/jobs/{job_id}/heartbeat", headers=WORKER_HEADERS, params={"worker_id": "worker-2"})
    assert wrong_worker.status_code == 409


def test_complete_job_sets_result_and_releases_lease(client):
    job_id = _enqueue_job(client)
    client.post(f"/api/v1/compute/jobs/{job_id}/claim", headers=WORKER_HEADERS, params={"worker_id": "worker-1"})

    resp = client.post(
        f"/api/v1/compute/jobs/{job_id}/complete",
        headers=WORKER_HEADERS,
        params={"worker_id": "worker-1"},
        json={"result": {"ok": True}},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "COMPLETED"
    assert body["result"] == {"ok": True}
    assert body["worker_id"] is None
    assert body["lease_expires_at"] is None


def test_complete_job_rejects_non_owning_worker(client):
    job_id = _enqueue_job(client)
    client.post(f"/api/v1/compute/jobs/{job_id}/claim", headers=WORKER_HEADERS, params={"worker_id": "worker-1"})

    resp = client.post(
        f"/api/v1/compute/jobs/{job_id}/complete",
        headers=WORKER_HEADERS,
        params={"worker_id": "worker-2"},
        json={"result": {}},
    )
    assert resp.status_code == 409


# ============================================================
# Retry / fail policy
# ============================================================

def test_fail_job_retries_until_max_retries_then_fails_terminally(client):
    job_id = _enqueue_job(client, max_retries=2)

    for expected_status, expected_retry_count in [("RETRYING", 1), ("FAILED", 2)]:
        claim = client.post(f"/api/v1/compute/jobs/{job_id}/claim", headers=WORKER_HEADERS, params={"worker_id": "worker-1"})
        assert claim.json()["claimed"] is True

        resp = client.post(
            f"/api/v1/compute/jobs/{job_id}/fail",
            headers=WORKER_HEADERS,
            params={"worker_id": "worker-1"},
            json={"error": "WorkerNotImplementedError: not implemented"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == expected_status
        assert body["retry_count"] == expected_retry_count
        assert body["worker_id"] is None


def test_cancel_job(client):
    job_id = _enqueue_job(client)
    resp = client.post(f"/api/v1/compute/jobs/{job_id}/cancel", headers=WORKER_HEADERS)
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


# ============================================================
# Expired lease reclaim
# ============================================================

def test_expired_lease_is_reclaimable_by_a_different_worker(client, db_session):
    job_id = _enqueue_job(client)
    client.post(f"/api/v1/compute/jobs/{job_id}/claim", headers=WORKER_HEADERS, params={"worker_id": "worker-1"})

    job = db_session.query(ComputeJob).filter(ComputeJob.id == job_id).first()
    job.lease_expires_at = datetime.utcnow() - timedelta(minutes=5)
    db_session.commit()

    reclaim = client.post(f"/api/v1/compute/jobs/{job_id}/claim", headers=WORKER_HEADERS, params={"worker_id": "worker-2"})
    assert reclaim.status_code == 200
    assert reclaim.json()["claimed"] is True

    refreshed = client.get(f"/api/v1/compute/jobs/{job_id}", headers=WORKER_HEADERS).json()
    assert refreshed["worker_id"] == "worker-2"
    assert refreshed["retry_count"] == 1


def test_expired_lease_job_appears_in_poll_results(client, db_session):
    job_id = _enqueue_job(client)
    client.post(f"/api/v1/compute/jobs/{job_id}/claim", headers=WORKER_HEADERS, params={"worker_id": "worker-1"})

    job = db_session.query(ComputeJob).filter(ComputeJob.id == job_id).first()
    job.lease_expires_at = datetime.utcnow() - timedelta(minutes=5)
    db_session.commit()

    polled = client.get("/api/v1/compute/jobs/poll", headers=WORKER_HEADERS, params={"capabilities": "LLM"})
    assert any(j["id"] == job_id for j in polled.json())
