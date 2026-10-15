import numpy as np
from PIL import Image, ImageDraw
from .camera import Camera
from .lighting import Lighting
from .render_utils import RenderUtils

class SoftwareRenderer:
    def __init__(self):
        self.lighting = Lighting()

    def render(self, vertices: np.ndarray, faces: np.ndarray, 
               width: int, height: int, view_type: str = "front",
               transparent_bg: bool = False) -> Image.Image:
        """
        Renders 3D mesh coordinates to a 2D PIL Image using the Painter's Algorithm.
        """
        camera = Camera(view_type=view_type)
        
        # 1. Project 3D vertices to screen space (proj: width x height x Z-depth)
        proj_verts = camera.project_vertices(vertices, width, height)

        # 2. Calculate face normals for shading
        face_normals = RenderUtils.calculate_face_normals(vertices, faces)

        # 3. Painter's Algorithm: Compute average Z-depth for each face and sort
        face_depths = np.mean(proj_verts[faces, 2], axis=1)
        sorted_indices = np.argsort(face_depths) # Sort back-to-front

        # 4. Initialize canvas
        if transparent_bg:
            img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        else:
            # Dark premium neutral background matching the developer theme
            img = Image.new("RGBA", (width, height), (13, 15, 18, 255))
            
        draw = ImageDraw.Draw(img)

        # 5. Draw faces in back-to-front order
        for idx in sorted_indices:
            face = faces[idx]
            normal = face_normals[idx]
            
            # Check if face is back-facing (simple back-face culling)
            # In transformed camera space, the camera looks down the Z axis.
            # R_cam = camera.get_view_transform()
            # normal_cam = dot(normal, R_cam.T)
            # If normal_cam.z > 0, it points towards the camera.
            # We can approximate this or render all to avoid gaps on boundary edges.
            
            # Calculate shade color
            color_rgb = self.lighting.calculate_shading(normal)
            
            # Draw shaded triangle polygon
            pts = [
                (proj_verts[face[0], 0], proj_verts[face[0], 1]),
                (proj_verts[face[1], 0], proj_verts[face[1], 1]),
                (proj_verts[face[2], 0], proj_verts[face[2], 1])
            ]
            
            # Convert color to tuple format for PIL
            color_tuple = (int(color_rgb[0]), int(color_rgb[1]), int(color_rgb[2]), 255)
            
            # Draw polygon. Draw a thin outline of the same color to avoid edge gaps
            draw.polygon(pts, fill=color_tuple, outline=color_tuple)

        return img
