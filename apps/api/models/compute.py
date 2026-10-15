from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class ComputeJob(Base):
    """
    A unit of heavy compute (LLM inference, avatar generation, virtual
    try-on, or camera measurement processing) meant to run on a user's own
    local compute node rather than in the request path of apps/api.

    Field names and the PENDING -> PROCESSING -> COMPLETED/FAILED/RETRYING/
    CANCELLED state machine mirror functions/src/types/queue.types.ts's
    ComputeJob and functions/src/services/queue.service.ts's QueueService
    almost 1:1 -- this is the same contract, ported from a Firestore
    collection onto a SQLAlchemy table (see
    docs/architecture/canonical-architecture-decision.md for why: Firestore
    is the disconnected legacy stack, apps/api is the real one).
    """
    __tablename__ = "compute_jobs"

    id = Column(String, primary_key=True, index=True)  # jobId
    # Nullable: no producer writes real jobs yet this phase (infra only).
    uid = Column(String, ForeignKey("users.id"), nullable=True)

    job_type = Column(String, nullable=False, index=True)  # MEASUREMENT | AVATAR | VTON | LLM
    priority = Column(String, nullable=False, default="NORMAL")  # LOW | NORMAL | HIGH | CRITICAL
    status = Column(String, nullable=False, default="PENDING", index=True)
    # PENDING | PROCESSING | COMPLETED | FAILED | RETRYING | CANCELLED

    payload = Column(JSON, nullable=False, default=dict)
    result = Column(JSON, nullable=True)
    error = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    retry_count = Column(Integer, nullable=False, default=0)
    max_retries = Column(Integer, nullable=False, default=3)

    # Worker lease mechanism -- see routers/compute.py's claim endpoint for
    # how these three fields implement "never process the same job twice."
    worker_id = Column(String, nullable=True, index=True)
    heartbeat_at = Column(DateTime, nullable=True)
    lease_expires_at = Column(DateTime, nullable=True, index=True)

    user = relationship("User")


class WorkerRegistry(Base):
    """
    A local compute node's self-reported identity and current state.
    Rows are upserted by the worker on registration/heartbeat, never by an
    end user.
    """
    __tablename__ = "worker_registry"

    worker_id = Column(String, primary_key=True, index=True)
    hostname = Column(String, nullable=False)
    platform = Column(String, nullable=False)
    cpu = Column(String, nullable=True)
    ram_gb = Column(Integer, nullable=True)
    gpu = Column(String, nullable=True)
    vram_gb = Column(Integer, nullable=True)

    status = Column(String, nullable=False, default="ONLINE")  # ONLINE | OFFLINE
    active_jobs = Column(Integer, nullable=False, default=0)
    capabilities = Column(JSON, nullable=False, default=list)  # e.g. ["MEASUREMENT", "LLM"]

    last_heartbeat = Column(DateTime, default=datetime.utcnow)
    registered_at = Column(DateTime, default=datetime.utcnow)
