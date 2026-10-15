import numpy as np
from PIL import Image

class DepthVisualizer:
    def create_heatmap(self, depth_map: np.ndarray) -> Image.Image:
        """
        Converts a 2D depth map array (0-255 uint8) to a colored Jet-like heatmap PIL Image.
        """
        h, w = depth_map.shape
        heatmap = np.zeros((h, w, 3), dtype=np.uint8)

        # Normalize depth to 0-1 range
        norm_depth = depth_map.astype(float) / 255.0

        # Simple Jet colormap approximation:
        # Blue (far) -> Cyan -> Green -> Yellow -> Red (close)
        # We invert the colors so close coordinates appear red/hot, far coordinates blue/cold
        r = np.clip(1.5 - np.abs(4.0 * norm_depth - 3.0), 0.0, 1.0)
        g = np.clip(1.5 - np.abs(4.0 * norm_depth - 2.0), 0.0, 1.0)
        b = np.clip(1.5 - np.abs(4.0 * norm_depth - 1.0), 0.0, 1.0)

        # Pack channels and scale to 0-255
        heatmap[:, :, 0] = (r * 255).astype(np.uint8)
        heatmap[:, :, 1] = (g * 255).astype(np.uint8)
        heatmap[:, :, 2] = (b * 255).astype(np.uint8)

        return Image.fromarray(heatmap)

    def generate_visualization_strip(self, original: Image.Image, 
                                     depth_map: np.ndarray) -> Image.Image:
        """
        Stitches: Original Image | Grayscale Depth | Colored Heatmap side-by-side.
        """
        w, h = original.size
        
        # 1. Grayscale Depth Image
        gray_depth = Image.fromarray(depth_map).convert("L")
        
        # 2. Colored Heatmap Image
        heatmap = self.create_heatmap(depth_map)

        # Stitch together (3 * width)
        strip = Image.new("RGB", (w * 3, h))
        strip.paste(original, (0, 0))
        strip.paste(gray_depth.convert("RGB"), (w, 0))
        strip.paste(heatmap, (w * 2, 0))

        return strip

depth_visualizer = DepthVisualizer()
