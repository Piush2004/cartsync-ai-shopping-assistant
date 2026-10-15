import os
import uuid
import socket

class Settings:
    # Worker configuration
    WORKER_ID = os.getenv("WORKER_ID", f"worker-{socket.gethostname()}-{uuid.uuid4().hex[:6]}")
    WORKER_CAPABILITIES = ["LLM", "VTON", "VALIDATION"] # Worker capability tags
    
    # Firebase configuration
    FIREBASE_SERVICE_ACCOUNT_KEY_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH", "./serviceAccountKey.json")
    
    # Queue polling configurations
    POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "2"))
    LEASE_DURATION_SECONDS = int(os.getenv("LEASE_DURATION_SECONDS", "180")) # 3 minutes initial lease
    LEASE_EXTENSION_SECONDS = int(os.getenv("LEASE_EXTENSION_SECONDS", "60")) # 1 minute extensions
    HEARTBEAT_INTERVAL_SECONDS = int(os.getenv("HEARTBEAT_INTERVAL_SECONDS", "30")) # every 30 seconds
    
    # Retry configurations
    MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
    
    # VRAM / Resource configuration
    MAX_VRAM_GB = int(os.getenv("MAX_VRAM_GB", "8"))
    
    # Ollama Model Configurations (Logical Names)
    SUPERVISOR_MODEL = os.getenv("SUPERVISOR_MODEL", "qwen3:8b")
    FAST_MODEL = os.getenv("FAST_MODEL", "qwen3:4b")
    CODER_MODEL = os.getenv("CODER_MODEL", "qwen2.5-coder:7b")
    EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
    LLAMA_MODEL = os.getenv("LLAMA_MODEL", "llama3.1:8b")
    VISION_MODEL = os.getenv("VISION_MODEL", "llava:7b")
    
settings = Settings()
