from typing import Any, Dict, List, Optional

from clients.backend_client import BackendClient


class QueueClient:
    """
    Turns "list of claimable jobs" (BackendClient.poll_jobs) into "the next
    job this worker actually claimed" (BackendClient.claim_job), so callers
    never have to deal with the poll/claim split or the possibility that a
    listed job gets claimed by someone else first -- claim_next_job just
    tries candidates in order until one succeeds.
    """

    def __init__(self, backend: BackendClient):
        self._backend = backend

    def claim_next_job(
        self, worker_id: str, capabilities: List[str], lease_minutes: int
    ) -> Optional[Dict[str, Any]]:
        for job in self._backend.poll_jobs(capabilities):
            if self._backend.claim_job(job["id"], worker_id, lease_minutes):
                return job
        return None
