import time
from typing import Dict, Any, List
import numpy as np

from pipeline.context import PipelineContext
from utils.logger import logger

class AnatomicalConstraintGraph:
    # Basic proportional ranges for a human skeleton.
    # Format: (joint1, joint2): (min_ratio_relative_to_height, max_ratio_relative_to_height)
    # Using relative height simplifies global checks.
    CONSTRAINTS = {
        # Arm
        (11, 13): (0.15, 0.22), # Upper Arm (Shoulder to Elbow)
        (13, 15): (0.12, 0.18), # Forearm (Elbow to Wrist)
        # Leg
        (23, 25): (0.22, 0.30), # Femur (Hip to Knee)
        (25, 27): (0.20, 0.28), # Tibia (Knee to Ankle)
        # Torso
        (11, 12): (0.18, 0.30), # Shoulder Width
        (23, 24): (0.15, 0.25), # Hip Width
    }

    @staticmethod
    def validate_limb(lm1: Dict[str, Any], lm2: Dict[str, Any], height: float, warnings: List[str]) -> bool:
        if lm1["quality"] < 0.2 or lm2["quality"] < 0.2:
            return False # Cannot validate reliably
            
        pair = (lm1["id"], lm2["id"]) if lm1["id"] < lm2["id"] else (lm2["id"], lm1["id"])
        if pair not in AnatomicalConstraintGraph.CONSTRAINTS:
            return True
            
        length = np.sqrt(
            (lm1["metric_x"] - lm2["metric_x"])**2 + 
            (lm1["metric_y"] - lm2["metric_y"])**2 +
            (lm1["metric_z"] - lm2["metric_z"])**2
        )
        
        ratio = length / height if height > 0 else 0
        min_r, max_r = AnatomicalConstraintGraph.CONSTRAINTS[pair]
        
        if ratio < min_r or ratio > max_r:
            warnings.append(f"IMPOSSIBLE_GEOMETRY_{lm1['name']}_TO_{lm2['name']}_RATIO_{ratio:.3f}")
            return False
            
        return True

class SkeletonRefinementStage:
    @staticmethod
    def execute(context: PipelineContext) -> None:
        start_time = time.time()
        
        try:
            if not context.metric_landmarks:
                logger.warning("Skipping skeleton refinement, missing metric landmarks", job_id=context.job_id)
                return

            height = context.pixel_height * context.scale_factor if context.scale_factor else 170.0
            
            front_lm = context.metric_landmarks.get("front", [])
            side_lm = context.metric_landmarks.get("side", [])
            
            refined_front = SkeletonRefinementStage._refine_landmarks(front_lm, height, context.refinement_warnings)
            refined_side = SkeletonRefinementStage._refine_landmarks(side_lm, height, context.refinement_warnings)
            
            context.refined_skeleton = {
                "front": refined_front,
                "side": refined_side
            }

            duration = (time.time() - start_time) * 1000
            context.metrics["refinementTime"] = duration
            context.log("refinement", duration, "success")

        except Exception as e:
            duration = (time.time() - start_time) * 1000
            context.log("refinement", duration, "failed", error=str(e))
            raise

    @staticmethod
    def _refine_landmarks(landmarks: List[Dict[str, Any]], height: float, warnings: List[str]) -> List[Dict[str, Any]]:
        if not landmarks:
            return []
            
        # Add provenance baseline
        refined = []
        for lm in landmarks:
            new_lm = dict(lm)
            new_lm["source"] = "original"
            new_lm["refined"] = False
            refined.append(new_lm)
            
        # 1. Evaluate Anatomical Constraints
        SkeletonRefinementStage._check_anatomy(refined, height, warnings)
        
        # 2. Interpolate hidden/noisy landmarks based on confidence (Example: Shoulders)
        SkeletonRefinementStage._interpolate_low_quality(refined, warnings)
        
        return refined

    @staticmethod
    def _check_anatomy(landmarks: List[Dict[str, Any]], height: float, warnings: List[str]):
        # Just run the constraint graph and log warnings. 
        # Future enhancement: actively move limbs that violate constraints.
        for pair in AnatomicalConstraintGraph.CONSTRAINTS.keys():
            try:
                AnatomicalConstraintGraph.validate_limb(landmarks[pair[0]], landmarks[pair[1]], height, warnings)
            except IndexError:
                pass

    @staticmethod
    def _interpolate_low_quality(landmarks: List[Dict[str, Any]], warnings: List[str]):
        """
        If a joint is terribly tracked, but we know it should align anatomically,
        we can synthesize its position. Example: A blocked left shoulder could borrow 
        Y/Z from the right shoulder and mirror the X distance from the neck.
        """
        for i, lm in enumerate(landmarks):
            if lm["quality"] < 0.2:
                # E.g. Left Shoulder (11) is obscured, but Right Shoulder (12) is visible
                if lm["id"] == 11 and landmarks[12]["quality"] > 0.6:
                    # Very simple mirroring heuristic
                    lm["metric_y"] = landmarks[12]["metric_y"]
                    lm["metric_z"] = landmarks[12]["metric_z"]
                    # X would normally mirror across neck. Assuming neck is halfway between shoulders
                    lm["source"] = "interpolated"
                    lm["refined"] = True
                    lm["quality"] = 0.5 # Boost slightly as it's now a logical guess
                    warnings.append(f"INTERPOLATED_{lm['name']}")
                    
                elif lm["id"] == 12 and landmarks[11]["quality"] > 0.6:
                    lm["metric_y"] = landmarks[11]["metric_y"]
                    lm["metric_z"] = landmarks[11]["metric_z"]
                    lm["source"] = "interpolated"
                    lm["refined"] = True
                    lm["quality"] = 0.5
                    warnings.append(f"INTERPOLATED_{lm['name']}")
                else:
                    warnings.append(f"LOW_QUALITY_JOINT_{lm['name']}")
