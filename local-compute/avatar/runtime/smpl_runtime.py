import time
import numpy as np
import pickle
import os

from .runtime_validator import runtime_validator
from .shape_deformer import shape_deformer
from .joint_mapper import joint_mapper
from .mesh_builder import mesh_builder

class SMPLRuntime:
    @property
    def dev_mode(self) -> bool:
        return os.getenv("AVATAR_DEV_MODE", "false").lower() == "true"

    def compute_smpl_mesh(self, model_path: str, betas: list) -> dict:
        """
        Runs the SMPL shape evaluation pipeline.
        In dev_mode, supports running with mocked fallbacks.
        """
        start = time.perf_counter()
        
        # Ensure 10 coefficients
        betas_arr = np.array(betas[:10] + [0.0] * (10 - len(betas)), dtype=np.float32)

        # 1. Check File Existence and sizing if not in dev mode
        if not self.dev_mode:
            runtime_validator.validate_model_path(model_path)

        # 2. Load Pickle file
        if os.path.exists(model_path):
            try:
                with open(model_path, 'rb') as f:
                    model = pickle.load(f, encoding='latin1')
            except Exception as e:
                if not self.dev_mode:
                    raise RuntimeError(f"Failed to load pickle model at {model_path}: {e}")
                model = {"emulated": True}
        else:
            model = {"emulated": True}

        # 3. Process Vertices Shape deformation
        if "v_template" in model and model["v_template"] is not None and "shapedirs" in model:
            v_template = np.array(model["v_template"], dtype=np.float32)
            shapedirs = np.array(model["shapedirs"], dtype=np.float32)
            vertices = shape_deformer.deform_shape(v_template, shapedirs, betas_arr)
            
            faces = np.array(model["f"], dtype=np.int32)
            
            if "J_regressor" in model:
                J_reg = np.array(model["J_regressor"], dtype=np.float32)
                joints = joint_mapper.map_joints(vertices, J_reg)
            else:
                joints = joint_mapper.estimate_joints_fallback(vertices)
        else:
            # Emulated Fallback Mode
            if not self.dev_mode:
                raise ValueError("Official model keys missing in production mode.")
            v_temp = mesh_builder.generate_emulated_template()
            vertices = shape_deformer.emulate_deform_shape(v_temp, betas_arr)
            faces = mesh_builder.generate_emulated_faces()
            joints = joint_mapper.estimate_joints_fallback(vertices)

        # 4. Topology and metadata
        bbox = mesh_builder.calculate_bounding_box(vertices)
        duration = (time.perf_counter() - start) * 1000.0

        return {
            "vertices": vertices,
            "faces": faces,
            "joints": joints,
            "betas": betas_arr.tolist(),
            "boundingBox": bbox,
            "generationTimeMs": round(duration, 2)
        }

smpl_runtime = SMPLRuntime()
