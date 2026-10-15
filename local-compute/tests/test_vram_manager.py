from runtime.vram_manager import VRAMManager
from config.settings import settings


def test_is_heavy_matches_settings_heavy_job_types():
    manager = VRAMManager()
    for job_type in settings.HEAVY_JOB_TYPES:
        assert manager.is_heavy(job_type) is True
    assert manager.is_heavy("MEASUREMENT") is False


def test_acquire_succeeds_when_no_active_heavy_job():
    manager = VRAMManager()
    assert manager.acquire("LLM") is True


def test_second_acquire_for_a_different_heavy_type_is_refused_while_first_active():
    manager = VRAMManager()
    assert manager.acquire("LLM") is True
    assert manager.acquire("VTON") is False


def test_release_frees_the_slot_for_the_next_heavy_job():
    manager = VRAMManager()
    manager.acquire("LLM")
    manager.release("LLM")
    assert manager.acquire("VTON") is True


def test_release_is_a_noop_if_the_slot_is_held_by_a_different_job_type():
    manager = VRAMManager()
    manager.acquire("LLM")
    manager.release("VTON")  # not the type holding the slot
    assert manager.acquire("VTON") is False


def test_get_state_reports_active_heavy_job_type():
    manager = VRAMManager()
    assert manager.get_state()["active_heavy_job_type"] is None
    manager.acquire("LLM")
    assert manager.get_state()["active_heavy_job_type"] == "LLM"
