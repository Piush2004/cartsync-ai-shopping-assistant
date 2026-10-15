import time
import numpy as np
from PIL import Image
from .depth_provider import depth_provider
from .depth_cache import depth_cache
from .depth_refiner import depth_refiner
from .depth_visualizer import depth_visualizer

class DepthManager:
    def __init__(self):
        self.provider = depth_provider
        self.cache = depth_cache
        self.refiner = depth_refiner
        self.visualizer = depth_visualizer

    def process_depth(self, image: Image.Image) -> dict:
        """
        Extracts, refines, caches, and visualizes depth maps.
        """
        start_time = time.perf_counter()

        # 1. Compute Image Hash
        img_hash = self.cache.get_image_hash(image)

        # 2. Cache Lookup
        cached_result = self.cache.lookup(img_hash)
        cache_hit = False

        if cached_result is not None:
            depth_map, conf_map = cached_result
            cache_hit = True
        else:
            # 3. Estimate Depth
            raw_depth, conf_map = self.provider.estimate_depth(image)
            
            # 4. Refine Depth
            depth_map = self.refiner.refine_depth_map(raw_depth)
            
            # 5. Store Cache
            self.cache.store(img_hash, depth_map, conf_map)

        inference_time_ms = (time.perf_counter() - start_time) * 1000.0

        # Calculate Statistics
        # Exclude background pixels (255) for accurate subject averages
        subject_depth = depth_map[depth_map < 255]
        avg_depth = float(np.mean(subject_depth)) if len(subject_depth) > 0 else 255.0
        avg_confidence = float(np.mean(conf_map))

        w, h = image.size

        # Compile Metadata
        metadata = {
            "imageHash": img_hash,
            "modelVersion": self.provider.model_version,
            "inferenceTimeMs": round(inference_time_ms, 2),
            "depthResolution": f"{w}x{h}",
            "averageDepth": round(avg_depth, 2),
            "confidence": round(avg_confidence, 2),
            "cacheHit": cache_hit
        }

        return {
            "status": "SUCCESS",
            "depthMap": depth_map.tolist(),
            "confidenceMap": conf_map.tolist(),
            "metadata": metadata
        }

depth_manager = DepthManager()
