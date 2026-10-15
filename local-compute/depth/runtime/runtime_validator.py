import os
import psutil

class RuntimeValidator:
    def check_system_resources(self) -> dict:
        """
        Detects GPU, CUDA support, available VRAM, and RAM memory size.
        """
        has_cuda = False
        device_name = "CPU"
        vram_mb = 0.0

        # Try detecting CUDA via torch
        try:
            import torch
            has_cuda = torch.cuda.is_available()
            if has_cuda:
                device_name = torch.cuda.get_device_name(0)
                vram_mb = torch.cuda.get_device_properties(0).total_memory / (1024 * 1024)
        except ImportError:
            pass

        # Detect total system RAM
        ram_gb = psutil.virtual_memory().total / (1024 * 1024 * 1024)

        return {
            "hasCuda": has_cuda,
            "deviceName": device_name,
            "vramMb": round(vram_mb, 2),
            "ramGb": round(ram_gb, 2)
        }

    def validate_weights_file(self, filepath: str) -> bool:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Depth model weight file missing at: {filepath}")
        if not os.access(filepath, os.R_OK):
            raise PermissionError(f"Depth model weight file at {filepath} is not readable.")
        return True

runtime_validator = RuntimeValidator()
