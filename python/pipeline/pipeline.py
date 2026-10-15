import time
from pipeline.context import PipelineContext
from pipeline.image_handler import ImageDownloadStage
from pipeline.pose import PoseStage
from pipeline.depth import DepthStage
from pipeline.calibration import CalibrationStage
from utils.firebase import get_db
from firebase_admin import firestore
from utils.logger import logger
from config.settings import settings

class PipelineOrchestrator:
    @staticmethod
    def _update_stage(context: PipelineContext, stage: str, status: str = "running", error: str = None) -> None:
        db = get_db()
        if not db:
            logger.debug("Mock mode: Update stage", job_id=context.job_id, stage=stage, status=status)
            return

        try:
            doc_ref = db.collection('measurementJobs').document(context.job_id)
            update_data = {
                "processingStage": stage,
                "status": status,
                "metrics": context.metrics
            }
            if error:
                update_data["error"] = error
            if status in ["completed", "failed"]:
                update_data["completedAt"] = firestore.SERVER_TIMESTAMP
                
            doc_ref.set(update_data, merge=True)
        except Exception as e:
            logger.error("Failed to update Firestore", job_id=context.job_id, error=str(e))

    @staticmethod
    def _save_data(context: PipelineContext) -> None:
        start_time = time.time()
        db = get_db()
        if not db:
            return
            
        try:
            # 1. Update measurementJobs (Status, Metrics, Timestamps)
            job_ref = db.collection('measurementJobs').document(context.job_id)
            job_update = {
                "processingStage": "save",
                "status": "completed",
                "metrics": context.metrics,
                "completedAt": firestore.SERVER_TIMESTAMP
            }
            job_ref.set(job_update, merge=True)

            # 2. Update measurementResults (AI Outputs)
            results_ref = db.collection('measurementResults').document(context.job_id)
            results_data = {
                "uid": context.uid,
                "jobId": context.job_id,
                "pose": {
                    "front": {
                        "landmarks": context.front_landmarks,
                        "worldLandmarks": context.front_world_landmarks
                    },
                    "side": {
                        "landmarks": context.side_landmarks,
                        "worldLandmarks": context.side_world_landmarks
                    },
                    "confidence": context.pose_confidence,
                    "score": context.pose_score,
                    "errors": context.pose_errors,
                    "valid": len(context.pose_errors) == 0
                }
            }
            
            if context.front_depth_png_path and context.side_depth_png_path:
                results_data["depth"] = {
                    "front": {
                        "png": context.front_depth_png_path,
                        "npy": context.front_depth_npy_path
                    },
                    "side": {
                        "png": context.side_depth_png_path,
                        "npy": context.side_depth_npy_path
                    },
                    "quality": context.depth_quality,
                    "resolution": context.depth_resolution,
                    "model": context.depth_metadata
                }
                
            if context.calibration:
                results_data["calibration"] = context.calibration
                
                # Keep both raw and refined skeletons for debuggability
                results_data["calibration"]["rawMetricLandmarks"] = context.metric_landmarks
                
                if context.refined_skeleton:
                    results_data["calibration"]["refinedLandmarks"] = context.refined_skeleton
                    results_data["calibration"]["refinementWarnings"] = context.refinement_warnings
                    
                if context.quality_assessment:
                    results_data["qualityAssessment"] = context.quality_assessment
                    
            if context.measurements:
                results_data["measurements"] = context.measurements
                
            if context.evaluation_results:
                results_data["evaluation"] = context.evaluation_results
                
            if context.size_recommendations:
                results_data["sizeRecommendations"] = context.size_recommendations

            results_ref.set(results_data, merge=True)
            
            duration = (time.time() - start_time) * 1000
            context.log("save", duration, "success")
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            context.log("save", duration, "failed", error=str(e))
            raise

    @staticmethod
    def execute(context: PipelineContext) -> None:
        pipeline_start = time.time()
        
        try:
            # 1. Download & Prepare
            PipelineOrchestrator._update_stage(context, "download")
            ImageDownloadStage.execute(context)
            
            # 2. Pose
            PipelineOrchestrator._update_stage(context, "pose")
            PoseStage.execute(context)
            
            # 3. Depth
            PipelineOrchestrator._update_stage(context, "depth")
            DepthStage.execute(context)
            
            # 4. Calibration (Phase 4.4A)
            PipelineOrchestrator._update_stage(context, "calibration")
            CalibrationStage.execute(context)
            
            # 5. Skeleton Refinement (Phase 4.4B)
            from pipeline.refinement import SkeletonRefinementStage
            PipelineOrchestrator._update_stage(context, "refinement")
            SkeletonRefinementStage.execute(context)
            
            # 6. Quality Assessment (Phase 4.4C)
            from pipeline.quality_assessment import QualityAssessmentStage
            PipelineOrchestrator._update_stage(context, "quality_assessment")
            QualityAssessmentStage.execute(context)
            
            # 7. Measurement Engine (Phase 4.4D/E)
            from pipeline.measurement import MeasurementStage
            PipelineOrchestrator._update_stage(context, "measurement")
            MeasurementStage.execute(context)
            
            # 8. Evaluation Engine (Phase 5.1)
            from pipeline.evaluation import EvaluationStage
            PipelineOrchestrator._update_stage(context, "evaluation")
            EvaluationStage.execute(context)
            
            # 9. Size Recommendation Engine (Phase 5.3)
            from pipeline.sizing import SizeRecommendationEngine
            PipelineOrchestrator._update_stage(context, "size_recommendation")
            SizeRecommendationEngine.execute(context)
            
            # 10. Save to Firestore
            PipelineOrchestrator._update_stage(context, "save")
            PipelineOrchestrator._save_data(context)
            
            # We explicitly STOP here for Phase 5.3.
            # Virtual Try-On and Avatar Generation are bypassed.
            
            # Complete
            duration_ms = (time.time() - pipeline_start) * 1000
            context.metrics["totalTime"] = duration_ms
            PipelineOrchestrator._update_stage(context, "save", status="completed")
            context.log("pipeline", duration_ms, "success")

        except Exception as e:
            duration_ms = (time.time() - pipeline_start) * 1000
            context.metrics["totalTime"] = duration_ms
            context.log("pipeline", duration_ms, "failed", error=str(e))
            PipelineOrchestrator._update_stage(context, "failed", status="failed", error=str(e))
            
        finally:
            context.cleanup()
