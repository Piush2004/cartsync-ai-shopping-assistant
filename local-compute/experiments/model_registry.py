import os
import shutil
import json

class ModelRegistry:
    def __init__(self, registry_dir: str = "./experiments/models"):
        self.registry_dir = registry_dir
        self.registry_index_path = os.path.join(self.registry_dir, "index.json")
        os.makedirs(self.registry_dir, exist_ok=True)
        self.index = {}
        self.load_index()

    def load_index(self):
        if os.path.exists(self.registry_index_path):
            try:
                with open(self.registry_index_path, 'r', encoding='utf-8') as f:
                    self.index = json.load(f)
            except Exception:
                self.index = {}

    def save_index(self):
        try:
            with open(self.registry_index_path, 'w', encoding='utf-8') as f:
                json.dump(self.index, f, indent=2)
        except Exception as e:
            print(f"[ModelRegistry] Failed to save index: {e}")

    def register_model_file(self, model_name: str, src_path: str, version: int) -> str:
        """
        Copies the model to the registry folder with a versioned filename and indices it.
        """
        dest_filename = f"{model_name}_v{version}.pkl"
        dest_path = os.path.join(self.registry_dir, dest_filename)
        
        try:
            shutil.copy(src_path, dest_path)
        except Exception as e:
            print(f"[ModelRegistry] Failed to copy model to registry: {e}")
            
        key = f"{model_name}_v{version}"
        self.index[key] = {
            "modelName": model_name,
            "version": version,
            "filename": dest_filename,
            "path": os.path.abspath(dest_path)
        }
        self.save_index()
        return dest_path

    def rollback_model(self, model_name: str, version: int, dest_dir: str = "./models/ml") -> str:
        """
        Restores a versioned model back to the active production folder.
        """
        key = f"{model_name}_v{version}"
        if key not in self.index:
            raise KeyError(f"Model version {key} not found in registry index.")
            
        src_path = self.index[key]["path"]
        os.makedirs(dest_dir, exist_ok=True)
        dest_path = os.path.join(dest_dir, f"{model_name}_corrector.pkl")
        
        shutil.copy(src_path, dest_path)
        return dest_path

model_registry = ModelRegistry()
