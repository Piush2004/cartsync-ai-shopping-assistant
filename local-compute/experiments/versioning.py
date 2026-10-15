from .model_registry import model_registry

class VersioningEngine:
    def get_next_version(self, model_name: str) -> int:
        """
        Calculates the next available version number for a model.
        """
        max_v = 0
        for key, info in model_registry.index.items():
            if info["modelName"] == model_name:
                max_v = max(max_v, info["version"])
        return max_v + 1

versioning_engine = VersioningEngine()
