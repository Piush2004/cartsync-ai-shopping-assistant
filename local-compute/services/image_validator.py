import os
import math
import numpy as np
from PIL import Image
import requests
from io import BytesIO

class ImageValidatorService:
    def __init__(self):
        self._pose_detector = None
        self.model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "agents", "pose_landmarker.task")

    def _download_model_if_missing(self):
        if not os.path.exists(self.model_path):
            print(f"[ImageValidatorService] Model file not found. Downloading to {self.model_path}...")
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
            response = requests.get(url, stream=True)
            response.raise_for_status()
            with open(self.model_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print("[ImageValidatorService] Model downloaded successfully.")

    def _get_pose_detector(self):
        from services.model_manager import model_manager
        return model_manager.load_model("pose_landmarker")

    def download_image(self, url: str) -> Image.Image:
        """Downloads an image from a URL or opens it if it is a local path."""
        if url.startswith(('http://', 'https://')):
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            return Image.open(BytesIO(response.content))
        else:
            return Image.open(url)

    def validate_image(self, img_url: str, expected_view: str = 'front') -> dict:
        """
        Performs 10 validations:
        1. Minimum image resolution
        2. Blur detection using Laplacian variance
        3. Brightness analysis
        4. Contrast analysis
        5. Full body visibility
        6. Face detection
        7. Front pose validation
        8. Side pose validation
        9. Background complexity score
        10. Occlusion detection
        """
        issues = []
        warnings = []
        confidence = 1.0

        try:
            image = self.download_image(img_url)
        except Exception as e:
            return {
                "valid": False,
                "confidence": 0.0,
                "issues": [f"Failed to load image: {e}"],
                "warnings": []
            }

        # 1. Minimum image resolution
        width, height = image.size
        if width < 640 or height < 480:
            issues.append(f"Resolution too low: {width}x{height} (minimum required: 640x480)")
            confidence -= 0.3

        # Convert to grayscale numpy array for image-based checks
        gray_image = image.convert('L')
        img_np = np.array(gray_image)

        # 2. Blur detection using Laplacian variance
        gx, gy = np.gradient(img_np.astype(float))
        gxx, _ = np.gradient(gx)
        _, gyy = np.gradient(gy)
        laplacian = gxx + gyy
        blur_score = float(np.var(laplacian))
        if blur_score < 8.0:
            issues.append(f"Image is blurry (sharpness score: {round(blur_score, 2)})")
            confidence -= 0.25
        elif blur_score < 15.0:
            warnings.append(f"Image has moderate sharpness (sharpness score: {round(blur_score, 2)})")
            confidence -= 0.08

        # 3. Brightness analysis
        mean_brightness = float(np.mean(img_np))
        if mean_brightness < 45.0:
            issues.append(f"Poor lighting: image is too dark (brightness: {round(mean_brightness, 1)})")
            confidence -= 0.2
        elif mean_brightness > 240.0:
            issues.append(f"Poor lighting: image is overexposed (brightness: {round(mean_brightness, 1)})")
            confidence -= 0.2
        elif mean_brightness < 70.0 or mean_brightness > 210.0:
            warnings.append(f"Suboptimal lighting: brightness is {round(mean_brightness, 1)}")
            confidence -= 0.05

        # 4. Contrast analysis
        contrast_score = float(np.std(img_np))
        if contrast_score < 25.0:
            issues.append(f"Poor image contrast: image is too flat (contrast: {round(contrast_score, 1)})")
            confidence -= 0.15
        elif contrast_score < 40.0:
            warnings.append(f"Low contrast: image details might be hard to extract (contrast: {round(contrast_score, 1)})")
            confidence -= 0.05

        # 9. Background complexity score (gradient magnitude average)
        gradient_magnitude = np.sqrt(gx**2 + gy**2)
        bg_complexity = float(np.mean(gradient_magnitude))
        if bg_complexity > 38.0:
            warnings.append(f"Complex background detected (complexity score: {round(bg_complexity, 1)}). Prefer a plain backdrop.")
            confidence -= 0.1

        # Run MediaPipe Pose detector for body tracking checks
        import mediapipe as mp
        rgb_image = image.convert('RGB')
        rgb_np = np.array(rgb_image)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_np)

        try:
            detector = self._get_pose_detector()
            results = detector.detect(mp_image)
        except Exception as e:
            return {
                "valid": False,
                "confidence": 0.0,
                "issues": [f"Pose detection error: {e}"],
                "warnings": []
            }

        if not results.pose_landmarks or len(results.pose_landmarks) == 0:
            issues.append("No human body detected in the image.")
            return {
                "valid": False,
                "confidence": 0.0,
                "issues": issues,
                "warnings": warnings
            }

        landmarks = results.pose_landmarks[0]

        # Critical landmark mappings
        critical_parts = {
            "left_shoulder": 11, "right_shoulder": 12,
            "left_hip": 23, "right_hip": 24,
            "left_knee": 25, "right_knee": 26,
            "left_ankle": 27, "right_ankle": 28
        }
        
        # 5. Full body visibility check & 10. Occlusion detection
        occluded_parts = []
        out_of_bounds = []
        for part_name, idx in critical_parts.items():
            lm = landmarks[idx]
            # Check boundaries
            if not (0.0 <= lm.x <= 1.0 and 0.0 <= lm.y <= 1.0):
                out_of_bounds.append(part_name)
            # Check visibility/occlusion
            vis = getattr(lm, 'visibility', 1.0)
            if vis < 0.5:
                occluded_parts.append(part_name)

        if out_of_bounds:
            issues.append(f"Body cut off: parts out of frame: {', '.join(out_of_bounds)}")
            confidence -= 0.25
        if occluded_parts:
            issues.append(f"Occlusion detected: parts obscured: {', '.join(occluded_parts)}")
            confidence -= 0.2

        if not out_of_bounds and not occluded_parts:
            # Verified full body visibility
            pass
        else:
            issues.append("Full body is not fully visible.")

        # 6. Face detection (nose and eyes checks)
        face_landmarks = [0, 1, 2, 3, 4, 5, 6] # Nose, eyes landmarks
        face_visible = True
        for idx in face_landmarks:
            lm = landmarks[idx]
            vis = getattr(lm, 'visibility', 1.0)
            if vis < 0.5 or not (0.0 <= lm.x <= 1.0 and 0.0 <= lm.y <= 1.0):
                face_visible = False
                break
        if not face_visible:
            issues.append("Face detection failed or face is occluded.")
            confidence -= 0.15

        # 7 & 8. Pose View correctness (Front / Side validation)
        nose = landmarks[0]
        left_sh = landmarks[11]
        right_sh = landmarks[12]
        shoulder_dist = abs(left_sh.x - right_sh.x)
        
        left_ank = landmarks[27]
        right_ank = landmarks[28]
        body_height = abs((left_ank.y + right_ank.y)/2 - nose.y)
        
        shoulder_ratio = shoulder_dist / body_height if body_height > 0 else 0

        if expected_view == 'front':
            if shoulder_ratio < 0.15:
                issues.append(f"Pose check failed: Expected front view, but body appears turned sideways (Shoulder Ratio: {round(shoulder_ratio, 2)})")
                confidence -= 0.2
        elif expected_view == 'side':
            if shoulder_ratio >= 0.16:
                issues.append(f"Pose check failed: Expected side view, but body appears facing forward (Shoulder Ratio: {round(shoulder_ratio, 2)})")
                confidence -= 0.2

        # --- ADVANCED VALIDATION CHECKS (Step 3 & 4) ---
        try:
            left_hip = landmarks[23]
            right_hip = landmarks[24]
            shoulder_angle = math.atan2(right_sh.y - left_sh.y, right_sh.x - left_sh.x)
            hip_angle = math.atan2(right_hip.y - left_hip.y, right_hip.x - left_hip.x)
            torso_rotation = abs(shoulder_angle - hip_angle)
            
            if abs(shoulder_angle) > 0.15 or abs(hip_angle) > 0.15 or torso_rotation > 0.12:
                issues.append(f"Excessive body rotation or tilt detected (Shoulder tilt: {round(math.degrees(shoulder_angle), 1)}°, Torso twist: {round(math.degrees(torso_rotation), 1)}°). Stand straight.")
                confidence -= 0.3
        except Exception as angle_err:
            print(f"[ImageValidator] Pose angle calculation error: {angle_err}")

        if body_height < 0.45:
            issues.append(f"User is too far from the camera. Body occupies only {round(body_height * 100)}% of image height (minimum 45% required).")
            confidence -= 0.25

        cropped_borders = []
        if left_sh.y < 0.02 or right_sh.y < 0.02 or nose.y < 0.02:
            cropped_borders.append("head/shoulders")
        if left_ank.y > 0.98 or right_ank.y > 0.98:
            cropped_borders.append("feet")
            
        if cropped_borders:
            issues.append(f"Anatomical crop warning: {', '.join(cropped_borders)} cut off near image borders.")
            confidence -= 0.3

        valid = len(issues) == 0
        confidence = max(0.0, min(1.0, confidence))

        return {
            "valid": valid,
            "confidence": round(confidence, 2),
            "issues": issues,
            "warnings": warnings
        }

image_validator = ImageValidatorService()
