from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from workers.job_manager import JobManager
from utils.logger import logger
from utils.firebase import get_db

router = APIRouter(prefix="/jobs", tags=["jobs"])

class ProcessJobRequest(BaseModel):
    jobId: str = Field(..., description="Firestore document ID of the measurement job")
    uid: str = Field(..., description="User ID associated with the job")
    height: str | float = Field(..., description="User's height")
    unit: str = Field(default="cm", description="Height unit")
    frontImagePath: str = Field(..., description="Firebase Storage path for front image")
    sideImagePath: str = Field(..., description="Firebase Storage path for side image")
    cameraMetadata: Optional[Dict[str, Any]] = None

class JobResponse(BaseModel):
    status: str
    jobId: str
    message: str

@router.post("/process", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def process_job(request: ProcessJobRequest, background_tasks: BackgroundTasks):
    """
    Accepts a measurement processing job. The job is processed asynchronously in the background.
    """
    logger.info("Received process job request", job_id=request.jobId, uid=request.uid)
    
    # Hand off to queue abstraction
    payload = request.model_dump()
    JobManager.dispatch(request.jobId, payload, background_tasks)
    
    return JobResponse(
        status="Accepted",
        jobId=request.jobId,
        message="Job accepted and added to the processing queue."
    )

@router.get("/{job_id}")
async def get_job_status(job_id: str):
    """
    Returns the current status of a job from Firestore.
    """
    db = get_db()
    if not db:
        return {"jobId": job_id, "status": "mock_mode_active"}
        
    try:
        doc_ref = db.collection('measurementJobs').document(job_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return doc.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to retrieve job status", job_id=job_id, error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")
