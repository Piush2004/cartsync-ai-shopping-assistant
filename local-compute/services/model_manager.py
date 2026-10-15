import os
import gc
import time
from config.settings import settings
from utils.vram_manager import vram_manager

class ModelManager:
    def __init__(self):
        self._cached_models = {}
        self.model_metadata = {
            "pose_landmarker": {"name": "MediaPipe Pose Landmarker", "version": "full_float16", "loaded": False},
            "ollama_qwen": {"name": "Qwen-2 4B", "version": "2.0.0", "loaded": False},
            "idm_vton": {"name": "IDM-VTON Diffusion", "version": "1.0.0", "loaded": False}
        }

    def load_model(self, model_key: str):
        """
        Loads and caches the requested model, ensuring proper VRAM locking.
        """
        print(f"[ModelManager] Loading model: {model_key}...")
        
        if model_key == "pose_landmarker":
            if "pose_landmarker" not in self._cached_models:
                # Load MediaPipe Pose Landmarker
                from mediapipe.tasks import python
                from mediapipe.tasks.python import vision
                
                model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "agents", "pose_landmarker.task")
                if not os.path.exists(model_path):
                    # Fallback download
                    from services.pose_detection import pose_detection_service
                    pose_detection_service._download_model_if_missing()
                
                base_options = python.BaseOptions(model_asset_path=model_path)
                options = vision.PoseLandmarkerOptions(
                    base_options=base_options,
                    output_segmentation_masks=False,
                    min_pose_detection_confidence=0.5
                )
                detector = vision.PoseLandmarker.create_from_options(options)
                self._cached_models["pose_landmarker"] = detector
                self.model_metadata["pose_landmarker"]["loaded"] = True
            return self._cached_models["pose_landmarker"]

        elif model_key == "ollama_qwen":
            # Acquire VRAM lock for Ollama
            with vram_manager.request_model("ollama"):
                self.model_metadata["ollama_qwen"]["loaded"] = True
                self.model_metadata["idm_vton"]["loaded"] = False # Unloaded by lock swap
                return "ollama_client"

        elif model_key == "idm_vton":
            # Acquire VRAM lock for IDM-VTON
            with vram_manager.request_model("idm-vton"):
                self.model_metadata["idm_vton"]["loaded"] = True
                self.model_metadata["ollama_qwen"]["loaded"] = False # Unloaded by lock swap
                return "idm_vton_client"

        else:
            raise ValueError(f"Unknown model key: {model_key}")

    def release_model(self, model_key: str):
        """
        Unloads model weights from memory and clears CUDA cache.
        """
        print(f"[ModelManager] Releasing model: {model_key}...")
        if model_key in self._cached_models:
            del self._cached_models[model_key]
        
        if model_key in self.model_metadata:
            self.model_metadata[model_key]["loaded"] = False

        # Clear PyTorch CUDA cache
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                gc.collect()
                print("[ModelManager] Cleared PyTorch CUDA cache successfully.")
        except ImportError:
            pass

    def get_status(self) -> dict:
        return {
            "loaded_models": [k for k, v in self.model_metadata.items() if v["loaded"]],
            "metadata": self.model_metadata,
            "vram_state": vram_manager.get_state()
        }

model_manager = ModelManager()
