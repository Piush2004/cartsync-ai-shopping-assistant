from abc import ABC, abstractmethod
from typing import Any, Dict, List


class WorkerNotImplementedError(Exception):
    """Raised by a placeholder worker's execute(). Phase 4 is infrastructure
    only -- no worker may fabricate a result, so every concrete worker this
    phase raises this instead of returning invented output."""


class BaseWorker(ABC):
    name: str
    capabilities: List[str]

    def can_handle(self, job_type: str) -> bool:
        return job_type in self.capabilities

    @abstractmethod
    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Executes one job's payload and returns its result dict, or raises."""
        raise NotImplementedError
