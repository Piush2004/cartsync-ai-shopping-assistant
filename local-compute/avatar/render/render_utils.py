import numpy as np

class RenderUtils:
    @staticmethod
    def calculate_face_normals(vertices: np.ndarray, faces: np.ndarray) -> np.ndarray:
        """
        Computes normalized vectors perpendicular to each face plane.
        """
        p0 = vertices[faces[:, 0]]
        p1 = vertices[faces[:, 1]]
        p2 = vertices[faces[:, 2]]

        edge1 = p1 - p0
        edge2 = p2 - p0

        # Cross product of edges
        normals = np.cross(edge1, edge2)
        
        # Normalize vectors
        norms = np.linalg.norm(normals, axis=1, keepdims=True)
        # Avoid division by zero
        norms = np.where(norms == 0, 1.0, norms)
        return normals / norms

    @staticmethod
    def validate_mesh(vertices: list, faces: list):
        """
        Validates topological formats and checks for corrupt or empty items.
        """
        if not vertices or len(vertices) == 0:
            raise ValueError("Mesh validation error: Vertices list is empty.")
        if not faces or len(faces) == 0:
            raise ValueError("Mesh validation error: Faces list is empty.")

        v = np.array(vertices)
        f = np.array(faces)

        if np.isnan(v).any() or np.isinf(v).any():
            raise ValueError("Mesh validation error: Vertices contain NaN or Inf coordinates.")

        if int(np.max(f)) >= len(v):
            raise ValueError("Mesh validation error: Face index is out-of-bounds relative to vertex counts.")

        # Calculate bounding box dimensions
        min_bounds = np.min(v, axis=0)
        max_bounds = np.max(v, axis=0)
        span = max_bounds - min_bounds
        
        if np.any(span == 0.0):
            # Degenerate planar shape
            pass
