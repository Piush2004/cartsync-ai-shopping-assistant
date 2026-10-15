import os
import hashlib
import numpy as np
from PIL import Image

class DepthCache:
    def __init__(self, cache_dir: str = "./cache/depth"):
        self.cache_dir = cache_dir
        self.memory_cache = {}
        os.makedirs(self.cache_dir, exist_ok=True)

    def get_image_hash(self, image: Image.Image) -> str:
        """
        Generates a unique SHA-256 signature from the raw image pixel buffer.
        """
        hasher = hashlib.sha256()
        # Convert image to bytes
        img_bytes = image.tobytes()
        hasher.update(img_bytes)
        return hasher.hexdigest()

    def lookup(self, img_hash: str) -> tuple:
        """
        Checks cache for existing depth and confidence arrays.
        """
        if img_hash in self.memory_cache:
            return self.memory_cache[img_hash]

        # Check local disk cache
        depth_path = os.path.join(self.cache_dir, f"{img_hash}_depth.npy")
        conf_path = os.path.join(self.cache_dir, f"{img_hash}_conf.npy")

        if os.path.exists(depth_path) and os.path.exists(conf_path):
            try:
                depth_map = np.load(depth_path)
                conf_map = np.load(conf_path)
                self.memory_cache[img_hash] = (depth_map, conf_map)
                return depth_map, conf_map
            except Exception:
                pass

        return None

    def store(self, img_hash: str, depth_map: np.ndarray, conf_map: np.ndarray):
        """
        Stores depth maps in memory and on disk.
        """
        self.memory_cache[img_hash] = (depth_map, conf_map)
        
        depth_path = os.path.join(self.cache_dir, f"{img_hash}_depth.npy")
        conf_path = os.path.join(self.cache_dir, f"{img_hash}_conf.npy")
        
        try:
            np.save(depth_path, depth_map)
            np.save(conf_path, conf_map)
        except Exception as e:
            print(f"[DepthCache] Failed to write cache files: {e}")

depth_cache = DepthCache()
