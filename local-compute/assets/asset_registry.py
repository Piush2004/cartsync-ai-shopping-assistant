import os
import json

class AssetRegistry:
    def __init__(self, registry_path: str = None):
        if registry_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            registry_path = os.path.join(base_dir, "models.json")
            
        self.registry_path = registry_path
        self.registry = {"models": {}}
        self.load_registry()

    def load_registry(self):
        """Loads metadata dictionary from models.json file."""
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r', encoding='utf-8') as f:
                    self.registry = json.load(f)
            except Exception as e:
                print(f"[AssetRegistry] Error loading registry: {e}")
                self.registry = {"models": {}}
        else:
            self.registry = {"models": {}}

    def save_registry(self):
        """Saves current state of registry dictionary back to models.json."""
        try:
            with open(self.registry_path, 'w', encoding='utf-8') as f:
                json.dump(self.registry, f, indent=2)
        except Exception as e:
            print(f"[AssetRegistry] Error saving registry: {e}")

    def get_model(self, key: str) -> dict:
        """Retrieves model metadata by registry key."""
        return self.registry.get("models", {}).get(key)

    def register_model(self, key: str, metadata: dict):
        """Registers or updates model metadata in the registry."""
        if "models" not in self.registry:
            self.registry["models"] = {}
        self.registry["models"][key] = metadata
        self.save_registry()

    def update_status(self, key: str, status: str):
        """Updates the status of a registered model."""
        model = self.get_model(key)
        if model:
            model["status"] = status
            self.save_registry()

    def list_models(self) -> dict:
        """Returns all registered models."""
        return self.registry.get("models", {})
