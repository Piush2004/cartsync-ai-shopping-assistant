import time
from typing import Dict, Any
from utils.logger import logger
from utils.firebase import get_db
from pipeline.image_handler import ImageHandler
from pipeline.stages import AIStages
from firebase_admin import firestore

class WorkerOrchestrator:
    @staticmethod
    def _update_stage(job_id: str, stage: str, status: str = "processing", error: str = None) -> None:
        db = get_db()
        if not db:
            logger.debug("Mock mode: Update stage", job_id=job_id, stage=stage, status=status)
            return

        try:
            doc_ref = db.collection('measurementJobs').document(job_id)
            update_data = {
                "processingStage": stage,
                "status": status
            }
            if error:
                update_data["error"] = error
            if status == "completed" or status == "failed":
                update_data["completedAt"] = firestore.SERVER_TIMESTAMP
                
            doc_ref.set(update_data, merge=True)
            logger.info(f"Updated job stage to {stage}", job_id=job_id)
        except Exception as e:
            logger.error("Failed to update Firestore", job_id=job_id, error=str(e))

    @staticmethod
    def _save_measurements(uid: str, measurements: Dict[str, float]) -> None:
        db = get_db()
        if not db:
            return
            
        try:
            db.collection('users').document(uid).set({
                "measurements": measurements,
                "hasAvatar": True, # Preparation for avatar phase
            }, merge=True)
        except Exception as e:
            logger.error("Failed to save measurements to user profile", error=str(e))

    @staticmethod
    def process_job(job_id: str, payload: Dict[str, Any]) -> None:
        """
        Main pipeline orchestrator.
        """
        start_time = time.time()
        uid = payload.get("uid")
        front_path = payload.get("frontImagePath")
        side_path = payload.get("sideImagePath")
        
        # Convert height to standardized cm value
        height_raw = payload.get("height", 175)
        unit = payload.get("unit", "cm")
        height_cm = float(height_raw) if unit == "cm" else float(height_raw) * 30.48

        local_files = []
        
        try:
            # 1. Preparing (Worker Picked Up)
            WorkerOrchestrator._update_stage(job_id, "preparing")
            logger.info("Starting job processing", job_id=job_id, uid=uid)

            # 2. Download Images
            WorkerOrchestrator._update_stage(job_id, "uploading") # Reusing 'uploading' to signify fetching from Storage
            front_local = ImageHandler.download_and_validate(front_path, job_id, "front")
            side_local = ImageHandler.download_and_validate(side_path, job_id, "side")
            local_files.extend([front_local, side_local])

            # 3. Pose Detection
            WorkerOrchestrator._update_stage(job_id, "pose")
            pose_data = AIStages.extract_pose(job_id, front_local, side_local)

            # 4. Depth Estimation
            WorkerOrchestrator._update_stage(job_id, "depth")
            depth_data = AIStages.estimate_depth(job_id, front_local, side_local)

            # 5. Measurement
            WorkerOrchestrator._update_stage(job_id, "measurement")
            measurements = AIStages.compute_measurements(job_id, height_cm, pose_data, depth_data)
            measurements["height"] = round(height_cm, 1)

            # 6. Saving Results
            WorkerOrchestrator._update_stage(job_id, "saving")
            WorkerOrchestrator._save_measurements(uid, measurements)

            # 7. Completed
            duration_ms = (time.time() - start_time) * 1000
            WorkerOrchestrator._update_stage(job_id, "completed", status="completed")
            logger.info("Job completed successfully", job_id=job_id, duration_ms=duration_ms)

        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error("Job failed", job_id=job_id, error=str(e), duration_ms=duration_ms)
            WorkerOrchestrator._update_stage(job_id, "failed", status="failed", error=str(e))
            
        finally:
            # Cleanup
            ImageHandler.cleanup_local_files(local_files)
