from unittest.mock import MagicMock

from job_queue.queue_client import QueueClient


def test_claim_next_job_returns_first_successfully_claimed_job():
    backend = MagicMock()
    backend.poll_jobs.return_value = [{"id": "job-1"}, {"id": "job-2"}]
    backend.claim_job.return_value = True

    client = QueueClient(backend)
    job = client.claim_next_job("worker-1", ["LLM"], lease_minutes=3)

    assert job == {"id": "job-1"}
    backend.claim_job.assert_called_once_with("job-1", "worker-1", 3)


def test_claim_next_job_moves_on_when_a_candidate_is_already_claimed():
    backend = MagicMock()
    backend.poll_jobs.return_value = [{"id": "job-1"}, {"id": "job-2"}]
    # First candidate loses the race (another worker claimed it first).
    backend.claim_job.side_effect = [False, True]

    client = QueueClient(backend)
    job = client.claim_next_job("worker-1", ["LLM"], lease_minutes=3)

    assert job == {"id": "job-2"}
    assert backend.claim_job.call_count == 2


def test_claim_next_job_returns_none_when_nothing_claimable():
    backend = MagicMock()
    backend.poll_jobs.return_value = []

    client = QueueClient(backend)
    job = client.claim_next_job("worker-1", ["LLM"], lease_minutes=3)

    assert job is None
    backend.claim_job.assert_not_called()


def test_claim_next_job_returns_none_when_every_candidate_loses_the_race():
    backend = MagicMock()
    backend.poll_jobs.return_value = [{"id": "job-1"}, {"id": "job-2"}]
    backend.claim_job.return_value = False

    client = QueueClient(backend)
    job = client.claim_next_job("worker-1", ["LLM"], lease_minutes=3)

    assert job is None
    assert backend.claim_job.call_count == 2
