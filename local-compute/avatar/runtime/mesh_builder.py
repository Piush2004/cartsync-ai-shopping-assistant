import numpy as np
import math

class MeshBuilder:
    def calculate_bounding_box(self, vertices: np.ndarray) -> dict:
        """
        Calculates 3D bounding box coordinate bounds.
        """
        min_bounds = np.min(vertices, axis=0)
        max_bounds = np.max(vertices, axis=0)
        return {
            "min": [round(float(v), 3) for v in min_bounds],
            "max": [round(float(v), 3) for v in max_bounds]
        }

    def generate_emulated_template(self, num_vertices: int = 6890) -> np.ndarray:
        """Generates standard vertical human envelope cylinder vertices."""
        vertices = []
        for i in range(num_vertices):
            y = (i / num_vertices) * 1.8 - 0.9
            r = 0.25 * math.cos(y * 1.5) + 0.05
            angle = (i % 36) * (2 * math.pi / 36)
            x = r * math.cos(angle)
            z = r * math.sin(angle)
            vertices.append([x, y, z])
        return np.array(vertices)

    def generate_emulated_faces(self, num_vertices: int = 6890, num_faces: int = 13776) -> np.ndarray:
        """Constructs basic triangular indices connecting vertices."""
        faces = []
        for i in range(num_vertices):
            next_i = (i + 1) % num_vertices
            next_row = (i + 36) % num_vertices
            diag_i = (i + 37) % num_vertices
            faces.append([i, next_i, next_row])
            faces.append([next_i, diag_i, next_row])
        while len(faces) < num_faces:
            faces.append([0, 1, 36])
        return np.array(faces[:num_faces])

mesh_builder = MeshBuilder()
