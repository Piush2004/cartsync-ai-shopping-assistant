import json
import logging
import sys
from datetime import datetime, timezone


class _JsonFormatter(logging.Formatter):
    """Same field shape as apps/api's pythonjsonlogger setup (main.py), without
    adding python-json-logger as a dependency here -- this node's requirements
    are deliberately minimal (see requirements.txt)."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "asctime": datetime.now(timezone.utc).isoformat(),
            "levelname": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(_JsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger
