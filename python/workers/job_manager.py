from typing import Dict, Any
from pipeline.context import PipelineContext
from pipeline.pipeline import PipelineOrchestrator
from utils.logger import logger

class JobManager:
    """
    Abstractions for job queueing. Currently uses FastAPI BackgroundTasks natively.
    Can be swapped to Celery or Google Cloud Tasks without changing routes.
    """
    
    @staticmethod
    def _execute_worker(job_id: str, payload: Dict[str, Any]) -> None:
        logger.info("Worker picked up job", job_id=job_id)
        
        uid = payload.get("uid")
        front_path = payload.get("frontImagePath")
        side_path = payload.get("sideImagePath")
        
        height_raw = payload.get("height", 175)
        unit = payload.get("unit", "cm")
        height_cm = float(height_raw) if unit == "cm" else float(height_raw) * 30.48
        
        metadata = payload.get("cameraMetadata", {})

        context = PipelineContext(
            job_id=job_id,
            uid=uid,
            height_cm=height_cm,
            front_storage_path=front_path,
            side_storage_path=side_path,
            metadata=metadata
        )
        
        # Pass context into the agnostic pipeline
        PipelineOrchestrator.execute(context)

    @staticmethod
    def dispatch(job_id: str, payload: Dict[str, Any], background_tasks) -> None:
        """
        Dispatches the job to the configured runner.
        Currently using background_tasks.
        """
        logger.info("Dispatching job to queue", job_id=job_id)
        background_tasks.add_task(JobManager._execute_worker, job_id, payload)
