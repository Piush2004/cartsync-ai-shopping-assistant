import time
from contextlib import contextmanager
from config.settings import settings

class VRAMManager:
    """
    Ensures memory-intensive models are loaded into VRAM sequentially.
    Provides standard PyTorch cache clearance hooks.
    """
    def __init__(self, max_vram_gb: int = settings.MAX_VRAM_GB):
        self.max_vram_gb = max_vram_gb
        self.current_model = None

    def _unload_model(self, model_name: str):
        print(f"[VRAMManager] Unloading model: {model_name}...")
        
        # Unload Ollama model from memory via API call if needed
        if model_name == 'ollama':
            import requests
            try:
                requests.post("http://localhost:11434/api/generate", json={
                    "model": "qwen2:8b",
                    "keep_alive": 0
                }, timeout=2)
                print("[VRAMManager] Requested Ollama to unload model.")
                time.sleep(1)
            except Exception:
                pass
                
        # PyTorch cache clearing
        try:
            import torch
            import gc
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                gc.collect()
                print("[VRAMManager] Cleared PyTorch CUDA cache.")
        except ImportError:
            pass

    @contextmanager
    def request_model(self, model_name: str):
        print(f"[VRAMManager] Requesting VRAM lock for: {model_name}")
        
        if self.current_model and self.current_model != model_name:
            self._unload_model(self.current_model)
            
        self.current_model = model_name
        print(f"[VRAMManager] VRAM locked/allocated for: {model_name}")
        
        try:
            yield
        finally:
            # We don't automatically unload to avoid thrashing on consecutive runs
            pass

    def get_state(self) -> dict:
        return {
            "current_model_in_vram": self.current_model,
            "max_vram_gb": self.max_vram_gb
        }

vram_manager = VRAMManager()
