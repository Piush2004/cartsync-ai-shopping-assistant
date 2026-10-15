from pydantic_settings import BaseSettings

class RuntimeConfig(BaseSettings):
    ENV: str = "development"
    API_VERSION: str = "1.0.0"
    API_TITLE: str = "CartSyncAI Backend"
    MAX_CONCURRENT_WORKERS: int = 1
    JOB_TIMEOUT_SECONDS: int = 300
    USE_GPU: bool = False
    
    class Config:
        env_file = ".env"
        extra = "ignore"
