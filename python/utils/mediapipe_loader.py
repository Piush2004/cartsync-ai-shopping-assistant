import os
import requests
from utils.logger import logger
from config.settings import settings

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "pose_landmarker_heavy.task")

def ensure_model_exists():
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    if not os.path.exists(MODEL_PATH):
        logger.info("Downloading MediaPipe Pose Model", url=MODEL_URL)
        response = requests.get(MODEL_URL, stream=True)
        response.raise_for_status()
        with open(MODEL_PATH, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        logger.info("Model downloaded successfully", path=MODEL_PATH)
    return MODEL_PATH
