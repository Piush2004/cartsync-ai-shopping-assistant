from typing import Any, Dict

from workers.base_worker import BaseWorker, WorkerNotImplementedError


class MeasurementWorker(BaseWorker):
    name = "MeasurementWorker"
    capabilities = ["MEASUREMENT"]

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise WorkerNotImplementedError(
            "MeasurementWorker execution is not implemented -- Phase 4 is infrastructure only"
        )


class AvatarWorker(BaseWorker):
    name = "AvatarWorker"
    capabilities = ["AVATAR"]

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise WorkerNotImplementedError(
            "AvatarWorker execution is not implemented -- Phase 4 is infrastructure only"
        )


class VtonWorker(BaseWorker):
    name = "VtonWorker"
    capabilities = ["VTON"]

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise WorkerNotImplementedError(
            "VtonWorker execution is not implemented -- Phase 4 is infrastructure only"
        )


class LLMWorker(BaseWorker):
    name = "LLMWorker"
    capabilities = ["LLM"]

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise WorkerNotImplementedError(
            "LLMWorker execution is not implemented -- Phase 4 is infrastructure only"
        )


WORKER_REGISTRY: Dict[str, BaseWorker] = {
    "MEASUREMENT": MeasurementWorker(),
    "AVATAR": AvatarWorker(),
    "VTON": VtonWorker(),
    "LLM": LLMWorker(),
}


def get_worker_for_job_type(job_type: str) -> BaseWorker:
    try:
        return WORKER_REGISTRY[job_type]
    except KeyError:
        raise WorkerNotImplementedError(f"No worker registered for job type '{job_type}'")
