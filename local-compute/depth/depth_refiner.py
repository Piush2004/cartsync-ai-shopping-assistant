import numpy as np

class DepthRefiner:
    def refine_depth_map(self, depth_map: np.ndarray) -> np.ndarray:
        """
        Applies edge refinement filters (e.g. median/box smoothing)
        to optimize boundary gradients of the estimated depth maps.
        """
        refined = depth_map.copy()
        
        # Simple fast local box smoothing to filter jagged pixel edges
        # We average elements using a 3x3 kernel (simple NumPy vectorization)
        padded = np.pad(refined, 1, mode='edge')
        kernel_sum = (
            padded[0:-2, 0:-2] + padded[0:-2, 1:-1] + padded[0:-2, 2:] +
            padded[1:-1, 0:-2] + padded[1:-1, 1:-1] + padded[1:-1, 2:] +
            padded[2:,   0:-2] + padded[2:,   1:-1] + padded[2:,   2:]
        )
        smoothed = (kernel_sum / 9.0).astype(np.uint8)

        # Retain original background values (255) to avoid blending outlines into space
        bg_mask = (depth_map == 255)
        smoothed[bg_mask] = 255

        return smoothed

depth_refiner = DepthRefiner()
