import pytest

from workers.worker_registry import (
    WORKER_REGISTRY,
    AvatarWorker,
    LLMWorker,
    MeasurementWorker,
    VtonWorker,
    get_worker_for_job_type,
)
from workers.base_worker import WorkerNotImplementedError


@pytest.mark.parametrize(
    "job_type,expected_class",
    [
        ("MEASUREMENT", MeasurementWorker),
        ("AVATAR", AvatarWorker),
        ("VTON", VtonWorker),
        ("LLM", LLMWorker),
    ],
)
def test_routes_each_job_type_to_the_correct_worker_class(job_type, expected_class):
    worker = get_worker_for_job_type(job_type)
    assert isinstance(worker, expected_class)
    assert worker.can_handle(job_type)


def test_unknown_job_type_raises_worker_not_implemented_error():
    with pytest.raises(WorkerNotImplementedError):
        get_worker_for_job_type("SOMETHING_ELSE")


@pytest.mark.parametrize("worker", WORKER_REGISTRY.values())
def test_every_registered_worker_execute_raises_not_fabricates(worker):
    # Phase 4 is infrastructure only -- every worker must fail honestly
    # instead of returning a fake result.
    with pytest.raises(WorkerNotImplementedError):
        worker.execute({"anything": "goes"})


def test_worker_does_not_claim_a_capability_it_lacks():
    measurement_worker = get_worker_for_job_type("MEASUREMENT")
    assert measurement_worker.can_handle("VTON") is False
