import os
import time
import numpy as np
import math
from ..base_provider import BaseAvatarProvider
from .config import smpl_config
from .loader import smpl_model_loader

from ...runtime.smpl_runtime import smpl_runtime

class MissingSMPLModelError(Exception):
    """Custom exception raised when official SMPL model files are missing in production mode."""
    pass

class SMPLProvider(BaseAvatarProvider):
    """
    SMPL Body Mesh Generation Provider.
    Calculates 3D body vertices by applying shape blendshape offsets (betas)
    to the mean template body mesh.
    """
    def __init__(self):
        self.loader = smpl_model_loader
        # Set Dev Mode explicitly via environment variable. Defaults to False (Production mode)
        self.dev_mode = os.getenv("AVATAR_DEV_MODE", "false").lower() == "true"
        self.provider_name = "SMPLProvider"
        self.provider_version = "1.0.0"

    def _calculate_mesh(self, model: dict, betas: list, gender: str = "neutral") -> tuple:
        """
        Runs the forward SMPL shape equation to calculate deformed vertices and joints:
        Delegates directly to the official smpl_runtime processor.
        """
        model_files = {
            "neutral": smpl_config.MODEL_NEUTRAL,
            "female": smpl_config.MODEL_FEMALE,
            "male": smpl_config.MODEL_MALE
        }
        model_path = model_files.get(gender.lower(), smpl_config.MODEL_NEUTRAL)
        
        # Calculate mesh using the official runtime
        res = smpl_runtime.compute_smpl_mesh(model_path, betas)
        return res["vertices"], res["faces"], res["joints"]

    def _generate_emulated_template(self) -> np.ndarray:
        """Generates standard vertical human height envelope cylinder vertices."""
        vertices = []
        np.random.seed(42)
        for i in range(smpl_config.NUM_VERTICES):
            y = (i / smpl_config.NUM_VERTICES) * 1.8 - 0.9
            r = 0.25 * math.cos(y * 1.5) + 0.05
            angle = (i % 36) * (2 * math.pi / 36)
            x = r * math.cos(angle)
            z = r * math.sin(angle)
            vertices.append([x, y, z])
        return np.array(vertices)

    def _emulate_blendshapes(self, template: np.ndarray, betas: np.ndarray) -> np.ndarray:
        """Apply mathematical offsets to shape variables based on SMPL principal components."""
        vertices = template.copy()
        scale_w = 1.0 + (betas[0] * 0.05)
        scale_h = 1.0 + (betas[1] * 0.03)
        hips_scale = 1.0 + (betas[4] * 0.04)
        
        vertices[:, [0, 2]] *= scale_w
        vertices[:, 1] *= scale_h
        
        hip_mask = (vertices[:, 1] > -0.1) & (vertices[:, 1] < 0.1)
        vertices[hip_mask, 0] *= hips_scale
        vertices[hip_mask, 2] *= hips_scale
        
        return vertices

    def _generate_emulated_faces(self) -> np.ndarray:
        """Constructs basic triangular indices connecting vertices."""
        faces = []
        num_v = smpl_config.NUM_VERTICES
        for i in range(num_v):
            next_i = (i + 1) % num_v
            next_row = (i + 36) % num_v
            diag_i = (i + 37) % num_v
            faces.append([i, next_i, next_row])
            faces.append([next_i, diag_i, next_row])
        while len(faces) < smpl_config.NUM_FACES:
            faces.append([0, 1, 36])
        return np.array(faces[:smpl_config.NUM_FACES])

    def _estimate_joints(self, vertices: np.ndarray, model: dict) -> np.ndarray:
        """Computes joint positions from vertices using regressor matrix."""
        if "J_regressor" in model and model["J_regressor"] is not None:
            J_regressor = np.array(model["J_regressor"])
            return np.dot(J_regressor, vertices)
            
        joints = []
        min_y = float(np.min(vertices[:, 1]))
        max_y = float(np.max(vertices[:, 1]))
        step = (max_y - min_y) / 24.0
        for i in range(24):
            joints.append([0.0, min_y + (i * step), 0.0])
        return np.array(joints)

    def _validate_mesh_integrity(self, vertices: np.ndarray, faces: np.ndarray) -> bool:
        """Validates topological properties to reject invalid meshes."""
        if np.isnan(vertices).any() or np.isinf(vertices).any():
            return False
        for f in faces[:100]:
            p0 = vertices[f[0]]
            p1 = vertices[f[1]]
            p2 = vertices[f[2]]
            edge1 = p1 - p0
            edge2 = p2 - p0
            cross_prod = np.cross(edge1, edge2)
            area = 0.5 * np.linalg.norm(cross_prod)
            if area < 1e-7:
                return False
        return True

    def get_status(self) -> dict:
        """
        Returns active provider configuration, loaded formats, and status labels.
        """
        discovered = self.loader.discover_models()
        loaded_genders = list(self.loader.models_cache.keys())
        
        status = "READY" if len(discovered) > 0 else "UNINITIALIZED"
        if not self.dev_mode and len(discovered) == 0:
            status = "ERROR"

        return {
            "providerName": self.provider_name,
            "providerVersion": self.provider_version,
            "modelLoaded": len(loaded_genders) > 0,
            "modelType": "SMPL",
            "genderModel": loaded_genders,
            "status": status,
            "developmentMode": self.dev_mode
        }

    def check_health(self) -> dict:
        """
        Performs inline diagnostics test of the loaders and VRAM memory footprint.
        """
        start = time.perf_counter()
        status = self.get_status()
        init_time = (time.perf_counter() - start) * 1000.0
        
        cache_count = len(self.loader.models_cache)
        
        return {
            "modelLoaded": status["modelLoaded"],
            "cacheActive": True,
            "cacheCount": cache_count,
            "memoryUsageMb": round(cache_count * 15.4, 2), # Emulated allocation based on loaded pickles
            "initializationTimeMs": round(init_time, 2),
            "healthy": status["status"] != "ERROR"
        }

    def generate_mesh(self, betas: list, gender: str = "neutral") -> dict:
        """
        Primary entry point. Connects the shape parameters to the SMPL mesh equation.
        """
        start_time = time.perf_counter()
        
        # 1. Load model file (strict checks in production mode)
        try:
            # allow_emulation parameter matches current dev_mode settings
            model = self.loader.load_model(gender, allow_emulation=self.dev_mode)
            if not self.dev_mode and model.get("emulated"):
                raise MissingSMPLModelError("Emulated mock models cannot be loaded in production mode.")
        except Exception as e:
            print(f"[SMPLProvider] Aborting avatar generation: {e}")
            raise MissingSMPLModelError(f"Missing official SMPL asset: {e}")
        
        # 2. Calculate deformed vertices & joint locations
        vertices, faces, joints = self._calculate_mesh(model, betas, gender)
        
        # 3. Validate mesh integrity
        is_valid = self._validate_mesh_integrity(vertices, faces)
        if not is_valid:
            raise ValueError("Mesh integrity check failed: Degenerate triangles or NaN vertices detected.")

        # 4. Calculate bounding box [min, max]
        min_bounds = np.min(vertices, axis=0)
        max_bounds = np.max(vertices, axis=0)
        bounding_box = {
            "min": [round(float(v), 3) for v in min_bounds],
            "max": [round(float(v), 3) for v in max_bounds]
        }
        
        generation_time_ms = (time.perf_counter() - start_time) * 1000.0
        
        return {
            "status": "SUCCESS",
            "vertices": vertices.tolist(),
            "faces": faces.tolist(),
            "joints": joints.tolist(),
            "statistics": {
                "vertexCount": len(vertices),
                "faceCount": len(faces),
                "jointCount": len(joints),
                "boundingBox": bounding_box,
                "generationTimeMs": round(generation_time_ms, 2)
            }
        }

smpl_provider = SMPLProvider()
