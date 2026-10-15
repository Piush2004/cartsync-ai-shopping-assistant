import time
import os
import numpy as np
from PIL import Image

from .runtime_validator import runtime_validator
from .model_loader import model_loader
from .onnx_provider import onnx_provider
from .torch_provider import torch_provider

class DepthRuntime:
    def __init__(self):
        self.encoder = "vitl"
        self.model_version = "2.0.0"

    @property
    def dev_mode(self) -> bool:
        return os.getenv("DEPTH_DEV_MODE", "false").lower() == "true"

    def compute_depth(self, image: Image.Image) -> dict:
        """
        Loads the depth model weights and runs the depth estimation inference pass.
        If in dev_mode, supports running with mocked fallbacks.
        """
        start = time.perf_counter()
        
        resources = runtime_validator.check_system_resources()
        use_cuda = resources["hasCuda"]
        
        onnx_path = model_loader.get_onnx_model_path(self.encoder)
        torch_path = model_loader.get_torch_model_path(self.encoder)

        backend_used = "MockEmulator"
        device = resources["deviceName"]
        loaded = False

        # 1. Try ONNX (preferred)
        if onnx_provider.active and (os.path.exists(onnx_path) or not self.dev_mode):
            if not self.dev_mode:
                runtime_validator.validate_weights_file(onnx_path)
            loaded = onnx_provider.load_session(onnx_path, use_cuda=use_cuda)
            if loaded:
                backend_used = "ONNXRuntime"

        # 2. Try PyTorch (fallback)
        if not loaded and torch_provider.active and (os.path.exists(torch_path) or not self.dev_mode):
            if not self.dev_mode:
                runtime_validator.validate_weights_file(torch_path)
            loaded = torch_provider.load_model(torch_path, use_cuda=use_cuda)
            if loaded:
                backend_used = "PyTorch"

        img_np = np.array(image.convert("RGB"))
        h, w, _ = img_np.shape

        # 3. Generate Depth Map (real or procedural emulation)
        if loaded:
            if backend_used == "ONNXRuntime":
                depth_map = onnx_provider.predict_depth(img_np)
            else:
                depth_map = torch_provider.predict_depth(img_np)
        else:
            if not self.dev_mode:
                raise FileNotFoundError("Descriptive Error: Depth Anything V2 weights are missing in production mode.")
            # Dev Mode procedural human shape simulation
            depth_map = self._generate_procedural_depth(h, w)

        duration = (time.perf_counter() - start) * 1000.0

        # Memory usage of the running process
        import psutil
        process = psutil.Process(os.getpid())
        mem_mb = process.memory_info().rss / (1024 * 1024)

        return {
            "depthMap": depth_map,
            "inferenceTimeMs": round(duration, 2),
            "backendUsed": backend_used,
            "device": device,
            "memoryUsageMb": round(mem_mb, 2),
            "modelVersion": self.model_version
        }

    def _generate_procedural_depth(self, h: int, w: int) -> np.ndarray:
        depth_map = np.full((h, w), 255, dtype=np.uint8)
        cx = w // 2
        for y in range(h):
            neck_y = int(h * 0.15)
            hips_y = int(h * 0.55)
            if y < neck_y:
                half_width = int(w * 0.08)
            elif y < hips_y:
                half_width = int(w * 0.18 * (1.0 - 0.2 * (y - neck_y) / (hips_y - neck_y)))
            else:
                half_width = int(w * 0.12)
            left = max(0, cx - half_width)
            right = min(w, cx + half_width)
            for x in range(left, right):
                dist_to_center = abs(x - cx) / half_width if half_width > 0 else 0
                depth_map[y, x] = 80 + int(80 * dist_to_center)
        return depth_map

depth_runtime = DepthRuntime()
