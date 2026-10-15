import time
import threading
from utils.queue_client import QueueClient
from config.settings import settings

class HeartbeatManager:
    def __init__(self, queue_client: QueueClient, worker_id: str):
        self.queue_client = queue_client
        self.worker_id = worker_id
        self.active_job_id = None
        self._stop_event = threading.Event()
        self._thread = None

    def start(self, job_id: str):
        self.active_job_id = job_id
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_heartbeat_loop, daemon=True)
        self._thread.start()
        print(f"[HeartbeatManager] Heartbeat started for job: {job_id}")

    def stop(self):
        if not self.active_job_id:
            return
            
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2)
        print(f"[HeartbeatManager] Heartbeat stopped for job: {self.active_job_id}")
        self.active_job_id = None
        self._thread = None

    def _run_heartbeat_loop(self):
        while not self._stop_event.is_set():
            # Wait for interval or stop event
            # We sleep in 1-second chunks so we can terminate quickly when stop() is called.
            for _ in range(settings.HEARTBEAT_INTERVAL_SECONDS):
                if self._stop_event.is_set():
                    break
                time.sleep(1)
                
            if self._stop_event.is_set():
                break
                
            if self.active_job_id:
                try:
                    self.queue_client.send_heartbeat(
                        self.active_job_id,
                        self.worker_id,
                        settings.LEASE_EXTENSION_SECONDS
                    )
                except Exception as e:
                    print(f"[HeartbeatManager] Error sending heartbeat for job {self.active_job_id}: {e}")
