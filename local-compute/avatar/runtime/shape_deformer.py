import numpy as np
import math

class ShapeDeformer:
    def deform_shape(self, v_template: np.ndarray, shapedirs: np.ndarray, betas: np.ndarray) -> np.ndarray:
        """
        Runs the SMPL shape blendshapes formula:
        T_beta = v_template + shapedirs * betas
        """
        # betas shape: (10,), shapedirs shape: (6890, 3, 10)
        shape_offset = np.tensordot(shapedirs, betas, axes=([2], [0]))
        return v_template + shape_offset

    def emulate_deform_shape(self, template: np.ndarray, betas: np.ndarray) -> np.ndarray:
        """
        Fallback emulation offsets applied in development mode.
        """
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

shape_deformer = ShapeDeformer()
