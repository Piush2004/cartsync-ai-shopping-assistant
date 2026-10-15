import os
import pickle
from .config import smpl_config

class SMPLModelLoader:
    def __init__(self):
        self.models_cache = {}
        # Expected keys in a standard SMPL pickle file
        self.required_keys = ["v_template", "weights", "f", "kintree_table"]

    def discover_models(self) -> dict:
        """
        Scans the configured model directory and returns a dictionary of discovered paths.
        """
        discovered = {}
        model_files = {
            "neutral": smpl_config.MODEL_NEUTRAL,
            "female": smpl_config.MODEL_FEMALE,
            "male": smpl_config.MODEL_MALE
        }
        
        for gender, path in model_files.items():
            if os.path.exists(path):
                discovered[gender] = path
        return discovered

    def validate_model_data(self, model_data: dict, file_path: str) -> bool:
        """
        Validates if loaded dictionary matches standard SMPL specifications.
        """
        if not isinstance(model_data, dict):
            raise TypeError(f"Invalid model structure in {file_path}. Expected dictionary, got {type(model_data).__name__}.")
            
        missing_keys = [key for key in self.required_keys if key not in model_data]
        if missing_keys:
            raise KeyError(f"Invalid SMPL model keys in {file_path}. Missing required fields: {missing_keys}")
            
        return True

    def load_model(self, gender: str = "neutral", allow_emulation: bool = True) -> dict:
        """
        Loads SMPL model file from disk. Caches loaded dict to avoid repeated loading.
        """
        gender = gender.lower()
        if gender not in ["neutral", "male", "female"]:
            raise ValueError(f"Unsupported gender model target: '{gender}'. Must be neutral, male, or female.")

        if gender in self.models_cache:
            return self.models_cache[gender]

        model_files = {
            "neutral": smpl_config.MODEL_NEUTRAL,
            "female": smpl_config.MODEL_FEMALE,
            "male": smpl_config.MODEL_MALE
        }
        model_path = model_files[gender]

        # Check if file exists
        if not os.path.exists(model_path):
            if allow_emulation:
                # Returns a valid structured mock model to prevent runtime test crashes
                print(f"[SMPLModelLoader] WARNING: model file missing at {model_path}. Running with emulated model layout.")
                mock_model = {
                    "v_template": None,
                    "weights": None,
                    "f": None,
                    "kintree_table": [[-1] * 24],
                    "emulated": True
                }
                self.models_cache[gender] = mock_model
                return mock_model
            else:
                raise FileNotFoundError(f"Descriptive Error: SMPL {gender} model file is missing at: {model_path}. "
                                        "Please download and place the pkl file as described in the README.")

        # Check readability
        if not os.access(model_path, os.R_OK):
            raise PermissionError(f"Descriptive Error: SMPL model file at {model_path} exists but is not readable.")

        try:
            with open(model_path, 'rb') as f:
                # Load with latin1 encoding to support python2 pickle compatibility
                model_data = pickle.load(f, encoding='latin1')
            
            # Validate dict content matches standard SMPL keys
            self.validate_model_data(model_data, model_path)
            
            self.models_cache[gender] = model_data
            print(f"[SMPLModelLoader] Successfully loaded and cached {gender} model from: {model_path}")
            return model_data
            
        except Exception as e:
            raise RuntimeError(f"Descriptive Error: Failed to parse SMPL model file at {model_path}: {e}")

    def verify_all_models(self) -> dict:
        """
        Executes a diagnostic run loading each configured model.
        Returns: {gender: "LOADED" | "MOCKED" | "FAILED"}
        """
        results = {}
        for gender in ["neutral", "female", "male"]:
            try:
                # First attempt without emulation to check actual files presence
                self.load_model(gender, allow_emulation=False)
                results[gender] = "LOADED"
            except FileNotFoundError:
                # Try loading with emulation fallback
                try:
                    self.load_model(gender, allow_emulation=True)
                    results[gender] = "MOCKED"
                except Exception:
                    results[gender] = "FAILED"
            except Exception:
                results[gender] = "FAILED"
        return results

smpl_model_loader = SMPLModelLoader()
