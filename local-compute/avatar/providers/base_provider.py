class BaseAvatarProvider:
    """
    Base Interface Class for all digital 3D body representation engines.
    Allows hot-swapping providers (SMPL, SMPL-X, PIFuHD, etc.) dynamically.
    """
    def generate_mesh(self, betas: list, gender: str) -> dict:
        """
        Generates the 3D body mesh from shape beta coefficients.
        Returns a dict containing: mesh_path (GLB/GLTF), vertices_count, faces_count.
        """
        raise NotImplementedError("Subclasses must implement generate_mesh.")
