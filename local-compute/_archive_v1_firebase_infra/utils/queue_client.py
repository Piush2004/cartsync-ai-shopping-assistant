import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore import Transaction
import os
from config.settings import settings

class QueueClient:
    def __init__(self):
        self.db = None
        self._initialize_firebase()

    def _initialize_firebase(self):
        if not firebase_admin._apps:
            cred_path = settings.FIREBASE_SERVICE_ACCOUNT_KEY_PATH
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print("[QueueClient] Firebase admin initialized successfully.")
            else:
                print(f"[QueueClient] Warning: Firebase service account key not found at {cred_path}. Operations will run in offline/test mode.")
                return
        self.db = firestore.client()

    def register_worker(self, worker_id: str, capabilities: list):
        if not self.db:
            return
        
        gpu_temp = 62.0
        try:
            import subprocess
            res = subprocess.run(['nvidia-smi', '--query-gpu=temperature.gpu', '--format=csv,noheader,nounits'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=2)
            if res.returncode == 0:
                gpu_temp = float(res.stdout.strip())
        except Exception:
            pass

        allocated_vram = 2400.0 # Standard model VRAM load default (MB)

        worker_ref = self.db.collection('workers').document(worker_id)
        worker_ref.set({
            'workerId': worker_id,
            'status': 'ONLINE',
            'capabilities': capabilities,
            'lastActive': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'maxVramGb': settings.MAX_VRAM_GB,
            'gpuTemp': gpu_temp,
            'allocatedVram': allocated_vram,
            'modelLoadingTime': 1.8
        }, merge=True)
        print(f"[QueueClient] Registered worker: {worker_id} (GPU Temp: {gpu_temp}°C, VRAM Allocated: {allocated_vram}MB)")

    def deregister_worker(self, worker_id: str):
        if not self.db:
            return
        try:
            worker_ref = self.db.collection('workers').document(worker_id)
            worker_ref.update({
                'status': 'OFFLINE',
                'lastActive': datetime.datetime.now(datetime.timezone.utc).isoformat()
            })
            print(f"[QueueClient] Deregistered worker: {worker_id}")
        except Exception as e:
            print(f"[QueueClient] Failed to deregister worker {worker_id}: {e}")

    def poll_jobs(self) -> list:
        if not self.db:
            return []
            
        # Poll jobs that are PENDING or RETRYING, order by priority/timestamp.
        # We query for PENDING and RETRYING jobs.
        jobs = []
        try:
            query_pending = self.db.collection('computeQueue').where('status', '==', 'PENDING')
            for doc in query_pending.stream():
                job = doc.to_dict()
                job['jobId'] = doc.id
                jobs.append(job)
                
            query_retrying = self.db.collection('computeQueue').where('status', '==', 'RETRYING')
            for doc in query_retrying.stream():
                job = doc.to_dict()
                job['jobId'] = doc.id
                jobs.append(job)
        except Exception as e:
            print(f"[QueueClient] Error polling jobs: {e}")
            
        return jobs

    def claim_job(self, job_id: str, worker_id: str) -> bool:
        if not self.db:
            return False
            
        job_ref = self.db.collection('computeQueue').document(job_id)
        transaction = self.db.transaction()
        
        @firestore.transactional
        def _claim_transaction(tx: Transaction, ref):
            snapshot = ref.get(transaction=tx)
            if not snapshot.exists:
                return False
                
            job = snapshot.to_dict()
            status = job.get('status')
            
            # Lease check (if it was claimed but worker crashed, check if lease expired)
            lease_expires = job.get('leaseExpiresAt')
            now_dt = datetime.datetime.now(datetime.timezone.utc)
            is_expired = False
            
            if lease_expires:
                try:
                    expires_dt = datetime.datetime.fromisoformat(lease_expires.replace('Z', '+00:00'))
                    is_expired = now_dt > expires_dt
                except Exception:
                    pass
            
            # Only claim if PENDING, RETRYING, or lease expired
            if status not in ['PENDING', 'RETRYING'] and not is_expired:
                return False
                
            lease_expires_at = (now_dt + datetime.timedelta(seconds=settings.LEASE_DURATION_SECONDS)).isoformat()
            
            tx.update(ref, {
                'status': 'PROCESSING',
                'workerId': worker_id,
                'startedAt': job.get('startedAt') or now_dt.isoformat(),
                'heartbeatAt': now_dt.isoformat(),
                'leaseExpiresAt': lease_expires_at,
                'retryCount': (job.get('retryCount') or 0) + (1 if is_expired else 0)
            })
            return True

        try:
            return _claim_transaction(transaction, job_ref)
        except Exception as e:
            print(f"[QueueClient] Transaction failed for job {job_id}: {e}")
            return False

    def send_heartbeat(self, job_id: str, worker_id: str, lease_extension_seconds: int):
        if not self.db:
            return
            
        job_ref = self.db.collection('computeQueue').document(job_id)
        now_dt = datetime.datetime.now(datetime.timezone.utc)
        lease_expires_at = (now_dt + datetime.timedelta(seconds=lease_extension_seconds)).isoformat()
        
        job_ref.update({
            'heartbeatAt': now_dt.isoformat(),
            'leaseExpiresAt': lease_expires_at
        })

    def complete_job(self, job_id: str, result: dict):
        if not self.db:
            return
            
        job_ref = self.db.collection('computeQueue').document(job_id)
        job_ref.update({
            'status': 'COMPLETED',
            'result': result,
            'completedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'workerId': None,
            'leaseExpiresAt': None,
            'heartbeatAt': None
        })

    def fail_job(self, job_id: str, error: str, retry_count: int) -> str:
        """
        Fails or retries the job. Moves to Dead Letter Queue if MAX_RETRIES is exceeded.
        """
        if not self.db:
            return 'FAILED'
            
        if retry_count >= settings.MAX_RETRIES:
            self._move_to_dlq(job_id, error)
            return 'DEAD_LETTER'
        else:
            job_ref = self.db.collection('computeQueue').document(job_id)
            job_ref.update({
                'status': 'RETRYING',
                'error': error,
                'workerId': None,
                'leaseExpiresAt': None,
                'heartbeatAt': None
            })
            return 'RETRYING'

    def _move_to_dlq(self, job_id: str, error: str):
        job_ref = self.db.collection('computeQueue').document(job_id)
        snapshot = job_ref.get()
        
        if snapshot.exists:
            job_data = snapshot.to_dict()
            job_data['originalJobId'] = job_id
            job_data['status'] = 'FAILED'
            job_data['error'] = f"Exceeded max retries. Final error: {error}"
            job_data['failedAt'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            
            # Write to deadLetterQueue
            self.db.collection('deadLetterQueue').document(job_id).set(job_data)
            
            # Delete from computeQueue
            job_ref.delete()
            print(f"[QueueClient] Job {job_id} moved to deadLetterQueue due to excessive failures.")
