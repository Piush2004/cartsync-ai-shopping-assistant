import os
import numpy as np
from PIL import Image
import requests
from io import BytesIO
import traceback

class ValidationAgent:
    def __init__(self):
        self._pose_detector = None
        self.model_path = os.path.join(os.path.dirname(__file__), "pose_landmarker.task")

    def _download_model_if_missing(self):
        if not os.path.exists(self.model_path):
            print(f"Model file not found at {self.model_path}. Downloading from Google CDN...")
            url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
            response = requests.get(url, stream=True)
            response.raise_for_status()
            with open(self.model_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print("Model downloaded successfully!")

    def _get_pose_detector(self):
        from services.model_manager import model_manager
        return model_manager.load_model("pose_landmarker")

    def download_image(self, url: str) -> Image.Image:
        """Downloads an image from a URL or opens it if it is a local path."""
        if url.startswith(('http://', 'https://')):
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return Image.open(BytesIO(response.content))
        else:
            return Image.open(url)

    def check_quality(self, image: Image.Image) -> dict:
        """Checks resolution, brightness (lighting), and sharpness (blur)."""
        width, height = image.size
        resolution_ok = width >= 640 and height >= 480
        
        # Convert to grayscale numpy array for lighting and blur checks
        gray_image = image.convert('L')
        img_np = np.array(gray_image)
        
        # 1. Lighting (Brightness) Check
        mean_brightness = float(np.mean(img_np))
        # Poor lighting if too dark (< 45) or too bright (> 240)
        lighting_ok = 45.0 <= mean_brightness <= 240.0
        lighting_details = "optimal"
        if mean_brightness < 45.0:
            lighting_details = "too dark"
        elif mean_brightness > 240.0:
            lighting_details = "too bright"
            
        # 2. Sharpness (Blur) Check
        # Compute gradient variance as a proxy for blur (sharpness)
        gx, gy = np.gradient(img_np.astype(float))
        gradient_magnitude = np.sqrt(gx**2 + gy**2)
        sharpness_score = float(np.var(gradient_magnitude))
        
        # Threshold for blur. A very blurry image has a very small variance.
        blur_ok = sharpness_score >= 10.0
        
        return {
            "resolution": {
                "width": width,
                "height": height,
                "passed": resolution_ok,
                "message": f"Resolution: {width}x{height} (Min 640x480)"
            },
            "lighting": {
                "brightness": round(mean_brightness, 2),
                "passed": lighting_ok,
                "message": f"Lighting is {lighting_details} (Score: {round(mean_brightness, 1)})"
            },
            "sharpness": {
                "score": round(sharpness_score, 2),
                "passed": blur_ok,
                "message": "Image is sharp enough" if blur_ok else "Image is blurry"
            },
            "passed": resolution_ok and lighting_ok and blur_ok
        }

    def validate_pose(self, image: Image.Image, expected_view: str = 'front') -> dict:
        """
        Detects body landmarks using MediaPipe.
        Verifies:
        - Full body is visible (critical landmarks have high visibility).
        - Body alignment (head over shoulders, vertical torso).
        - Pose correctness (front vs side view checks).
        """
        import mediapipe as mp
        
        # Convert image to RGB numpy array for MediaPipe
        rgb_image = image.convert('RGB')
        img_np = np.array(rgb_image)
        
        # Create MediaPipe Image object
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_np)
        
        pose = self._get_pose_detector()
        results = pose.detect(mp_image)
        
        if not results.pose_landmarks or len(results.pose_landmarks) == 0:
            return {
                "passed": False,
                "error": "No human body detected in the image.",
                "details": {}
            }
            
        landmarks = results.pose_landmarks[0]
        
        # MediaPipe Pose landmark indices:
        # Nose: 0, Left Shoulder: 11, Right Shoulder: 12
        # Left Hip: 23, Right Hip: 24, Left Knee: 25, Right Knee: 26
        # Left Ankle: 27, Right Ankle: 28
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
        
        # 1. Check Full Body Visibility
        # Check if all critical landmarks are detected with acceptable visibility
        visibility_threshold = 0.5
        missing_landmarks = []
        landmarks_data = {}
        
        for name, idx in critical_landmarks.items():
            lm = landmarks[idx]
            landmarks_data[name] = {"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility}
            
            # Check if landmark is inside image boundaries [0, 1] and visibility is high
            in_bounds = 0.0 <= lm.x <= 1.0 and 0.0 <= lm.y <= 1.0
            # For the new API, visibility might be optional but present
            vis = getattr(lm, 'visibility', 1.0)
            visible = vis >= visibility_threshold
            
            if not (in_bounds and visible):
                missing_landmarks.append(name)
                
        full_body_visible = len(missing_landmarks) == 0
        body_visibility_msg = "Full body is visible" if full_body_visible else f"Missing critical landmarks: {', '.join(missing_landmarks)}"

        # 2. Check Body Alignment (centered and vertical)
        # Center of hips relative to center of image (x = 0.5)
        left_hip = landmarks[critical_landmarks["left_hip"]]
        right_hip = landmarks[critical_landmarks["right_hip"]]
        hip_center_x = (left_hip.x + right_hip.x) / 2
        
        centered_ok = 0.3 <= hip_center_x <= 0.7
        centering_msg = f"Body is centered (x={round(hip_center_x, 2)})" if centered_ok else "Body is off-center (align horizontally)"
        
        # Vertical alignment: Check if nose is vertically above hip center
        nose = landmarks[critical_landmarks["nose"]]
        vertical_offset = abs(nose.x - hip_center_x)
        aligned_ok = vertical_offset <= 0.15
        alignment_msg = "Body is vertically aligned" if aligned_ok else "Body is tilted (stand straight)"

        # 3. Check View Correctness (Front vs Side)
        view_ok = True
        view_msg = ""
        
        left_sh = landmarks[critical_landmarks["left_shoulder"]]
        right_sh = landmarks[critical_landmarks["right_shoulder"]]
        shoulder_dist = abs(left_sh.x - right_sh.x)
        
        if expected_view == 'front':
            # For front view: we expect a significant horizontal distance between shoulders
            left_ank = landmarks[critical_landmarks["left_ankle"]]
            right_ank = landmarks[critical_landmarks["right_ankle"]]
            body_height = abs((left_ank.y + right_ank.y)/2 - nose.y)
            
            shoulder_ratio = shoulder_dist / body_height if body_height > 0 else 0
            if shoulder_ratio < 0.15:
                view_ok = False
                view_msg = f"Expected front view, but body appears turned sideways (Shoulder ratio: {round(shoulder_ratio, 2)})"
            else:
                view_msg = f"Front view validated (Shoulder ratio: {round(shoulder_ratio, 2)})"
                
        elif expected_view == 'side':
            # For side view: left and right shoulders/hips should overlap, meaning shoulder distance is small
            left_ank = landmarks[critical_landmarks["left_ankle"]]
            right_ank = landmarks[critical_landmarks["right_ankle"]]
            body_height = abs((left_ank.y + right_ank.y)/2 - nose.y)
            
            shoulder_ratio = shoulder_dist / body_height if body_height > 0 else 0
            if shoulder_ratio >= 0.16:
                view_ok = False
                view_msg = f"Expected side view, but body appears facing front (Shoulder ratio: {round(shoulder_ratio, 2)})"
            else:
                view_msg = f"Side view validated (Shoulder ratio: {round(shoulder_ratio, 2)})"

        passed = full_body_visible and centered_ok and aligned_ok and view_ok
        
        return {
            "passed": passed,
            "checks": {
                "full_body_visible": {
                    "passed": full_body_visible,
                    "message": body_visibility_msg
                },
                "centered": {
                    "passed": centered_ok,
                    "message": centering_msg
                },
                "aligned": {
                    "passed": aligned_ok,
                    "message": alignment_msg
                },
                "view_correctness": {
                    "passed": view_ok,
                    "message": view_msg
                }
            },
            "landmarks": landmarks_data
        }

    def validate_inputs(self, payload: dict) -> dict:
        """
        Orchestrates validation on front and side images, or a single person image.
        Delegating to Phase 12 ImageValidatorService.
        """
        from services.image_validator import image_validator
        
        front_url = payload.get("frontImageUrl") or payload.get("personImageUrl")
        side_url = payload.get("sideImageUrl")
        
        issues = []
        warnings = []
        confidences = []
        
        if front_url:
            res = image_validator.validate_image(front_url, expected_view='front')
            issues.extend(res.get("issues", []))
            warnings.extend(res.get("warnings", []))
            confidences.append(res.get("confidence", 0.0))
        else:
            issues.append("Missing frontImageUrl or personImageUrl.")
            
        if side_url:
            res = image_validator.validate_image(side_url, expected_view='side')
            issues.extend(res.get("issues", []))
            warnings.extend(res.get("warnings", []))
            confidences.append(res.get("confidence", 0.0))
            
        valid = len(issues) == 0
        overall_confidence = float(np.mean(confidences)) if confidences else 0.0
        
        return {
            "valid": valid,
            "confidence": round(overall_confidence, 2),
            "issues": issues,
            "warnings": warnings
        }

# Singleton instance
validation_agent = ValidationAgent()
