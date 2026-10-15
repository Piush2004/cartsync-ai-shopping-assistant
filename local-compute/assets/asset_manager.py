import os
from .asset_registry import AssetRegistry
from .checksum import verify_checksum
from .download_manager import DownloadManager

class AssetManager:
    def __init__(self, base_dir: str = None):
        if base_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.base_dir = base_dir
        self.registry = AssetRegistry()
        self.downloader = DownloadManager(base_dir)

    def register_model(self, key: str, metadata: dict):
        """Registers a new model in the registry database."""
        self.registry.register_model(key, metadata)

    def locate_model(self, key: str) -> str:
        """Returns the absolute file path of a model if installed."""
        model = self.registry.get_model(key)
        if not model:
            raise KeyError(f"Model key '{key}' is not registered.")
        
        local_path = os.path.join(self.base_dir, model["localPath"])
        if os.path.exists(local_path):
            return local_path
        return ""

    def get_model_path(self, key: str) -> str:
        """Retrieves path for registered model. Throws FileNotFoundError if missing."""
        path = self.locate_model(key)
        if not path:
            raise FileNotFoundError(f"Model '{key}' is not installed at the registered location.")
        return path

    def validate_checksum(self, key: str) -> bool:
        """Validates hash signature checksum for installed model file."""
        model = self.registry.get_model(key)
        if not model:
            return False
            
        path = self.locate_model(key)
        if not path:
            return False
            
        expected_hash = model.get("checksum")
        if expected_hash and expected_hash.startswith("sha256-placeholder"):
            return True
        return verify_checksum(path, expected_hash)

    def verify_model(self, key: str) -> str:
        """
        Runs complete check (locate and checksum) on model.
        Updates model status state in registry.
        """
        model = self.registry.get_model(key)
        if not model:
            return "NOT_INSTALLED"
            
        path = self.locate_model(key)
        if not path:
            self.registry.update_status(key, "NOT_INSTALLED")
            return "NOT_INSTALLED"
            
        checksum_ok = self.validate_checksum(key)
        if checksum_ok:
            self.registry.update_status(key, "VALIDATED")
            return "VALIDATED"
        else:
            self.registry.update_status(key, "FAILED")
            return "FAILED"

    def list_installed_models(self) -> dict:
        """Lists all registered models that are successfully installed and validated."""
        installed = {}
        for key, meta in self.registry.list_models().items():
            status = self.verify_model(key)
            if status == "VALIDATED":
                installed[key] = meta
        return installed

    def trigger_download(self, key: str) -> bool:
        """Starts model download and validates it."""
        model = self.registry.get_model(key)
        if not model:
            raise KeyError(f"Model '{key}' is not registered.")
            
        self.registry.update_status(key, "DOWNLOADING")
        try:
            self.downloader.download_asset(
                key,
                model["downloadUrl"],
                model["localPath"],
                model["checksum"]
            )
            self.registry.update_status(key, "INSTALLED")
            self.verify_model(key)
            return True
        except Exception as e:
            print(f"[AssetManager] Download failed for '{key}': {e}")
            self.registry.update_status(key, "FAILED")
            return False

asset_manager = AssetManager()
