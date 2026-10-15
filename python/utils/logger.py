import logging
import json
import time
from typing import Any, Dict, Optional

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
            # Remove default formatter to rely on structured JSON
            handler.setFormatter(logging.Formatter('%(message)s'))
            
    def _log(self, level: int, event: str, job_id: Optional[str] = None, stage: Optional[str] = None, 
             duration_ms: Optional[float] = None, status: Optional[str] = None, 
             error: Optional[str] = None, **kwargs: Any) -> None:
        
        log_data: Dict[str, Any] = {
            "timestamp": time.time(),
            "level": logging.getLevelName(level),
            "event": event
        }
        
        if job_id: log_data["job_id"] = job_id
        if stage: log_data["stage"] = stage
        if duration_ms is not None: log_data["duration_ms"] = duration_ms
        if status: log_data["status"] = status
        if error: log_data["error"] = error
        
        log_data.update(kwargs)
        
        self.logger.log(level, json.dumps(log_data))

    def info(self, event: str, **kwargs: Any) -> None:
        self._log(logging.INFO, event, **kwargs)
        
    def error(self, event: str, **kwargs: Any) -> None:
        self._log(logging.ERROR, event, **kwargs)
        
    def debug(self, event: str, **kwargs: Any) -> None:
        self._log(logging.DEBUG, event, **kwargs)

logger = StructuredLogger("CartSyncAI")
