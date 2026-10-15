import platform
import socket
import subprocess
from typing import Any, Dict, Optional, Tuple

import psutil

from config.settings import settings


def get_hostname() -> str:
    return socket.gethostname()


def get_platform() -> str:
    return f"{platform.system()}-{platform.release()}"


def get_cpu_info() -> Optional[str]:
    return platform.processor() or None


def get_ram_gb() -> int:
    return round(psutil.virtual_memory().total / (1024 ** 3))


def get_gpu_info() -> Optional[str]:
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=2,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return None


def get_vram_gb() -> Optional[int]:
    total_mb = _query_nvidia_smi_total_vram_mb()
    return round(total_mb / 1024) if total_mb else None


def _query_nvidia_smi_total_vram_mb() -> Optional[float]:
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.total", "--format=csv,noheader,nounits"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=2,
        )
        if result.returncode == 0:
            return float(result.stdout.strip())
    except Exception:
        pass
    return None


def build_registration_payload(worker_id: str) -> Dict[str, Any]:
    return {
        "worker_id": worker_id,
        "hostname": get_hostname(),
        "platform": get_platform(),
        "cpu": get_cpu_info(),
        "ram_gb": get_ram_gb(),
        "gpu": get_gpu_info(),
        "vram_gb": get_vram_gb(),
        "capabilities": settings.WORKER_CAPABILITIES,
    }
