import time
import numpy as np
from PIL import Image
from io import BytesIO
import base64
from .renderer import SoftwareRenderer
from .render_utils import RenderUtils

class PreviewGenerator:
    def __init__(self):
        self.renderer = SoftwareRenderer()

    def generate_avatar_previews(self, vertices: list, faces: list, 
                                 view_type: str = "front", 
                                 transparent_bg: bool = False) -> dict:
        """
        Validates mesh geometry and renders multi-resolution preview images.
        Returns: {
            "status": "SUCCESS" | "FAILED",
            "previews": {
                "large": PIL.Image,
                "medium": PIL.Image,
                "thumbnail": PIL.Image
            },
            "diagnostics": dict
        }
        """
        start_time = time.perf_counter()

        # 1. Quality validation
        try:
            RenderUtils.validate_mesh(vertices, faces)
        except Exception as e:
            return {
                "status": "FAILED",
                "error": f"Mesh quality validation rejected: {e}"
            }

        v = np.array(vertices)
        f = np.array(faces)

        # 2. Render at multiple resolutions
        img_large = self.renderer.render(v, f, 1024, 1024, view_type, transparent_bg)
        img_medium = self.renderer.render(v, f, 512, 512, view_type, transparent_bg)
        img_thumbnail = self.renderer.render(v, f, 128, 128, view_type, transparent_bg)

        render_time_ms = (time.perf_counter() - start_time) * 1000.0

        # Compile statistics
        return {
            "status": "SUCCESS",
            "previews": {
                "large": img_large,
                "medium": img_medium,
                "thumbnail": img_thumbnail
            },
            "diagnostics": {
                "renderTimeMs": round(render_time_ms, 2),
                "camera": {
                    "viewType": view_type,
                    "resolution": "1024x1024, 512x512, 128x128"
                },
                "meshStats": {
                    "vertexCount": len(v),
                    "faceCount": len(f)
                },
                "lightingProfile": self.renderer.lighting.get_profile()
            }
        }

avatar_preview_generator = PreviewGenerator()
