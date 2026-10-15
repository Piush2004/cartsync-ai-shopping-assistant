import psutil
import time
import threading

class MetricsCollector:
    def __init__(self):
        self._lock = threading.Lock()
        self.jobs_processed = 0
        self.jobs_completed = 0
        self.jobs_failed = 0
        self.jobs_retried = 0
        self.start_time = time.time()
        self.execution_times = []

    def record_job_processed(self):
        with self._lock:
            self.jobs_processed += 1

    def record_job_completed(self, elapsed_time: float):
        with self._lock:
            self.jobs_completed += 1
            self.execution_times.append(elapsed_time)

    def record_job_failed(self):
        with self._lock:
            self.jobs_failed += 1

    def record_job_retried(self):
        with self._lock:
            self.jobs_retried += 1

    def get_metrics(self) -> dict:
        with self._lock:
            uptime = time.time() - self.start_time
            avg_exec_time = sum(self.execution_times) / len(self.execution_times) if self.execution_times else 0.0
            
            # System stats
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            
            return {
                "uptime_seconds": round(uptime, 1),
                "jobs_processed": self.jobs_processed,
                "jobs_completed": self.jobs_completed,
                "jobs_failed": self.jobs_failed,
                "jobs_retried": self.jobs_retried,
                "average_execution_time_seconds": round(avg_exec_time, 2),
                "system_cpu_usage_percent": cpu_percent,
                "system_memory_used_mb": round(memory.used / (1024 * 1024), 1),
                "system_memory_total_mb": round(memory.total / (1024 * 1024), 1),
                "system_memory_percent": memory.percent
            }

metrics_collector = MetricsCollector()
