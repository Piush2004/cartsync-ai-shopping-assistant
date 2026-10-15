import os
import requests
import numpy as np
from PIL import Image

class PoseDetectionService:
    def __init__(self):
        self._pose_detector = None
        self.model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "agents", "pose_landmarker.task")

    def _download_model_if_missing(self):
        if not os.path.exists(self.model_path):
            print(f"[PoseDetectionService] Model file not found. Downloading to {self.model_path}...")
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
            response = requests.get(url, stream=True)
            response.raise_for_status()
            with open(self.model_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print("[PoseDetectionService] Model downloaded successfully.")

    def _get_pose_detector(self):
        from services.model_manager import model_manager
        return model_manager.load_model("pose_landmarker")

    def detect_landmarks(self, image: Image.Image, expected_view: str = 'front') -> list:
        """
        Runs MediaPipe Pose Detection.
        Validates full body visibility and pose view correctness.
        Returns a list of landmark objects.
        """
        import mediapipe as mp
        
        rgb_image = image.convert('RGB')
        img_np = np.array(rgb_image)
        
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_np)
        
        detector = self._get_pose_detector()
        results = detector.detect(mp_image)
        
        if not results.pose_landmarks or len(results.pose_landmarks) == 0:
            raise ValueError(f"No human body detected in the {expected_view} image. Please ensure your entire body is visible.")
            
        landmarks = results.pose_landmarks[0]
        
        # Landmark indices
        critical_landmarks = {
            "nose": 0,
            "left_shoulder": 11,
            "right_shoulder": 12,
            "left_hip": 23,
            "right_hip": 24,
            "left_knee": 25,
            "right_knee": 26,
            "left_ankle": 27,
            "right_ankle": 28
        }
        
        # 1. Full Body Visibility check
        visibility_threshold = 0.5
        missing = []
        for name, idx in critical_landmarks.items():
            lm = landmarks[idx]
            in_bounds = 0.0 <= lm.x <= 1.0 and 0.0 <= lm.y <= 1.0
            visible = getattr(lm, 'visibility', 1.0) >= visibility_threshold
            
            if not (in_bounds and visible):
                missing.append(name.replace('_', ' '))
                
        if missing:
            raise ValueError(f"Full body is not visible in the {expected_view} view. Critical parts missing or obscured: {', '.join(missing)}.")
            
        # 2. View Correctness check
        nose = landmarks[critical_landmarks["nose"]]
        left_sh = landmarks[critical_landmarks["left_shoulder"]]
        right_sh = landmarks[critical_landmarks["right_shoulder"]]
        shoulder_dist = abs(left_sh.x - right_sh.x)
        
        left_ank = landmarks[critical_landmarks["left_ankle"]]
        right_ank = landmarks[critical_landmarks["right_ankle"]]
        body_height = abs((left_ank.y + right_ank.y)/2 - nose.y)
        
        shoulder_ratio = shoulder_dist / body_height if body_height > 0 else 0
        
        if expected_view == 'front':
            if shoulder_ratio < 0.15:
                raise ValueError(f"Incorrect posture: expected a front view, but body appears turned sideways (Shoulder-to-Height ratio: {round(shoulder_ratio, 2)}).")
        elif expected_view == 'side':
            if shoulder_ratio >= 0.16:
                raise ValueError(f"Incorrect posture: expected a side profile, but body appears facing the camera (Shoulder-to-Height ratio: {round(shoulder_ratio, 2)}).")
                
        return landmarks

pose_detection_service = PoseDetectionService()
