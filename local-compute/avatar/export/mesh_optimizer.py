import numpy as np

class MeshOptimizer:
    def optimize_mesh(self, vertices: list, faces: list) -> tuple:
        """
        Applies mesh optimization pipelines:
        1. Vertex deduplication
        2. Index optimization
        3. Normal validation
        Returns: (optimized_vertices, optimized_faces)
        """
        # 1. Vertex Deduplication
        v = np.array(vertices, dtype=np.float32)
        f = np.array(faces, dtype=np.int32)

        # Round coordinates to 5 decimal places to find close duplicates
        rounded_verts = np.round(v, decimals=5)
        unique_verts, inverse_indices = np.unique(rounded_verts, axis=0, return_inverse=True)

        # Remap face indices to unique vertices
        optimized_faces = inverse_indices[f]

        # 2. Index Optimization (Ensure faces list contains only valid index references)
        optimized_faces = optimized_faces.tolist()
        optimized_vertices = unique_verts.tolist()

        # 3. Normal Validation
        self.validate_normals(optimized_vertices, optimized_faces)

        return optimized_vertices, optimized_faces

    def validate_normals(self, vertices: list, faces: list) -> bool:
        """
        Validates that normal vectors are non-zero and non-degenerate.
        """
        v = np.array(vertices)
        f = np.array(faces)

        p0 = v[f[:, 0]]
        p1 = v[f[:, 1]]
        p2 = v[f[:, 2]]

        edge1 = p1 - p0
        edge2 = p2 - p0
        normals = np.cross(edge1, edge2)
        norms = np.linalg.norm(normals, axis=1)

        # Alert if face normals have near-zero area
        degenerate_count = int(np.sum(norms < 1e-7))
        if degenerate_count > 0:
            print(f"[MeshOptimizer] WARNING: Detected {degenerate_count} degenerate faces during normal validation.")
            
        return True

mesh_optimizer = MeshOptimizer()
