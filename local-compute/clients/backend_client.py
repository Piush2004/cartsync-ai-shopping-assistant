from typing import Any, Dict, List, Optional

import httpx

from config.settings import settings


class BackendClient:
    """
    Thin HTTP wrapper over apps/api's /compute/* endpoints
    (apps/api/routers/compute.py). Every call is worker-to-server, not a
    logged-in user, so it authenticates with X-Worker-Api-Key instead of a
    JWT -- see apps/api/core/deps.py's verify_worker_api_key.
    """

    def __init__(self):
        self._client = httpx.Client(
            base_url=settings.BACKEND_API_URL,
            headers={"X-Worker-Api-Key": settings.WORKER_API_KEY},
            timeout=10.0,
        )

    def close(self) -> None:
        self._client.close()

    def register_worker(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        resp = self._client.post("/compute/workers/register", json=payload)
        resp.raise_for_status()
        return resp.json()

    def heartbeat_worker(self, worker_id: str, active_jobs: int) -> Dict[str, Any]:
        resp = self._client.post(
            f"/compute/workers/{worker_id}/heartbeat",
            params={"active_jobs": active_jobs},
        )
        resp.raise_for_status()
        return resp.json()

    def deregister_worker(self, worker_id: str) -> None:
        resp = self._client.post(f"/compute/workers/{worker_id}/deregister")
        resp.raise_for_status()

    def poll_jobs(self, capabilities: List[str]) -> List[Dict[str, Any]]:
        resp = self._client.get("/compute/jobs/poll", params={"capabilities": capabilities})
        resp.raise_for_status()
        return resp.json()

    def claim_job(self, job_id: str, worker_id: str, lease_minutes: int) -> bool:
        resp = self._client.post(
            f"/compute/jobs/{job_id}/claim",
            params={"worker_id": worker_id, "lease_minutes": lease_minutes},
        )
        resp.raise_for_status()
        return resp.json()["claimed"]

    def heartbeat_job(self, job_id: str, worker_id: str, lease_extension_minutes: int) -> Dict[str, Any]:
        resp = self._client.post(
            f"/compute/jobs/{job_id}/heartbeat",
            params={"worker_id": worker_id, "lease_extension_minutes": lease_extension_minutes},
        )
        resp.raise_for_status()
        return resp.json()

    def complete_job(self, job_id: str, worker_id: str, result: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        resp = self._client.post(
            f"/compute/jobs/{job_id}/complete",
            params={"worker_id": worker_id},
            json={"result": result or {}},
        )
        resp.raise_for_status()
        return resp.json()

    def fail_job(self, job_id: str, worker_id: str, error: str) -> Dict[str, Any]:
        resp = self._client.post(
            f"/compute/jobs/{job_id}/fail",
            params={"worker_id": worker_id},
            json={"error": error},
        )
        resp.raise_for_status()
        return resp.json()
