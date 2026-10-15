import subprocess
from datetime import datetime
from threading import Lock
from typing import Optional, Tuple

from config.settings import settings
from utils.logging import get_logger

logger = get_logger(__name__)


class VRAMManager:
    """
    Bookkeeping-only VRAM gate -- not real GPU memory management. The RTX
    5060 this node runs on has 8GB VRAM, not enough headroom to safely run
    two heavy GPU jobs (LLM inference, IDM-VTON) at once, and this phase is
    explicitly forbidden from attempting unsafe GPU memory manipulation
    (no CUDA calls). So this just serializes settings.HEAVY_JOB_TYPES via a
    lock: acquire() before running a heavy job, release() after. The
    nvidia-smi free-VRAM reading is informational only (exposed through
    get_state() for the /health endpoint), never used to decide anything.
    """

    def __init__(self):
        self._lock = Lock()
        self._active_heavy_job_type: Optional[str] = None
        self._loaded_since: Optional[datetime] = None

    def is_heavy(self, job_type: str) -> bool:
        return job_type in settings.HEAVY_JOB_TYPES

    def acquire(self, job_type: str) -> bool:
        with self._lock:
            if self._active_heavy_job_type is not None:
                logger.info("VRAM slot busy with %s, refusing %s", self._active_heavy_job_type, job_type)
                return False
            self._active_heavy_job_type = job_type
            self._loaded_since = datetime.utcnow()
            return True

    def release(self, job_type: str) -> None:
        with self._lock:
            if self._active_heavy_job_type == job_type:
                self._active_heavy_job_type = None
                self._loaded_since = None

    def get_state(self) -> dict:
        free_mb, total_mb = _query_nvidia_smi_vram_mb()
        return {
            "max_vram_gb": settings.MAX_VRAM_GB,
            "active_heavy_job_type": self._active_heavy_job_type,
            "loaded_since": self._loaded_since.isoformat() if self._loaded_since else None,
            "nvidia_smi_free_vram_mb": free_mb,
            "nvidia_smi_total_vram_mb": total_mb,
        }


def _query_nvidia_smi_vram_mb() -> Tuple[Optional[float], Optional[float]]:
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.free,memory.total", "--format=csv,noheader,nounits"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=2,
        )
        if result.returncode == 0:
            free_str, total_str = result.stdout.strip().split(",")
            return float(free_str.strip()), float(total_str.strip())
    except Exception:
        pass
    return None, None
