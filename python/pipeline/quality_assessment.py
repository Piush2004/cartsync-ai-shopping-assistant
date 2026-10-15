import time
from typing import Dict, Any, List

from pipeline.context import PipelineContext
from utils.logger import logger

class QualityAssessmentStage:
    @staticmethod
    def execute(context: PipelineContext) -> None:
        start_time = time.time()
        
        try:
            if not context.refined_skeleton:
                logger.warning("Skipping Quality Assessment, no refined skeleton found", job_id=context.job_id)
                return

            front_lm = context.refined_skeleton.get("front", [])
            side_lm = context.refined_skeleton.get("side", [])
            
            # Aggregate scores based on regional geometry
            upper_body_ids = [11, 12, 13, 14, 23, 24] # Shoulders, Elbows, Hips
            lower_body_ids = [23, 24, 25, 26, 27, 28] # Hips, Knees, Ankles
            left_arm_ids = [11, 13, 15]
            right_arm_ids = [12, 14, 16]
            
            upper_q = QualityAssessmentStage._compute_region_quality(front_lm, upper_body_ids)
            lower_q = QualityAssessmentStage._compute_region_quality(front_lm, lower_body_ids)
            l_arm_q = QualityAssessmentStage._compute_region_quality(front_lm, left_arm_ids)
            r_arm_q = QualityAssessmentStage._compute_region_quality(front_lm, right_arm_ids)
            
            overall = (upper_q + lower_q) / 2.0
            
            # Trust levels for specific measurements
            trust = {
                "shoulderWidth": upper_q > 0.8,
                "inseam": lower_q > 0.8 and QualityAssessmentStage._compute_region_quality(front_lm, [27, 28]) > 0.7,
                "sleeveLength": l_arm_q > 0.75 and r_arm_q > 0.75,
                "waist": upper_q > 0.8 and lower_q > 0.7,
            }
            
            context.quality_assessment = {
                "overallQuality": float(overall),
                "upperBody": float(upper_q),
                "lowerBody": float(lower_q),
                "leftArm": float(l_arm_q),
                "rightArm": float(r_arm_q),
                "measurementTrust": trust
            }

            duration = (time.time() - start_time) * 1000
            context.metrics["qualityTime"] = duration
            context.log("quality_assessment", duration, "success", overall=overall)

        except Exception as e:
            duration = (time.time() - start_time) * 1000
            context.log("quality_assessment", duration, "failed", error=str(e))
            raise

    @staticmethod
    def _compute_region_quality(landmarks: List[Dict[str, Any]], joint_ids: List[int]) -> float:
        if not landmarks:
            return 0.0
            
        scores = []
        for j_id in joint_ids:
            try:
                lm = landmarks[j_id]
                scores.append(lm["quality"])
            except IndexError:
                scores.append(0.0)
                
        if not scores:
            return 0.0
            
        return sum(scores) / len(scores)
