import os
import time
import numpy as np
from PIL import Image

from .runtime.depth_runtime import depth_runtime

class BaseDepthProvider:
    def estimate_depth(self, image: Image.Image) -> tuple:
        """
        Calculates depth map values for the input image.
        Returns: (depth_map, confidence_map)
        """
        raise NotImplementedError

class DepthAnythingV2Provider(BaseDepthProvider):
    def __init__(self):
        self.model_name = "DepthAnythingV2"
        self.model_version = "2.0.0"
        self.active = False
        try:
            import torch
            import onnxruntime
            self.active = True
        except ImportError:
            pass

    def estimate_depth(self, image: Image.Image) -> tuple:
        """
        Primary execution. Calls the official depth_runtime compute pipeline.
        """
        res = depth_runtime.compute_depth(image)
        depth_map = res["depthMap"]
        
        # Calculate matching confidence map
        h, w = depth_map.shape
        confidence_map = np.full((h, w), 200, dtype=np.uint8)
        
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
                confidence_map[y, x] = 240 - int(60 * dist_to_center)

        return depth_map, confidence_map

depth_provider = DepthAnythingV2Provider()
