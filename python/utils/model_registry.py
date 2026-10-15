import os
from typing import Any, Dict, Optional
from utils.logger import logger
from utils.mediapipe_loader import ensure_model_exists
from utils.gpu import get_device
from config.settings import settings

class ModelRegistry:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
            cls._instance.models = {}
        return cls._instance

    def get_pose_model(self) -> Any:
        if "pose" not in self.models:
            logger.info("Initializing MediaPipe Pose Model in Registry")
            import mediapipe as mp
            from mediapipe.tasks import python
            from mediapipe.tasks.python import vision
            
            model_path = ensure_model_exists()
            base_options = python.BaseOptions(model_asset_path=model_path)
            options = vision.PoseLandmarkerOptions(
                base_options=base_options,
                running_mode=vision.RunningMode.IMAGE,
                num_poses=1,
                min_pose_detection_confidence=0.60,
                min_pose_presence_confidence=0.60,
                min_tracking_confidence=0.60,
                output_segmentation_masks=False
            )
            self.models["pose"] = vision.PoseLandmarker.create_from_options(options)
            
        return self.models["pose"]

    def get_depth_model(self) -> Any:
        if "depth" not in self.models:
            logger.info("Initializing Depth Anything V2 in Registry")
            from transformers import pipeline
            device = get_device()
            device_id = 0 if device == "cuda" else -1
            model_name = "nielsr/depth-anything-small" if settings.models.DEPTH_MODEL == "v2-base" else f"nielsr/depth-anything-{settings.models.DEPTH_MODEL}"
            
            self.models["depth"] = pipeline(task="depth-estimation", model=model_name, device=device_id)
            self.models["depth_meta"] = {
                "name": "Depth Anything V2",
                "variant": settings.models.DEPTH_MODEL,
                "version": model_name
            }
            
        return self.models["depth"]

    def get_depth_metadata(self) -> Dict[str, str]:
        if "depth_meta" not in self.models:
            self.get_depth_model()
        return self.models["depth_meta"]

    def shutdown(self):
        logger.info("Shutting down ModelRegistry")
        if "pose" in self.models:
            try:
                self.models["pose"].close()
            except Exception as e:
                logger.error("Failed to close pose model", error=str(e))
        self.models.clear()

registry = ModelRegistry()
