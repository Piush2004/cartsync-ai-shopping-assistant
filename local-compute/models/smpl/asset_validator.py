import os
import pickle
import numpy as np

class AssetValidator:
    def __init__(self):
        self.expected_keys = ["v_template", "weights", "f", "kintree_table", "shapedirs", "J_regressor"]

    def validate_file(self, filepath: str) -> dict:
        """
        Validates the structure of a loaded SMPL model file.
        """
        if not os.path.exists(filepath):
            return {"valid": False, "reason": f"File does not exist: {filepath}"}

        if not os.access(filepath, os.R_OK):
            return {"valid": False, "reason": f"File is not readable: {filepath}"}

        try:
            with open(filepath, 'rb') as f:
                model = pickle.load(f, encoding='latin1')
        except Exception as e:
            return {"valid": False, "reason": f"Pickle load error: {e}"}

        # Check required keys
        missing_keys = [k for k in self.expected_keys if k not in model]
        if missing_keys:
            return {"valid": False, "reason": f"Missing expected keys: {missing_keys}"}

        # Check shapes and limits
        v_temp = np.array(model["v_template"])
        faces = np.array(model["f"])
        j_reg = np.array(model["J_regressor"])
        shape_dirs = np.array(model["shapedirs"])

        errors = []
        if v_temp.shape[0] != 6890 or v_temp.shape[1] != 3:
            errors.append(f"Invalid v_template shape: {v_temp.shape} (expected: 6890x3)")

        if faces.shape[0] != 13776:
            errors.append(f"Invalid face count: {faces.shape[0]} (expected: 13776)")

        if j_reg.shape[0] != 24:
            errors.append(f"Invalid J_regressor joint count: {j_reg.shape[0]} (expected: 24 joints)")

        if shape_dirs.shape[:2] != (6890, 3):
            errors.append(f"Invalid shapedirs shape: {shape_dirs.shape} (expected: 6890x3xN)")

        if errors:
            return {"valid": False, "reason": "; ".join(errors)}

        return {
            "valid": True,
            "vertexCount": v_temp.shape[0],
            "faceCount": faces.shape[0],
            "jointCount": j_reg.shape[0],
            "shapeComponentsCount": shape_dirs.shape[2] if len(shape_dirs.shape) > 2 else 0
        }

asset_validator = AssetValidator()
