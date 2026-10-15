import os

class RuntimeValidator:
    def validate_model_path(self, filepath: str) -> bool:
        """
        Validates model file existence, readability, and sizing parameters.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file missing at: {filepath}")
            
        if not os.access(filepath, os.R_OK):
            raise PermissionError(f"Model file at {filepath} exists but lacks read permissions.")

        # Real SMPL pkl files are typically > 10MB
        size_bytes = os.path.getsize(filepath)
        if size_bytes < 100000: # < 100KB is too small for a real SMPL model
            raise ValueError(f"Model file at {filepath} is abnormally small ({size_bytes} bytes). Check if it is a placeholder.")

        return True

runtime_validator = RuntimeValidator()
