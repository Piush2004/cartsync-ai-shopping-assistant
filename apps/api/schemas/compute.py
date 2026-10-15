from pydantic import BaseModel
from typing import Any, Dict, List, Literal, Optional
from datetime import datetime

JobType = Literal["MEASUREMENT", "AVATAR", "VTON", "LLM"]
JobStatus = Literal["PENDING", "PROCESSING", "COMPLETED", "FAILED", "RETRYING", "CANCELLED"]
JobPriority = Literal["LOW", "NORMAL", "HIGH", "CRITICAL"]
WorkerStatus = Literal["ONLINE", "OFFLINE"]


class ComputeJobCreate(BaseModel):
    """
    Enqueue payload. Nothing in the product calls this endpoint yet this
    phase (no producer wired in) -- it exists so the contract is complete
    and testable, matching queue.service.ts's enqueue().
    """
    uid: Optional[str] = None
    job_type: JobType
    priority: JobPriority = "NORMAL"
    payload: Dict[str, Any] = {}
    max_retries: int = 3


class ComputeJobResponse(BaseModel):
    id: str
    uid: Optional[str]
    job_type: JobType
    priority: JobPriority
    status: JobStatus
    payload: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int
    max_retries: int
    worker_id: Optional[str] = None
    heartbeat_at: Optional[datetime] = None
    lease_expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CompleteJobRequest(BaseModel):
    result: Dict[str, Any] = {}


class FailJobRequest(BaseModel):
    error: str


class WorkerRegisterRequest(BaseModel):
    worker_id: str
    hostname: str
    platform: str
    cpu: Optional[str] = None
    ram_gb: Optional[int] = None
    gpu: Optional[str] = None
    vram_gb: Optional[int] = None
    capabilities: List[JobType] = []


class WorkerRegistryResponse(BaseModel):
    worker_id: str
    hostname: str
    platform: str
    cpu: Optional[str] = None
    ram_gb: Optional[int] = None
    gpu: Optional[str] = None
    vram_gb: Optional[int] = None
    status: WorkerStatus
    active_jobs: int
    capabilities: List[str]
    last_heartbeat: datetime
    registered_at: datetime

    class Config:
        from_attributes = True
