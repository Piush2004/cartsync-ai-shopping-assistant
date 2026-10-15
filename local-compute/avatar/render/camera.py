import numpy as np

class Camera:
    def __init__(self, view_type: str = "front"):
        self.view_type = view_type.lower()
        # Camera projection view configurations
        if self.view_type == "front":
            self.yaw = 0.0
            self.pitch = 0.0
        elif self.view_type == "side":
            self.yaw = 90.0
            self.pitch = 0.0
        elif self.view_type == "isometric":
            self.yaw = 45.0
            self.pitch = 30.0
        else:
            self.yaw = 0.0
            self.pitch = 0.0

    def get_view_transform(self) -> np.ndarray:
        """
        Calculates the 3x3 rotation transformation matrix based on camera yaw/pitch angles.
        """
        yaw_rad = np.radians(self.yaw)
        pitch_rad = np.radians(self.pitch)

        # Yaw rotation (around Y axis)
        R_y = np.array([
            [np.cos(yaw_rad), 0, np.sin(yaw_rad)],
            [0, 1, 0],
            [-np.sin(yaw_rad), 0, np.cos(yaw_rad)]
        ])

        # Pitch rotation (around X axis)
        R_x = np.array([
            [1, 0, 0],
            [0, np.cos(pitch_rad), -np.sin(pitch_rad)],
            [0, np.sin(pitch_rad), np.cos(pitch_rad)]
        ])

        return np.dot(R_x, R_y)

    def project_vertices(self, vertices: np.ndarray, width: int, height: int, scale: float = 1.2) -> np.ndarray:
        """
        Applies view transformation and projects 3D vertices to 2D screen coordinate pixels.
        """
        R = self.get_view_transform()
        transformed = np.dot(vertices, R.T)

        # Extract projected X and Y, and Z for depth buffer
        x = transformed[:, 0]
        y = transformed[:, 1]
        z = transformed[:, 2]

        # Centering and scaling logic
        min_y, max_y = np.min(y), np.max(y)
        min_x, max_x = np.min(x), np.max(x)

        # Center mesh coordinates
        cx = (min_x + max_x) / 2.0
        cy = (min_y + max_y) / 2.0
        
        span_y = max_y - min_y
        span_x = max_x - min_x
        max_span = max(span_x, span_y)
        if max_span == 0.0:
            max_span = 1.0
        
        # Calculate pixels projection scale factor
        pixel_scale = (min(width, height) * 0.7) / max_span * scale

        proj_x = (x - cx) * pixel_scale + (width / 2.0)
        # Flip Y so positive goes upward on screen view
        proj_y = -(y - cy) * pixel_scale + (height / 2.0)

        # Pack screen coordinates and depth
        return np.column_stack((proj_x, proj_y, z))
