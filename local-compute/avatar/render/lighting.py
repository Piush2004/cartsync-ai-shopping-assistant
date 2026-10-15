import numpy as np

class Lighting:
    def __init__(self, use_three_point: bool = True):
        # 1. Key Light: Top-Front-Right
        self.key_dir = self._normalize(np.array([1.0, 1.0, 1.0]))
        self.key_intensity = 0.7
        self.key_color = np.array([255, 252, 240]) # Warm white

        # 2. Fill Light: Top-Front-Left
        self.fill_dir = self._normalize(np.array([-1.0, 0.5, 1.0]))
        self.fill_intensity = 0.3
        self.fill_color = np.array([230, 240, 255]) # Cool blue-white

        # 3. Back Light: Behind-Top
        self.back_dir = self._normalize(np.array([0.0, 1.0, -1.0]))
        self.back_intensity = 0.4
        self.back_color = np.array([255, 255, 255])

        # Ambient Base
        self.ambient_intensity = 0.15
        self.ambient_color = np.array([255, 255, 255])

    def _normalize(self, v: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(v)
        return v / norm if norm > 0 else v

    def calculate_shading(self, normal: np.ndarray) -> np.ndarray:
        """
        Computes Lambertian diffuse shading color for a given surface normal vector.
        """
        # Ensure normal is unit vector
        n = self._normalize(normal)

        # Diffuse factors
        key_factor = max(0.0, np.dot(n, self.key_dir))
        fill_factor = max(0.0, np.dot(n, self.fill_dir))
        back_factor = max(0.0, np.dot(n, self.back_dir))

        # Accumulate RGB components
        rgb = (
            self.ambient_color * self.ambient_intensity +
            self.key_color * (key_factor * self.key_intensity) +
            self.fill_color * (fill_factor * self.fill_intensity) +
            self.back_color * (back_factor * self.back_intensity)
        )

        return np.clip(rgb, 0, 255).astype(np.uint8)

    def get_profile(self) -> dict:
        return {
            "ambient": self.ambient_intensity,
            "keyLight": {"direction": self.key_dir.tolist(), "intensity": self.key_intensity},
            "fillLight": {"direction": self.fill_dir.tolist(), "intensity": self.fill_intensity},
            "backLight": {"direction": self.back_dir.tolist(), "intensity": self.back_intensity}
        }
