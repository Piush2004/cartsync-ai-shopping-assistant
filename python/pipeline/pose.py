import time
import os
import cv2
from typing import List, Dict, Any, Tuple
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.framework.formats import landmark_pb2

from pipeline.context import PipelineContext
from utils.model_registry import registry
from config.settings import settings
from utils.logger import logger

# MediaPipe landmark mapping (0-32)
LANDMARK_NAMES = [
    "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", 
    "right_eye", "right_eye_outer", "left_ear", "right_ear", "mouth_left", 
    "mouth_right", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", 
    "left_wrist", "right_wrist", "left_pinky", "right_pinky", "left_index", 
    "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip", 
    "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", 
    "right_heel", "left_foot_index", "right_foot_index"
]

class PoseStage:
    @staticmethod
    def execute(context: PipelineContext) -> None:
        start_time = time.time()
        
        try:
            landmarker = registry.get_pose_model()
            
            # Process Front
            f_lm, f_wlm, f_score, f_conf, f_errs = PoseStage._process_image(
                landmarker, context.front_local_path, context.job_id, "front"
            )
                
                # Process Side
                s_lm, s_wlm, s_score, s_conf, s_errs = PoseStage._process_image(
                    landmarker, context.side_local_path, context.job_id, "side"
                )
                
                context.front_landmarks = f_lm
                context.front_world_landmarks = f_wlm
                context.side_landmarks = s_lm
                context.side_world_landmarks = s_wlm
                
                context.pose_score = (f_score + s_score) / 2.0
                context.pose_confidence = (f_conf + s_conf) / 2.0
                context.pose_errors = list(set(f_errs + s_errs))

            duration = (time.time() - start_time) * 1000
            context.metrics["poseTime"] = duration
            
            if context.pose_errors:
                context.log("pose", duration, "success_with_errors", errors=context.pose_errors)
            else:
                context.log("pose", duration, "success", score=context.pose_score)
                
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            context.log("pose", duration, "failed", error=str(e))
            raise

    @staticmethod
    def _process_image(landmarker, img_path: str, job_id: str, side: str) -> Tuple[List, List, float, float, List[str]]:
        if not os.path.exists(img_path) or "mock_" in img_path:
            # For testing environments where image handler was mocked
            return [], [], 0.0, 0.0, ["MOCK_IMAGE_PASSED"]

        mp_image = mp.Image.create_from_file(img_path)
        detection_result = landmarker.detect(mp_image)
        
        errors = []
        if not detection_result.pose_landmarks:
            return [], [], 0.0, 0.0, ["NO_PERSON_DETECTED"]
            
        if len(detection_result.pose_landmarks) > 1:
            # We strictly forced num_poses=1, but if it breached, handle it
            errors.append("MULTIPLE_PEOPLE")
            
        # Extract first pose
        landmarks = detection_result.pose_landmarks[0]
        world_landmarks = detection_result.pose_world_landmarks[0]
        
        parsed_lm = []
        parsed_wlm = []
        
        total_vis = 0.0
        total_pres = 0.0
        
        for idx, (lm, wlm) in enumerate(zip(landmarks, world_landmarks)):
            name = LANDMARK_NAMES[idx]
            vis = lm.visibility if hasattr(lm, 'visibility') else 1.0
            pres = lm.presence if hasattr(lm, 'presence') else 1.0
            
            total_vis += vis
            total_pres += pres
            
            parsed_lm.append({
                "id": idx, "name": name, 
                "x": lm.x, "y": lm.y, "z": lm.z, 
                "visibility": vis, "presence": pres
            })
            
            parsed_wlm.append({
                "id": idx, "name": name, 
                "world_x": wlm.x, "world_y": wlm.y, "world_z": wlm.z, 
                "visibility": vis, "presence": pres
            })

        avg_vis = total_vis / len(landmarks)
        avg_pres = total_pres / len(landmarks)
        
        # Validation
        if avg_vis < 0.90:
            errors.append("LOW_CONFIDENCE")
            
        def check_vis(*indices):
            return all(parsed_lm[i]["visibility"] > 0.6 for i in indices)
            
        if not check_vis(0, 2, 5): errors.append("HEAD_NOT_VISIBLE")
        if not check_vis(11, 12): errors.append("SHOULDERS_OCCLUDED")
        if not check_vis(23, 24): errors.append("HIPS_NOT_VISIBLE")
        if not check_vis(25, 26): errors.append("KNEES_NOT_VISIBLE")
        if not check_vis(27, 28): errors.append("ANKLES_NOT_VISIBLE")

        # Bounds check (Cropping)
        for lm in parsed_lm:
            if lm["x"] < 0.02 or lm["x"] > 0.98 or lm["y"] < 0.02 or lm["y"] > 0.98:
                if lm["id"] in [0, 27, 28, 15, 16]: # If extreme points are cropped
                    if "BODY_CROPPED" not in errors:
                        errors.append("BODY_CROPPED")
        
        # Score 0-100
        score = (avg_vis * 100) - (len(errors) * 15)
        score = max(0.0, min(100.0, score))
        
        if settings.runtime.ENV == "development":
            PoseStage._save_debug_image(img_path, landmarks, job_id, side)
            
        return parsed_lm, parsed_wlm, score, avg_pres, list(set(errors))

    @staticmethod
    def _save_debug_image(img_path: str, landmarks, job_id: str, side: str):
        try:
            img = cv2.imread(img_path)
            if img is None: return
            
            mp_drawing = mp.solutions.drawing_utils
            mp_pose = mp.solutions.pose
            
            # Map back to old pb2 format for easy drawing
            pb_landmarks = landmark_pb2.NormalizedLandmarkList()
            for lm in landmarks:
                pb_landmarks.landmark.add(x=lm.x, y=lm.y, z=lm.z, visibility=lm.visibility if hasattr(lm, 'visibility') else 1.0)
                
            mp_drawing.draw_landmarks(
                img,
                pb_landmarks,
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_drawing.DrawingSpec(color=(0, 255, 255), thickness=2, circle_radius=2),
                connection_drawing_spec=mp_drawing.DrawingSpec(color=(255, 0, 255), thickness=2)
            )
            
            debug_dir = f"/tmp/cartsyncai_debug/{job_id}"
            os.makedirs(debug_dir, exist_ok=True)
            cv2.imwrite(f"{debug_dir}/{side}_pose.jpg", img)
        except Exception as e:
            logger.error("Failed to generate debug image", error=str(e))
