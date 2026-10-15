import os
import sys
import signal
import asyncio
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from config.settings import settings
from utils.queue_client import QueueClient
from utils.heartbeat import HeartbeatManager
from utils.vram_manager import VRAMManager
from utils.metrics import metrics_collector
from workers.base_worker import BaseWorker
from workers.measurement_worker import MeasurementWorker
from workers.avatar_worker import AvatarWorker
from workers.llm_worker import LLMWorker
from workers.vton_worker import VtonWorker

app = FastAPI(title="CartSyncAI Local Compute Node", version="1.0.0")

# Global instances
queue_client = QueueClient()
vram_manager = VRAMManager()
heartbeat_manager = HeartbeatManager(queue_client, settings.WORKER_ID)

# Graceful shutdown state
shutdown_event = asyncio.Event()

# Simple Mock Worker Implementations (infra-only)

# Real VTON worker registered from workers.vton_worker

class ValidationWorker(BaseWorker):
    def __init__(self):
        super().__init__("ValidationWorker", ["VALIDATION"])

    def execute(self, payload: dict) -> dict:
        print("[ValidationWorker] Running image and pose validation...")
        from agents.validation_agent import validation_agent
        return validation_agent.validate_inputs(payload)

# Register workers
workers = [LLMWorker(), VtonWorker(), ValidationWorker(), MeasurementWorker(), AvatarWorker()]

def get_worker_for_job(job_type: str) -> BaseWorker:
    for worker in workers:
        if worker.can_handle(job_type):
            return worker
    return None

async def poll_and_process_queue():
    print(f"[Runtime] Starting compute queue polling loop (Worker ID: {settings.WORKER_ID})")
    queue_client.register_worker(settings.WORKER_ID, settings.WORKER_CAPABILITIES)
    
    while not shutdown_event.is_set():
        try:
            jobs = queue_client.poll_jobs()
            processed_any = False
            
            for job in jobs:
                if shutdown_event.is_set():
                    break
                    
                job_id = job.get('jobId')
                job_type = job.get('jobType')
                
                # Check capability
                worker = get_worker_for_job(job_type)
                if not worker:
                    continue
                    
                # Attempt to claim
                claimed = queue_client.claim_job(job_id, settings.WORKER_ID)
                if not claimed:
                    continue
                    
                processed_any = True
                print(f"[Runtime] Claimed job {job_id} ({job_type}). Starting execution...")
                metrics_collector.record_job_processed()
                
                # Start heartbeat thread
                heartbeat_manager.start(job_id)
                
                start_time = time.time()
                try:
                    from services.model_manager import model_manager
                    # Run worker execution
                    if job_type == 'LLM':
                        model_manager.load_model("ollama_qwen")
                        result = worker.execute(job.get('payload'))
                        model_manager.release_model("ollama_qwen")
                    elif job_type == 'VTON':
                        model_manager.load_model("idm_vton")
                        result = worker.execute(job.get('payload'))
                        model_manager.release_model("idm_vton")
                    else:
                        result = worker.execute(job.get('payload'))
                        
                    # Complete job
                    queue_client.complete_job(job_id, result)
                    elapsed = time.time() - start_time
                    metrics_collector.record_job_completed(elapsed)
                    print(f"[Runtime] Job {job_id} completed successfully in {elapsed:.2f}s.")
                    
                except Exception as e:
                    elapsed = time.time() - start_time
                    print(f"[Runtime] Job {job_id} failed: {e}")
                    metrics_collector.record_job_failed()
                    
                    # Update status to retry or move to DLQ
                    retry_count = (job.get('retryCount') or 0) + 1
                    status = queue_client.fail_job(job_id, str(e), retry_count)
                    if status == 'RETRYING':
                        metrics_collector.record_job_retried()
                        
                finally:
                    # Stop heartbeat thread
                    heartbeat_manager.stop()
                    
            if not processed_any:
                # Sleep briefly if no jobs were processed to limit CPU usage
                await asyncio.sleep(settings.POLL_INTERVAL_SECONDS)
                
        except Exception as e:
            print(f"[Runtime] Poller encountered error: {e}")
            await asyncio.sleep(settings.POLL_INTERVAL_SECONDS)

    print("[Runtime] Polling loop stopped.")
    # Graceful cleanup
    queue_client.deregister_worker(settings.WORKER_ID)

@app.on_event("startup")
async def startup_event():
    # Run polling loop as a background task in the asyncio loop
    asyncio.create_task(poll_and_process_queue())

# OS Signal handlers for graceful shutdown
def handle_shutdown_signal(signum, frame):
    print(f"\n[Runtime] Received signal {signum}. Initiating graceful shutdown...")
    shutdown_event.set()

# Try to register signal handlers for graceful shutdown
try:
    signal.signal(signal.SIGINT, handle_shutdown_signal)
    signal.signal(signal.SIGTERM, handle_shutdown_signal)
except ValueError:
    # Occurs if not run in the main thread (e.g. some server environments)
    pass

# REST API Endpoints
class ValidationPayload(BaseModel):
    frontImageUrl: str
    sideImageUrl: str

@app.post("/validate")
async def validate_images(payload: ValidationPayload):
    from agents.validation_agent import validation_agent
    try:
        result = validation_agent.validate_inputs(payload.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {
        "status": "ONLINE" if not shutdown_event.is_set() else "SHUTTING_DOWN",
        "worker_id": settings.WORKER_ID,
        "vram_state": vram_manager.get_state(),
        "metrics": metrics_collector.get_metrics()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
