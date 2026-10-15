from datetime import datetime, timedelta
from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, case, or_, update
from sqlalchemy.orm import Session

from database import get_db
from core.deps import verify_worker_api_key
from models.compute import ComputeJob, WorkerRegistry
from schemas.compute import (
    ComputeJobCreate,
    ComputeJobResponse,
    CompleteJobRequest,
    FailJobRequest,
    WorkerRegisterRequest,
    WorkerRegistryResponse,
)

router = APIRouter(dependencies=[Depends(verify_worker_api_key)])

DEFAULT_LEASE_MINUTES = 3
DEFAULT_LEASE_EXTENSION_MINUTES = 1
POLL_LIMIT = 20


# ============================================================
# Worker registry
# ============================================================

@router.post("/workers/register", response_model=WorkerRegistryResponse)
def register_worker(payload: WorkerRegisterRequest, db: Session = Depends(get_db)):
    worker = db.query(WorkerRegistry).filter(WorkerRegistry.worker_id == payload.worker_id).first()
    now = datetime.utcnow()
    if worker:
        worker.hostname = payload.hostname
        worker.platform = payload.platform
        worker.cpu = payload.cpu
        worker.ram_gb = payload.ram_gb
        worker.gpu = payload.gpu
        worker.vram_gb = payload.vram_gb
        worker.capabilities = payload.capabilities
        worker.status = "ONLINE"
        worker.last_heartbeat = now
    else:
        worker = WorkerRegistry(
            worker_id=payload.worker_id,
            hostname=payload.hostname,
            platform=payload.platform,
            cpu=payload.cpu,
            ram_gb=payload.ram_gb,
            gpu=payload.gpu,
            vram_gb=payload.vram_gb,
            capabilities=payload.capabilities,
            status="ONLINE",
            active_jobs=0,
            last_heartbeat=now,
            registered_at=now,
        )
        db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


@router.post("/workers/{worker_id}/heartbeat", response_model=WorkerRegistryResponse)
def worker_heartbeat(worker_id: str, active_jobs: int = 0, db: Session = Depends(get_db)):
    worker = db.query(WorkerRegistry).filter(WorkerRegistry.worker_id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not registered")
    worker.status = "ONLINE"
    worker.active_jobs = active_jobs
    worker.last_heartbeat = datetime.utcnow()
    db.commit()
    db.refresh(worker)
    return worker


@router.post("/workers/{worker_id}/deregister")
def deregister_worker(worker_id: str, db: Session = Depends(get_db)):
    worker = db.query(WorkerRegistry).filter(WorkerRegistry.worker_id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not registered")
    worker.status = "OFFLINE"
    worker.active_jobs = 0
    db.commit()
    return {"status": "ok"}


@router.get("/workers", response_model=List[WorkerRegistryResponse])
def list_workers(db: Session = Depends(get_db)):
    return db.query(WorkerRegistry).order_by(WorkerRegistry.registered_at.desc()).all()


# ============================================================
# Job queue
# ============================================================

@router.post("/jobs", response_model=ComputeJobResponse)
def enqueue_job(payload: ComputeJobCreate, db: Session = Depends(get_db)):
    """
    Nothing in the product calls this yet this phase -- no producer is
    wired in (see docs/architecture/canonical-architecture-decision.md and
    the Phase 4 plan). Implemented so the queue contract is complete and
    testable end-to-end.
    """
    job = ComputeJob(
        id=str(uuid.uuid4()),
        uid=payload.uid,
        job_type=payload.job_type,
        priority=payload.priority,
        status="PENDING",
        payload=payload.payload,
        retry_count=0,
        max_retries=payload.max_retries,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("/jobs/poll", response_model=List[ComputeJobResponse])
def poll_jobs(
    capabilities: List[str] = Query(default=[]),
    db: Session = Depends(get_db),
):
    """
    Lists jobs a worker with the given capabilities could claim: PENDING or
    RETRYING, or PROCESSING with an expired lease (a worker that died
    without heartbeating). Does not claim anything -- see /jobs/{id}/claim,
    which is the atomic step. This split (list, then attempt to claim one)
    matches functions/src/services/queue.service.ts's separation of
    listing/querying from the transactional claimJob().
    """
    now = datetime.utcnow()
    query = db.query(ComputeJob).filter(
        or_(
            ComputeJob.status.in_(["PENDING", "RETRYING"]),
            and_(ComputeJob.status == "PROCESSING", ComputeJob.lease_expires_at < now),
        )
    )
    if capabilities:
        query = query.filter(ComputeJob.job_type.in_(capabilities))
    return query.order_by(ComputeJob.created_at.asc()).limit(POLL_LIMIT).all()


@router.post("/jobs/{job_id}/claim")
def claim_job(
    job_id: str,
    worker_id: str,
    lease_minutes: int = DEFAULT_LEASE_MINUTES,
    db: Session = Depends(get_db),
):
    """
    Atomic claim: a single UPDATE ... WHERE guards against double-claiming
    the same job, mirroring queue.service.ts's Firestore-transaction
    claimJob(). SQLite serializes writes on a single connection, so the
    WHERE clause + rowcount check is a real atomicity guarantee here, not
    just an optimistic best-effort -- if two requests race to claim the
    same job, exactly one UPDATE affects a row; the other affects zero.
    """
    now = datetime.utcnow()
    lease_expires_at = now + timedelta(minutes=lease_minutes)
    lease_expired = and_(ComputeJob.status == "PROCESSING", ComputeJob.lease_expires_at < now)

    stmt = (
        update(ComputeJob)
        .where(ComputeJob.id == job_id)
        .where(or_(ComputeJob.status.in_(["PENDING", "RETRYING"]), lease_expired))
        .values(
            status="PROCESSING",
            worker_id=worker_id,
            started_at=case((ComputeJob.started_at.is_(None), now), else_=ComputeJob.started_at),
            heartbeat_at=now,
            lease_expires_at=lease_expires_at,
            retry_count=case((lease_expired, ComputeJob.retry_count + 1), else_=ComputeJob.retry_count),
        )
    )
    result = db.execute(stmt)
    db.commit()

    claimed = result.rowcount == 1
    if not claimed:
        job_exists = db.query(ComputeJob).filter(ComputeJob.id == job_id).first()
        if not job_exists:
            raise HTTPException(status_code=404, detail="Job not found")
    return {"claimed": claimed}


def _get_owned_job(job_id: str, worker_id: str, db: Session) -> ComputeJob:
    job = db.query(ComputeJob).filter(ComputeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.worker_id != worker_id:
        raise HTTPException(status_code=409, detail="Worker ID mismatch -- job is not leased to this worker")
    return job


@router.post("/jobs/{job_id}/heartbeat", response_model=ComputeJobResponse)
def job_heartbeat(
    job_id: str,
    worker_id: str,
    lease_extension_minutes: int = DEFAULT_LEASE_EXTENSION_MINUTES,
    db: Session = Depends(get_db),
):
    job = _get_owned_job(job_id, worker_id, db)
    now = datetime.utcnow()
    job.heartbeat_at = now
    job.lease_expires_at = now + timedelta(minutes=lease_extension_minutes)
    db.commit()
    db.refresh(job)
    return job


@router.post("/jobs/{job_id}/complete", response_model=ComputeJobResponse)
def complete_job(job_id: str, worker_id: str, payload: CompleteJobRequest, db: Session = Depends(get_db)):
    job = _get_owned_job(job_id, worker_id, db)
    job.status = "COMPLETED"
    job.result = payload.result
    job.completed_at = datetime.utcnow()
    job.worker_id = None
    job.lease_expires_at = None
    db.commit()
    db.refresh(job)
    return job


@router.post("/jobs/{job_id}/fail", response_model=ComputeJobResponse)
def fail_job(job_id: str, worker_id: str, payload: FailJobRequest, db: Session = Depends(get_db)):
    """
    Same retry policy as the original queue.service.ts: increment
    retry_count, and if still under max_retries move back to RETRYING
    (clearing the lease so it's immediately reclaimable by any worker,
    including this one); otherwise the job is terminally FAILED.
    """
    job = _get_owned_job(job_id, worker_id, db)
    job.retry_count += 1
    job.error = payload.error
    job.worker_id = None
    job.lease_expires_at = None
    job.heartbeat_at = None

    if job.retry_count < job.max_retries:
        job.status = "RETRYING"
    else:
        job.status = "FAILED"
        job.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(job)
    return job


@router.post("/jobs/{job_id}/cancel", response_model=ComputeJobResponse)
def cancel_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ComputeJob).filter(ComputeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "CANCELLED"
    job.completed_at = datetime.utcnow()
    job.worker_id = None
    job.lease_expires_at = None
    job.heartbeat_at = None
    db.commit()
    db.refresh(job)
    return job


@router.get("/jobs/{job_id}", response_model=ComputeJobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ComputeJob).filter(ComputeJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
